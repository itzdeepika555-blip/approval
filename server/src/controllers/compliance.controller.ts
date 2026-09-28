import { Response, NextFunction } from 'express';
import { complianceService } from '../services/compliance.service';
import { AuthenticatedRequest } from '../types';

export class ComplianceController {
  public async getCompliances(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const compliances = await complianceService.getCompliances(requestingUser);
      res.status(200).json({
        success: true,
        data: compliances,
      });
    } catch (err) {
      next(err);
    }
  }

  public async submitCompliance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { submissionDocUrl, remarks, annualMetricsJson } = req.body;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;

      const updated = await complianceService.submitCompliance(
        id,
        { submissionDocUrl, remarks, annualMetricsJson },
        requestingUser
      );

      res.status(200).json({
        success: true,
        message: 'Statutory compliance return filed and verified successfully.',
        data: updated,
      });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('Mandatory')) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async triggerComplianceReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const result = await complianceService.triggerComplianceReminder(id, requestingUser);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async getRenewals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const renewals = await complianceService.getRenewals(requestingUser);
      res.status(200).json({
        success: true,
        data: renewals,
      });
    } catch (err) {
      next(err);
    }
  }

  public async applyRenewal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { renewalPeriodYears, paymentReference, applicantRemarks } = req.body;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;

      const result = await complianceService.applyRenewal(
        id,
        { renewalPeriodYears, paymentReference, applicantRemarks },
        requestingUser
      );

      res.status(200).json({
        success: true,
        message: 'Fast-track license renewal filed successfully.',
        data: result,
      });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('already under')) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async decideRenewal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, remarks } = req.body;
      const officerUser = req.user ? { userId: req.user.userId, role: req.user.role, fullName: req.user.fullName } : undefined;

      const result = await complianceService.decideRenewal(
        id,
        { decision, remarks },
        officerUser
      );

      res.status(200).json({
        success: true,
        message: `License renewal ${decision === 'APPROVED' ? 'granted' : 'rejected'} successfully.`,
        data: result,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      if (err.message && (err.message.includes('Mandatory') || err.message.includes('must be either'))) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async triggerRenewalReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const result = await complianceService.triggerRenewalReminder(id, requestingUser);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      next(err);
    }
  }
}

export const complianceController = new ComplianceController();
