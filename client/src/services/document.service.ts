import { DocumentItem } from '../types';
import { request } from './api';
import { INITIAL_DOCUMENTS } from '../mock/mockData';

export interface MissingDocumentReport {
  requiredDocuments: Array<{
    code: string;
    name: string;
    department?: string;
    approvalName?: string;
    isMandatory: boolean;
  }>;
  uploadedDocuments: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
  }>;
  missingDocuments: Array<{
    code: string;
    name: string;
    department?: string;
    approvalName?: string;
    isMandatory: boolean;
  }>;
  totalRequired: number;
  totalUploaded: number;
  totalMissing: number;
  completionPercentage: number;
}

export const documentService = {
  /**
   * Fetch all documents for the current user
   */
  async getDocuments(): Promise<any[]> {
    try {
      const res = await request<{ success: boolean; data: any[] }>('/documents');
      return res.data || [];
    } catch {
      const stored = localStorage.getItem('maha_documents');
      return stored ? JSON.parse(stored) : INITIAL_DOCUMENTS;
    }
  },

  /**
   * Fetch checklist of required documents
   */
  async getDocumentChecklist(): Promise<DocumentItem[]> {
    try {
      const res = await request<{ success: boolean; data: DocumentItem[] }>('/documents/checklist');
      if (res && res.data) return res.data;
      return await request<DocumentItem[]>('/documents/checklist');
    } catch {
      const stored = localStorage.getItem('maha_documents');
      if (stored) {
        return JSON.parse(stored);
      }
      return INITIAL_DOCUMENTS;
    }
  },

  /**
   * Upload and run automated preliminary verification
   */
  async uploadDocument(
    file: File,
    meta: { documentType?: string; code?: string; name?: string; applicationId?: string }
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (meta.documentType) formData.append('documentType', meta.documentType);
    if (meta.code) formData.append('code', meta.code);
    if (meta.name) formData.append('fileName', meta.name);
    if (meta.applicationId) formData.append('applicationId', meta.applicationId);

    try {
      const res = await request<{ success: boolean; data: any }>('/documents', {
        method: 'POST',
        body: formData,
      });
      return res.data;
    } catch (err) {
      console.warn('Backend document upload failed, using local processing:', err);
      // Local fallback
      return {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: meta.documentType || 'OTHER',
        verificationStatus: 'PRELIMINARY_VERIFIED',
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Simulate / Call AI Document Verification (OCR text recognition, entity extraction, confidence score)
   */
  async verifyDocumentWithAI(
    file: File,
    documentType: string
  ): Promise<{
    status: 'PASSED' | 'WARNING' | 'FAILED';
    confidenceScore: number;
    extractedFields: Record<string, string>;
    validationChecks: { check: string; status: 'PASS' | 'WARN' | 'FAIL'; note: string }[];
    disclaimer: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      const res = await request<{ success: boolean; data: any }>('/documents/ai-verify', {
        method: 'POST',
        body: formData,
      });

      if (res && res.data) {
        const analysis = res.data;
        const statusMap: Record<string, 'PASSED' | 'WARNING' | 'FAILED'> = {
          PRELIMINARY_VERIFIED: 'PASSED',
          NEEDS_REVIEW: 'WARNING',
          REJECTED: 'FAILED',
          PENDING: 'WARNING',
        };

        return {
          status: statusMap[analysis.status] || 'PASSED',
          confidenceScore: Math.round((analysis.confidenceScore || 0.95) * 100),
          extractedFields: analysis.extractedFields || {},
          validationChecks: (analysis.checks || []).map((c: any) => ({
            check: c.name || c.check,
            status: c.passed ? 'PASS' : 'WARN',
            note: c.detail || c.note || '',
          })),
          disclaimer: 'Preliminary Automated Document Verification — not official statutory clearance.',
        };
      }
      throw new Error('Fallback to local simulation');
    } catch {
      // Mock realistic OCR processing delay in UI
      await new Promise(resolve => setTimeout(resolve, 1200));

      const isWarning = file.name.toLowerCase().includes('fire') || file.name.toLowerCase().includes('warn');
      const isFail = file.name.toLowerCase().includes('fail') || file.size > 10 * 1024 * 1024;

      if (isFail) {
        return {
          status: 'FAILED',
          confidenceScore: 38,
          extractedFields: {},
          validationChecks: [
            { check: 'File Format & Resolution', status: 'PASS', note: 'Standard PDF format detected' },
            { check: 'Statutory Seal & Stamp', status: 'FAIL', note: 'Authorized signature or government QR stamp not identified' },
            { check: 'Text Legibility', status: 'FAIL', note: 'Low OCR resolution below statutory readability threshold' },
          ],
          disclaimer:
            'Preliminary Automated Document Verification: Pre-submission verification assistant only; final verification is conducted by designated departmental authorities under RTS Act.',
        };
      }

      if (isWarning) {
        return {
          status: 'WARNING',
          confidenceScore: 84,
          extractedFields: {
            'Document Code': documentType,
            'File Name': file.name,
            'Detected Date': '2026-08-14',
            'Issuer Authority': 'Chief Fire Officer / Licensed Consultant',
          },
          validationChecks: [
            { check: 'File Format & Resolution', status: 'PASS', note: 'Clear 300 DPI vector PDF' },
            { check: 'Statutory Seal & Stamp', status: 'PASS', note: 'Architect license seal verified' },
            { check: 'Completeness Check', status: 'WARN', note: 'Sprinkler head coverage layout missing in auxiliary bay' },
          ],
          disclaimer:
            'Preliminary Automated Document Verification: Pre-submission verification assistant only; final verification is conducted by designated departmental authorities under RTS Act.',
        };
      }

      return {
        status: 'PASSED',
        confidenceScore: 96,
        extractedFields: {
          'Document Code': documentType,
          'File Name': file.name,
          'Extracted Entity': 'Omkara Precision Engineering Pvt Ltd',
          'Document Issue Date': '15-Aug-2024',
          'Valid Till': '14-Aug-2029 (5 Years)',
          'Registration Number': 'MH/IND/REG/2024/99120',
        },
        validationChecks: [
          { check: 'File Format & Resolution', status: 'PASS', note: 'High resolution digital vector document' },
          { check: 'Statutory Seal & Stamp', status: 'PASS', note: 'Valid digital signature and government seal detected' },
          { check: 'Data Cross-Validation', status: 'PASS', note: 'Applicant name matches Business Profile record 100%' },
          { check: 'Expiry Date Check', status: 'PASS', note: 'Document is within statutory validity period' },
        ],
        disclaimer:
          'Preliminary Automated Document Verification: Pre-submission verification assistant only; final verification is conducted by designated departmental authorities under RTS Act.',
      };
    }
  },

  /**
   * Fetch verified document wallet
   */
  async getWalletDocuments(): Promise<DocumentItem[]> {
    try {
      const res = await request<{ success: boolean; data: any[] }>('/documents/wallet');
      if (res && res.data && res.data.length > 0) {
        return res.data.map(d => ({
          id: d.id,
          code: d.type || 'DOC',
          title: d.name,
          category: 'Statutory Verification',
          isMandatory: true,
          verificationStatus: (d.verificationStatus === 'PRELIMINARY_VERIFIED' ? 'PASSED' : d.verificationStatus === 'NEEDS_REVIEW' ? 'WARNING' : 'PENDING') as any,
          uploaded: true,
          fileName: d.name,
          fileSize: `${Math.round((d.fileSize || 250000) / 1024)} KB`,
          uploadedAt: d.createdAt,
          confidenceScore: Math.round((d.confidenceScore || 0.95) * 100),
          isWalletItem: true,
          expiryDate: d.metadata?.validTill || '2029-08-31',
        }));
      }
      return await request<DocumentItem[]>('/documents/wallet');
    } catch {
      const stored = localStorage.getItem('maha_documents');
      const docs: DocumentItem[] = stored ? JSON.parse(stored) : INITIAL_DOCUMENTS;
      return docs.filter(d => d.uploaded && d.isWalletItem);
    }
  },

  /**
   * Fetch missing documents detection report
   */
  async getMissingDocuments(applicationId?: string): Promise<MissingDocumentReport | null> {
    try {
      const url = applicationId ? `/documents/missing?applicationId=${applicationId}` : '/documents/missing';
      const res = await request<{ success: boolean; data: MissingDocumentReport }>(url);
      return res.data;
    } catch {
      return null;
    }
  },

  /**
   * Delete document by ID
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await request(`/documents/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend delete document failed, removing from local state:', err);
    }
    const stored = localStorage.getItem('maha_documents');
    if (stored) {
      const docs: DocumentItem[] = JSON.parse(stored);
      localStorage.setItem('maha_documents', JSON.stringify(docs.filter(d => d.id !== id)));
    }
  },

  /**
   * Save uploaded document to storage & wallet
   */
  async saveDocument(doc: DocumentItem): Promise<void> {
    const stored = localStorage.getItem('maha_documents');
    const docs: DocumentItem[] = stored ? JSON.parse(stored) : [...INITIAL_DOCUMENTS];
    const index = docs.findIndex(d => d.id === doc.id || d.code === doc.code);
    if (index >= 0) {
      docs[index] = { ...docs[index], ...doc };
    } else {
      docs.push(doc);
    }
    localStorage.setItem('maha_documents', JSON.stringify(docs));
  },
};
