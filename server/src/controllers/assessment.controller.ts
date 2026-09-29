import { Response, NextFunction } from 'express';
import { approvalMatchingService } from '../services/approvalMatching.service';
import { datasetImportService } from '../services/datasetImport.service';
import { applicationService } from '../services/application.service';
import { db } from '../services/db.service';
import { AuthenticatedRequest } from '../types';

export class AssessmentController {
  /**
   * Run smart approval rule matching on business profile
   * POST /api/assessment & POST /api/assessments/evaluate
   */
  public async assess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { businessProfileId, applicationId, ...bodyProfile } = req.body;

      let targetProfile = bodyProfile;

      // If businessProfileId provided or user authenticated, resolve saved profile from PostgreSQL
      if (businessProfileId) {
        const found = await db.prisma.businessProfile.findUnique({ where: { id: businessProfileId } });
        if (found) targetProfile = { ...found, ...bodyProfile };
      } else if (userId && Object.keys(bodyProfile).length === 0) {
        const found = await db.prisma.businessProfile.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (found) targetProfile = found;
      }

      if (!targetProfile || Object.keys(targetProfile).length === 0) {
        targetProfile = bodyProfile || {};
      }

      const result = await approvalMatchingService.assessBusinessProfile(targetProfile, userId, applicationId);

      res.status(200).json({
        success: true,
        message: 'Assessment completed successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get applicable approvals for a specific application
   * GET /api/applications/:id/approvals
   * Citizens access only their own; Officers/Admins access any.
   */
  public async getApplicationApprovals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const role = req.user?.role;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }

      const app = await applicationService.getApplicationById(id, userId, role);
      if (!app) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or unauthorized access.',
          errorCode: 'APPLICATION_NOT_FOUND',
        });
      }

      res.status(200).json({
        success: true,
        data: {
          applicationId: app.id,
          applicationNumber: app.applicationNumber,
          stage: app.stage,
          totalApprovalsCount: app.approvals.length,
          approvals: app.approvals,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Get dataset statistics & data quality metrics
   * GET /api/admin/approval-dataset/stats
   */
  public async getDatasetStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const lastReport = datasetImportService.getLastReport();
      const lastImportTime = datasetImportService.getLastImportTime();

      const stats = {
        departmentsCount: db.departments.length,
        approvalsCount: db.approvals.length,
        rulesCount: db.rules.length,
        sectorsSupported: [
          'AUTOMOTIVE_ENGINEERING',
          'FOOD_PROCESSING',
          'CHEMICALS_PHARMA',
          'TEXTILE_APPAREL',
          'MANUFACTURING_GENERAL',
          'ELECTRONICS_ESD',
          'RENEWABLE_ENERGY',
          'IT_ITES',
        ],
        lastImportTime: lastImportTime ? lastImportTime.toISOString() : new Date().toISOString(),
        qualityReport: lastReport || {
          status: 'Catalog active with pre-validated master datasets.',
          totalRowsRead: 28,
          successfullyImported: 28,
        },
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Trigger on-demand dataset ingestion
   * POST /api/admin/approval-dataset/import
   */
  public async triggerDatasetImport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const report = await datasetImportService.importDataset();
      res.status(200).json({
        success: true,
        message: 'Dataset import and validation completed successfully.',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const assessmentController = new AssessmentController();
