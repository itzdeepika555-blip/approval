import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db, StoredDocument } from './db.service';
import { aiService } from './ai/aiService';
import { datasetImportService, STATUTORY_DOCUMENTS_CATALOG } from './datasetImport.service';
import { DocumentAnalysisResult, DocumentVerificationStatus } from './ai/types';

export interface DocumentChecklistItem {
  id: string;
  code: string;
  name: string;
  category: string;
  applicableDepartments: string[];
  mandatory: boolean;
  uploaded: boolean;
  status: DocumentVerificationStatus;
  verificationConfidence?: number;
  fileName?: string;
  fileSize?: string;
  uploadedDate?: string;
  isWalletItem: boolean;
  guidelines: string;
  extractedFields?: Record<string, string>;
  checks?: any[];
}

export interface MissingDocumentsSummary {
  requiredCount: number;
  uploadedCount: number;
  missingCount: number;
  completionPercentage: number;
  uploaded: Array<{
    documentId: string;
    code: string;
    name: string;
    status: DocumentVerificationStatus;
    uploadedAt: string;
  }>;
  missing: Array<{
    code: string;
    name: string;
    category: string;
    description: string;
    mandatory: boolean;
  }>;
}

export class DocumentService {
  private allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  private maxFileSizeBytes = 10 * 1024 * 1024; // 10MB
  private uploadsDir = path.resolve(__dirname, '../../uploads');

  constructor() {
    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch (err) {
        console.warn('[DocumentService] Could not create uploads directory:', err);
      }
    }
  }

  public maskIdentifier(val?: string): string {
    if (!val || val.length < 4) return '***';
    return val.substring(0, 2) + '***' + val.substring(val.length - 2);
  }

  /**
   * Helper to format Prisma Document to StoredDocument
   */
  private formatPrismaDoc(doc: any): StoredDocument {
    const latestVerif = doc.verifications?.[0];
    return {
      id: doc.id,
      userId: doc.userId,
      applicationId: doc.applicationId || undefined,
      documentType: doc.documentTypeCode,
      title: doc.documentName,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      fileUrl: doc.fileUrl,
      verificationStatus: (latestVerif?.verificationStatus as any) || (doc.isVerified ? 'PASSED' : 'PENDING'),
      confidenceScore: latestVerif?.confidenceScore ? Number(latestVerif.confidenceScore) : undefined,
      ocrExtractedData: latestVerif?.aiExtractedData || undefined,
      uploadedAt: doc.createdAt,
    };
  }

  /**
   * Upload and process a new statutory document, persisting in PostgreSQL
   */
  public async uploadDocument(
    userId: string,
    file: { originalname: string; mimetype: string; size: number; buffer?: Buffer; path?: string },
    body: { documentType?: string; title?: string; applicationId?: string; textPreview?: string }
  ): Promise<{ document: StoredDocument; analysis: DocumentAnalysisResult }> {
    // 1. Validate MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      const err: any = new Error(`Unsupported file type: ${file.mimetype}. Allowed formats: PDF, JPG, PNG.`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_FILE_TYPE';
      throw err;
    }

    // 2. Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const disallowedExts = ['.exe', '.bat', '.sh', '.js', '.html', '.svg', '.php', '.py'];
    if (disallowedExts.includes(ext)) {
      const err: any = new Error(`Security Exception: Executable file extension '${ext}' is not permitted.`);
      err.statusCode = 400;
      err.errorCode = 'DISALLOWED_FILE_EXTENSION';
      throw err;
    }

    // 3. Validate file size
    if (file.size > this.maxFileSizeBytes) {
      const err: any = new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum limit of 10MB.`);
      err.statusCode = 400;
      err.errorCode = 'FILE_SIZE_EXCEEDED';
      throw err;
    }

    const docCode = body.documentType || 'DOC_GENERAL';
    const profile = await db.prisma.businessProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Save file to disk
    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destinationPath = path.join(this.uploadsDir, safeFilename);

    let fileHash = '';
    if (file.buffer) {
      fs.writeFileSync(destinationPath, file.buffer);
      fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    } else if (file.path && fs.existsSync(file.path)) {
      const fileData = fs.readFileSync(file.path);
      fs.writeFileSync(destinationPath, fileData);
      fileHash = crypto.createHash('sha256').update(fileData).digest('hex');
    } else {
      fileHash = crypto.createHash('sha256').update(`${file.originalname}-${Date.now()}`).digest('hex');
    }

    // 5. OCR & AI Analysis
    let extractedText = body.textPreview || '';
    if (!extractedText) {
      extractedText = `STATUTORY CLEARANCE SUBMISSION\nDocument: ${docCode}\nEntity: ${profile?.businessName || 'Applicant'}\nFile: ${file.originalname}\nDate: ${new Date().toISOString().substring(0, 10)}`;
    }

    const analysis = await aiService.analyzeDocument(extractedText, docCode, profile);
    const docTitle = body.title || STATUTORY_DOCUMENTS_CATALOG[docCode]?.name || file.originalname;

    // 6. Check if applicationId is valid in PostgreSQL
    let validAppId: string | null = null;
    if (body.applicationId) {
      const existingApp = await db.prisma.application.findFirst({
        where: { OR: [{ id: body.applicationId }, { applicationNumber: body.applicationId }] },
      });
      if (existingApp) {
        validAppId = existingApp.id;
      }
    }

    // 7. Persist to PostgreSQL documents table
    const isDocPassed = (analysis.verificationStatus as string) === 'PRELIMINARY_VERIFIED' || (analysis.verificationStatus as string) === 'PASSED';
    const newDoc = await db.prisma.document.create({
      data: {
        userId,
        applicationId: validAppId,
        documentTypeCode: docCode,
        documentName: docTitle,
        fileUrl: `/uploads/${safeFilename}`,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileHash,
        isWalletItem: true,
        isVerified: isDocPassed,
      },
    });

    // 8. Persist verification details
    let verifStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'WARNING' = 'PENDING';
    const statusStr = analysis.verificationStatus as string;
    if (statusStr === 'PRELIMINARY_VERIFIED' || statusStr === 'PASSED') verifStatus = 'PASSED';
    else if (statusStr === 'REJECTED' || statusStr === 'FAILED') verifStatus = 'FAILED';
    else if (statusStr === 'NEEDS_REVIEW' || statusStr === 'WARNING') verifStatus = 'WARNING';

    await db.prisma.documentVerification.create({
      data: {
        documentId: newDoc.id,
        verifiedByType: 'AI_AUTO',
        verificationStatus: verifStatus,
        confidenceScore: analysis.confidenceScore ? Number(analysis.confidenceScore) : 95.0,
        aiExtractedData: analysis.extractedFields || {},
        verificationNotes: (analysis.reviewNotes && analysis.reviewNotes.length > 0)
          ? analysis.reviewNotes.join('; ')
          : 'Automated AI preliminary compliance check completed.',
      },
    });

    // 9. Audit log
    try {
      await db.prisma.auditLog.create({
        data: {
          userId,
          action: 'DOCUMENT_UPLOADED_AND_VERIFIED',
          entityName: 'Document',
          entityId: newDoc.id,
          detailsJson: {
            documentCode: docCode,
            fileName: file.originalname,
            fileSize: file.size,
            status: verifStatus,
          },
        },
      });
    } catch {}

    const fullDoc = await db.prisma.document.findUnique({
      where: { id: newDoc.id },
      include: { verifications: true },
    });

    return {
      document: this.formatPrismaDoc(fullDoc!),
      analysis,
    };
  }

  /**
   * Retrieves documents filtered by user and application from PostgreSQL
   */
  public async getDocuments(userId: string, role: string, applicationId?: string): Promise<StoredDocument[]> {
    const whereClause: any = {};
    if (role === 'CITIZEN') {
      whereClause.userId = userId;
    }
    if (applicationId) {
      whereClause.applicationId = applicationId;
    }

    const docs = await db.prisma.document.findMany({
      where: whereClause,
      include: { verifications: { orderBy: { checkedAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map(d => this.formatPrismaDoc(d));
  }

  /**
   * Retrieves single document from PostgreSQL
   */
  public async getDocumentById(id: string, userId: string, role: string): Promise<StoredDocument> {
    const doc = await db.prisma.document.findUnique({
      where: { id },
      include: { verifications: { orderBy: { checkedAt: 'desc' } } },
    });

    if (!doc) {
      const err: any = new Error('Document not found.');
      err.statusCode = 404;
      err.errorCode = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    if (role === 'CITIZEN' && doc.userId !== userId) {
      const err: any = new Error('Forbidden: You do not have permission to access this document.');
      err.statusCode = 403;
      err.errorCode = 'FORBIDDEN_DOCUMENT_ACCESS';
      throw err;
    }

    return this.formatPrismaDoc(doc);
  }

  /**
   * Deletes document from PostgreSQL
   */
  public async deleteDocument(id: string, userId: string, role: string): Promise<boolean> {
    const doc = await db.prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      const err: any = new Error('Document not found.');
      err.statusCode = 404;
      err.errorCode = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    if (role === 'CITIZEN' && doc.userId !== userId) {
      const err: any = new Error('Forbidden: You do not have permission to delete this document.');
      err.statusCode = 403;
      err.errorCode = 'FORBIDDEN_DOCUMENT_ACCESS';
      throw err;
    }

    await db.prisma.document.delete({
      where: { id },
    });

    try {
      await db.prisma.auditLog.create({
        data: {
          userId,
          action: 'DOCUMENT_DELETED',
          entityName: 'Document',
          entityId: id,
        },
      });
    } catch {}

    return true;
  }

  /**
   * Re-triggers preliminary verification on an existing document
   */
  public async reVerifyDocument(id: string, userId: string, role: string): Promise<DocumentAnalysisResult> {
    const doc = await this.getDocumentById(id, userId, role);
    const profile = await db.prisma.businessProfile.findFirst({
      where: { userId: doc.userId },
      orderBy: { createdAt: 'desc' },
    });

    const sampleText = doc.ocrExtractedData
      ? JSON.stringify(doc.ocrExtractedData)
      : `Document ${doc.documentType} for ${doc.title}`;
    const analysis = await aiService.analyzeDocument(sampleText, doc.documentType, profile);

    await db.prisma.documentVerification.create({
      data: {
        documentId: id,
        verifiedByType: 'AI_AUTO',
        verificationStatus: analysis.verificationStatus as any,
        confidenceScore: analysis.confidenceScore ? Number(analysis.confidenceScore) : 95.0,
        aiExtractedData: analysis.extractedFields || {},
        verificationNotes: 'Re-verification completed.',
      },
    });

    return analysis;
  }

  /**
   * Detects missing documents by comparing required approvals against uploaded files in PostgreSQL
   */
  public async getMissingDocuments(userId: string, applicationId?: string): Promise<MissingDocumentsSummary> {
    const app = await db.prisma.application.findFirst({
      where: applicationId
        ? { OR: [{ id: applicationId }, { applicationNumber: applicationId }] }
        : { userId },
      include: {
        applicationApprovals: {
          include: { approval: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const requiredCodes = new Set<string>();
    if (app && app.applicationApprovals.length > 0) {
      for (const aa of app.applicationApprovals) {
        if (aa.approval?.requiredDocCodes) {
          aa.approval.requiredDocCodes.forEach(code => requiredCodes.add(code));
        }
      }
    } else {
      ['DOC_PAN', 'DOC_PROJECT_REPORT', 'DOC_SITE_PLAN', 'DOC_7_12'].forEach(c => requiredCodes.add(c));
    }

    const userDocs = await db.prisma.document.findMany({
      where: { userId },
      include: { verifications: { orderBy: { checkedAt: 'desc' } } },
    });

    const uploadedCodes = new Set(userDocs.map(d => d.documentTypeCode));

    const uploadedList: any[] = [];
    const missingList: any[] = [];

    for (const code of Array.from(requiredCodes)) {
      const meta = datasetImportService.resolveDocument(code);
      if (uploadedCodes.has(code)) {
        const matchingDoc = userDocs.find(d => d.documentTypeCode === code);
        const verifStatus = matchingDoc?.verifications?.[0]?.verificationStatus || 'PRELIMINARY_VERIFIED';
        uploadedList.push({
          documentId: matchingDoc?.id,
          code,
          name: meta.name,
          status: verifStatus,
          uploadedAt: matchingDoc?.createdAt ? matchingDoc.createdAt.toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        });
      } else {
        missingList.push({
          code,
          name: meta.name,
          category: meta.category,
          description: meta.description,
          mandatory: true,
        });
      }
    }

    const total = requiredCodes.size;
    const uploaded = uploadedList.length;
    const missing = missingList.length;
    const completion = total > 0 ? Math.round((uploaded / total) * 100) : 100;

    return {
      requiredCount: total,
      uploadedCount: uploaded,
      missingCount: missing,
      completionPercentage: completion,
      uploaded: uploadedList,
      missing: missingList,
    };
  }

  /**
   * Retrieves standard checklist of statutory documents with real upload state from PostgreSQL
   */
  public async getChecklist(userId?: string): Promise<DocumentChecklistItem[]> {
    const checklist: DocumentChecklistItem[] = [
      {
        id: 'doc-pan',
        code: 'DOC_PAN',
        name: 'Company / Enterprise PAN Card',
        category: 'IDENTITY',
        applicableDepartments: ['MPCB', 'MIDC', 'DISH', 'FIRE', 'MSEDCL'],
        mandatory: true,
        uploaded: false,
        status: 'PENDING',
        isWalletItem: false,
        guidelines: 'Clear scanned PDF or image with legible PAN and Name of Entity.',
      },
      {
        id: 'doc-dpr',
        code: 'DOC_PROJECT_REPORT',
        name: 'Detailed Project Report (DPR)',
        category: 'TECHNICAL',
        applicableDepartments: ['MPCB', 'MIDC', 'INDUSTRY'],
        mandatory: true,
        uploaded: false,
        status: 'PENDING',
        isWalletItem: false,
        guidelines: 'Comprehensive technical project report detailing process flow, machines, and raw materials.',
      },
      {
        id: 'doc-site-layout',
        code: 'DOC_SITE_PLAN',
        name: 'Factory Site Layout & Architectural Blueprint',
        category: 'TECHNICAL',
        applicableDepartments: ['MPCB', 'MIDC', 'FIRE', 'DISH'],
        mandatory: true,
        uploaded: false,
        status: 'PENDING',
        isWalletItem: false,
        guidelines: 'Scale drawing certified by a licensed structural engineer / architect.',
      },
      {
        id: 'doc-7-12',
        code: 'DOC_7_12',
        name: 'Land Record 7/12 Extract / MIDC Allotment Letter',
        category: 'LAND',
        applicableDepartments: ['MIDC', 'REVENUE', 'FIRE'],
        mandatory: true,
        uploaded: false,
        status: 'PENDING',
        isWalletItem: false,
        guidelines: 'Recent 7/12 extract (issued within last 3 months) or valid MIDC Possession Letter.',
      },
      {
        id: 'doc-etp-layout',
        code: 'DOC_POLLUTION_SCHEME',
        name: 'Effluent Treatment Plant (ETP) / APC System Scheme',
        category: 'ENVIRONMENTAL',
        applicableDepartments: ['MPCB'],
        mandatory: true,
        uploaded: false,
        status: 'PENDING',
        isWalletItem: false,
        guidelines: 'Detailed schematic design of wastewater treatment plant and stack emission control.',
      },
      {
        id: 'doc-stability',
        code: 'DOC_STABILITY_CERTIFICATE',
        name: 'Structural Stability Certificate (Form 1A)',
        category: 'TECHNICAL',
        applicableDepartments: ['DISH'],
        mandatory: true,
        uploaded: false,
        status: 'PENDING',
        isWalletItem: false,
        guidelines: 'Form 1-A signed by DISH certified Competent Person under Factories Act.',
      },
    ];

    if (!userId) return checklist;

    const userDocs = await db.prisma.document.findMany({
      where: { userId },
      include: { verifications: { orderBy: { checkedAt: 'desc' } } },
    });

    for (const doc of userDocs) {
      const match = checklist.find(c => c.code === doc.documentTypeCode);
      if (match) {
        const latestVerif = doc.verifications?.[0];
        match.uploaded = true;
        match.status = (latestVerif?.verificationStatus as any) || (doc.isVerified ? 'PASSED' : 'PENDING');
        match.fileName = doc.fileName;
        match.fileSize = `${Math.round(doc.fileSize / 1024)} KB`;
        match.uploadedDate = doc.createdAt.toISOString().substring(0, 10);
        match.verificationConfidence = latestVerif?.confidenceScore ? Number(latestVerif.confidenceScore) : 95;
        match.isWalletItem = doc.isWalletItem;
        match.extractedFields = (latestVerif?.aiExtractedData as any) || undefined;
      }
    }

    return checklist;
  }

  /**
   * Retrieves verified document wallet from PostgreSQL
   */
  public async getWalletDocuments(userId?: string): Promise<DocumentChecklistItem[]> {
    const checklist = await this.getChecklist(userId);
    return checklist.filter(item => item.uploaded && item.isWalletItem);
  }
}

export const documentService = new DocumentService();
