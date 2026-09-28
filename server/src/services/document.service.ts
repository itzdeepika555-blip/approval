import fs from 'fs';
import path from 'path';
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

  /**
   * Masks sensitive identifier numbers for secure audit logging
   */
  public maskIdentifier(val?: string): string {
    if (!val || val.length < 4) return '***';
    return val.substring(0, 2) + '***' + val.substring(val.length - 2);
  }

  /**
   * Upload and process a new statutory document
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
      const err: any = new Error(`Security Exception: Executable or script file extension '${ext}' is not permitted.`);
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
    const profile = db.businessProfiles.find(p => p.userId === userId);

    // 4. Text extraction / OCR simulation
    let extractedText = body.textPreview || '';
    if (!extractedText) {
      if (docCode === 'DOC_PAN') {
        extractedText = `GOVERNMENT OF INDIA\nINCOME TAX DEPARTMENT\nPermanent Account Number\n${profile?.panNumber || 'AABCS1429B'}\n${profile?.businessName || 'Sahyadri Precision Agro-Engineering Pvt Ltd'}\n01/01/2020`;
      } else if (docCode === 'DOC_7_12') {
        extractedText = `MAHARASHTRA STATE LAND REVENUE\nVillage Form VII-XII (7/12 Extract)\nDistrict: ${profile?.district || 'Pune'} Taluka: ${profile?.taluka || 'Haveli'}\nSurvey/Gat No: ${profile?.surveyPlotNumber || 'Plot No. C-42/1'}\nArea: ${profile?.landAreaSqm || '4500'} Sq.M`;
      } else if (docCode === 'DOC_PROJECT_REPORT') {
        extractedText = `DETAILED PROJECT REPORT\n${profile?.businessName || 'Industrial Enterprise'}\nManufacturing Capacity: ${profile?.productionCapacity || '15,000 units'}\nInvestment: Rs. ${profile?.investmentPlantMachinery || '4.50 Cr'}\nPower Demand: ${profile?.powerRequirementKva || 250} kVA\nWater: ${profile?.waterRequirementKld || 25} KLD`;
      } else {
        extractedText = `STATUTORY CLEARANCE SUBMISSION\nDocument: ${docCode}\nEntity: ${profile?.businessName || 'Applicant'}\nDate: ${new Date().toISOString().substring(0, 10)}`;
      }
    }

    // 5. Run Preliminary Automated Verification Pipeline
    const analysis = await aiService.analyzeDocument(extractedText, docCode, profile);

    const docTitle = body.title || STATUTORY_DOCUMENTS_CATALOG[docCode]?.name || file.originalname;

    // 6. Persist document
    const newDoc: StoredDocument = {
      id: `doc-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId,
      applicationId: body.applicationId || undefined,
      documentType: docCode,
      title: docTitle,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileUrl: `/uploads/${file.originalname}`,
      verificationStatus: (analysis.verificationStatus as any) || 'PRELIMINARY_VERIFIED',
      confidenceScore: analysis.confidenceScore,
      ocrExtractedData: analysis.extractedFields,
      uploadedAt: new Date(),
    };

    db.documents.push(newDoc);

    // 7. Audit log with masked values
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId,
      action: 'DOCUMENT_UPLOADED_AND_VERIFIED',
      entityName: 'Document',
      entityId: newDoc.id,
      details: {
        documentCode: docCode,
        fileSize: file.size,
        status: newDoc.verificationStatus,
        maskedPan: this.maskIdentifier(analysis.extractedFields['PAN']),
      },
      createdAt: new Date(),
    });

    return { document: newDoc, analysis };
  }

  /**
   * Retrieves documents filtered by user and application
   */
  public async getDocuments(userId: string, role: string, applicationId?: string): Promise<StoredDocument[]> {
    if (role === 'OFFICER' || role === 'ADMIN') {
      if (applicationId) return db.documents.filter(d => d.applicationId === applicationId);
      return db.documents;
    }
    return db.documents.filter(d => d.userId === userId);
  }

  /**
   * Retrieves single document ensuring ownership protection
   */
  public async getDocumentById(id: string, userId: string, role: string): Promise<StoredDocument> {
    const doc = db.documents.find(d => d.id === id);
    if (!doc) {
      const err: any = new Error('Document not found.');
      err.statusCode = 404;
      err.errorCode = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    // Ownership enforcement
    if (role === 'CITIZEN' && doc.userId !== userId) {
      const err: any = new Error('Forbidden: You do not have permission to access this document.');
      err.statusCode = 403;
      err.errorCode = 'FORBIDDEN_DOCUMENT_ACCESS';
      throw err;
    }

    return doc;
  }

  /**
   * Deletes document ensuring ownership protection
   */
  public async deleteDocument(id: string, userId: string, role: string): Promise<boolean> {
    const index = db.documents.findIndex(d => d.id === id);
    if (index === -1) {
      const err: any = new Error('Document not found.');
      err.statusCode = 404;
      err.errorCode = 'DOCUMENT_NOT_FOUND';
      throw err;
    }

    const doc = db.documents[index];

    // Ownership enforcement
    if (role === 'CITIZEN' && doc.userId !== userId) {
      const err: any = new Error('Forbidden: You do not have permission to delete this document.');
      err.statusCode = 403;
      err.errorCode = 'FORBIDDEN_DOCUMENT_ACCESS';
      throw err;
    }

    db.documents.splice(index, 1);

    // Audit log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId,
      action: 'DOCUMENT_DELETED',
      entityName: 'Document',
      entityId: id,
      createdAt: new Date(),
    });

    return true;
  }

  /**
   * Re-triggers preliminary verification on an existing document
   */
  public async reVerifyDocument(id: string, userId: string, role: string): Promise<DocumentAnalysisResult> {
    const doc = await this.getDocumentById(id, userId, role);
    const profile = db.businessProfiles.find(p => p.userId === doc.userId);

    const sampleText = doc.ocrExtractedData ? JSON.stringify(doc.ocrExtractedData) : `Document ${doc.documentType} for ${doc.title}`;
    const analysis = await aiService.analyzeDocument(sampleText, doc.documentType, profile);

    doc.verificationStatus = (analysis.verificationStatus as any) || 'PRELIMINARY_VERIFIED';
    doc.confidenceScore = analysis.confidenceScore;
    doc.ocrExtractedData = analysis.extractedFields;

    return analysis;
  }

  /**
   * Detects missing documents by comparing required approvals against uploaded files
   */
  public async getMissingDocuments(userId: string, applicationId?: string): Promise<MissingDocumentsSummary> {
    // 1. Identify user's active application
    const app = db.applications.find(a => (applicationId ? a.id === applicationId || a.applicationNumber === applicationId : a.userId === userId));

    // 2. Collect all required document codes from applicable approvals
    const requiredCodes = new Set<string>();
    if (app && app.approvals.length > 0) {
      for (const aa of app.approvals) {
        const masterAppr = db.approvals.find(m => m.approvalCode === aa.approvalCode);
        if (masterAppr && masterAppr.requiredDocCodes) {
          masterAppr.requiredDocCodes.forEach(code => requiredCodes.add(code));
        }
      }
    } else {
      // Default baseline required documents
      ['DOC_PAN', 'DOC_PROJECT_REPORT', 'DOC_SITE_PLAN', 'DOC_7_12'].forEach(c => requiredCodes.add(c));
    }

    // 3. User's uploaded documents
    const userDocs = db.documents.filter(d => d.userId === userId);
    const uploadedCodes = new Set(userDocs.map(d => d.documentType));

    const uploadedList: any[] = [];
    const missingList: any[] = [];

    for (const code of Array.from(requiredCodes)) {
      const meta = datasetImportService.resolveDocument(code);
      if (uploadedCodes.has(code)) {
        const matchingDoc = userDocs.find(d => d.documentType === code);
        uploadedList.push({
          documentId: matchingDoc?.id,
          code,
          name: meta.name,
          status: matchingDoc?.verificationStatus || 'PRELIMINARY_VERIFIED',
          uploadedAt: matchingDoc?.uploadedAt ? matchingDoc.uploadedAt.toISOString().substring(0, 10) : '2026-02-01',
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
   * Retrieves standard checklist of statutory documents for Maharashtra industrial units
   */
  public async getChecklist(userId?: string): Promise<DocumentChecklistItem[]> {
    const userDocs = db.documents.filter(d => (userId ? d.userId === userId : true));

    const checklist: DocumentChecklistItem[] = [
      {
        id: 'doc-pan',
        code: 'DOC_PAN',
        name: 'Company / Enterprise PAN Card',
        category: 'IDENTITY',
        applicableDepartments: ['MPCB', 'MIDC', 'DISH', 'FIRE', 'MSEDCL'],
        mandatory: true,
        uploaded: true,
        status: 'PRELIMINARY_VERIFIED',
        verificationConfidence: 98,
        fileName: 'company_pan_card.pdf',
        fileSize: '482 KB',
        uploadedDate: '2026-02-01',
        isWalletItem: true,
        guidelines: 'Clear scanned PDF or image with legible PAN and Name of Entity.',
      },
      {
        id: 'doc-dpr',
        code: 'DOC_PROJECT_REPORT',
        name: 'Detailed Project Report (DPR)',
        category: 'TECHNICAL',
        applicableDepartments: ['MPCB', 'MIDC', 'INDUSTRY'],
        mandatory: true,
        uploaded: true,
        status: 'PRELIMINARY_VERIFIED',
        verificationConfidence: 96,
        fileName: 'dpr_sahyadri_engineering_2026.pdf',
        fileSize: '3.2 MB',
        uploadedDate: '2026-02-01',
        isWalletItem: true,
        guidelines: 'Comprehensive technical project report detailing process flow, machines, and raw materials.',
      },
      {
        id: 'doc-site-layout',
        code: 'DOC_SITE_PLAN',
        name: 'Factory Site Layout & Architectural Blueprint',
        category: 'TECHNICAL',
        applicableDepartments: ['MPCB', 'MIDC', 'FIRE', 'DISH'],
        mandatory: true,
        uploaded: true,
        status: 'PRELIMINARY_VERIFIED',
        verificationConfidence: 94,
        fileName: 'factory_site_layout_signed.pdf',
        fileSize: '5.8 MB',
        uploadedDate: '2026-02-01',
        isWalletItem: true,
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

    // Overlay user uploaded docs if any match
    for (const doc of userDocs) {
      const match = checklist.find(c => c.code === doc.documentType);
      if (match) {
        match.uploaded = true;
        match.status = (doc.verificationStatus as any) || 'PRELIMINARY_VERIFIED';
        match.fileName = doc.fileName;
        match.fileSize = `${Math.round(doc.fileSize / 1024)} KB`;
        match.verificationConfidence = Math.round(doc.confidenceScore || 90);
        match.isWalletItem = true;
        match.extractedFields = doc.ocrExtractedData;
      }
    }

    return checklist;
  }

  /**
   * Retrieves verified document wallet
   */
  public async getWalletDocuments(userId?: string): Promise<DocumentChecklistItem[]> {
    const checklist = await this.getChecklist(userId);
    return checklist.filter(item => item.uploaded && item.isWalletItem);
  }
}

export const documentService = new DocumentService();
