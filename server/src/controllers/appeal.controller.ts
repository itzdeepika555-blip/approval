import { Response, NextFunction } from 'express';
import { appealService } from '../services/appeal.service';
import { AuthenticatedRequest } from '../types';

export class AppealController {
  public async fileAppeal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const citizenId = req.user?.userId || 'user-citizen-demo';
      const appeal = await appealService.fileAppeal(citizenId, req.body);
      res.status(201).json({
        success: true,
        message: 'Statutory RTS appeal successfully filed and docketed.',
        data: appeal,
      });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      if (err.message && (err.message.includes('Invalid') || err.message.includes('must contain'))) {
        return res.status(400).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async getAppeals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const appId = (req.query.applicationId as string) || undefined;
      const appeals = await appealService.getAppeals(requestingUser, appId);
      res.status(200).json({
        success: true,
        data: appeals,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getAppealById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const appeal = await appealService.getAppealById(id, requestingUser);
      res.status(200).json({
        success: true,
        data: appeal,
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

  public async decideAppeal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, remarks } = req.body;
      const officerId = req.user?.userId || 'user-officer-mpcb';
      const officerName = req.user?.fullName || 'Joint Director of Industries';

      const decided = await appealService.decideAppeal(officerId, officerName, id, decision, remarks);
      res.status(200).json({
        success: true,
        message: `Statutory appellate disposal order issued: ${decision}.`,
        data: decided,
      });
    } catch (err: any) {
      if (err.message && (err.message.includes('Invalid') || err.message.includes('Mandatory'))) {
        return res.status(400).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      next(err);
    }
  }
}

export const appealController = new AppealController();
