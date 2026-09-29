import { Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import { AuthenticatedRequest } from '../types';

export class DocumentController {
  /**
   * Upload and process a new document
   * POST /api/documents
   */
  public async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }

      const file = (req as any).file;

      if (!file) {
        // Handle JSON / text upload payload
        const simulatedFile = {
          originalname: req.body.fileName || 'uploaded_document.pdf',
          mimetype: req.body.mimeType || 'application/pdf',
          size: parseInt(req.body.fileSize, 10) || 512000,
        };
        const result = await documentService.uploadDocument(userId, simulatedFile, req.body);
        return res.status(201).json({
          success: true,
          message: 'Document uploaded and analyzed successfully.',
          data: result,
        });
      }

      const result = await documentService.uploadDocument(userId, file, req.body);
      res.status(201).json({
        success: true,
        message: 'Document uploaded and analyzed successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List documents for authenticated user / application
   * GET /api/documents
   */
  public async getDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role || 'CITIZEN';
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }

      const applicationId = req.query.applicationId as string | undefined;

      const docs = await documentService.getDocuments(userId, role, applicationId);
      res.status(200).json({
        success: true,
        data: docs,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single document by ID (ownership protected)
   * GET /api/documents/:id
   */
  public async getDocumentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role || 'CITIZEN';
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }
      const { id } = req.params;

      const doc = await documentService.getDocumentById(id, userId, role);
      res.status(200).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete document by ID (ownership protected)
   * DELETE /api/documents/:id
   */
  public async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role || 'CITIZEN';
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }
      const { id } = req.params;

      await documentService.deleteDocument(id, userId, role);
      res.status(200).json({
        success: true,
        message: 'Document deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Trigger preliminary automated verification on a document
   * POST /api/documents/:id/verify
   */
  public async verifyDocument(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role || 'CITIZEN';
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }
      const { id } = req.params;

      const analysis = await documentService.reVerifyDocument(id, userId, role);
      res.status(200).json({
        success: true,
        message: 'Document verification completed.',
        data: analysis,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Missing document detection
   * GET /api/documents/missing
   */
  public async getMissingDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }
      const applicationId = req.query.applicationId as string | undefined;

      const summary = await documentService.getMissingDocuments(userId, applicationId);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Required documents checklist
   * GET /api/documents/checklist
   */
  public async getChecklist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }
      const checklist = await documentService.getChecklist(userId);
      res.status(200).json({
        success: true,
        data: checklist,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verified document wallet
   * GET /api/documents/wallet
   */
  public async getWallet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }
      const wallet = await documentService.getWalletDocuments(userId);
      res.status(200).json({
        success: true,
        data: wallet,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Legacy AI verification endpoint (retained for backward compatibility)
   * POST /api/documents/ai-verify
   */
  public async verifyWithAI(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }
      const file = (req as any).file || {
        originalname: req.body.fileName || 'document.pdf',
        mimetype: 'application/pdf',
        size: 512000,
      };
      const result = await documentService.uploadDocument(userId, file, req.body);
      res.status(200).json({
        success: true,
        data: result.analysis,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const documentController = new DocumentController();
