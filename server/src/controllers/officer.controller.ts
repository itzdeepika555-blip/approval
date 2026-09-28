import { Response, NextFunction } from 'express';
import { officerService } from '../services/officer.service';
import { slaService } from '../services/sla.service';
import { AuthenticatedRequest } from '../types';

export class OfficerController {
  public async getApplications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deptCode = (req.query.department as string) || undefined;
      const apps = await officerService.getOfficerApplications(deptCode);
      res.status(200).json({
        success: true,
        data: apps,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getQueries(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const appId = (req.query.appId as string) || undefined;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const queries = await officerService.getQueries(appId, requestingUser);
      res.status(200).json({
        success: true,
        data: queries,
      });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async raiseQuery(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const officerId = req.user?.userId || 'user-officer-mpcb';
      const officerName = req.user?.fullName || 'Dr. Rahul Deshmukh';
      const { applicationId, departmentCode, queryText } = req.body;

      if (!applicationId || !departmentCode || !queryText) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: applicationId, departmentCode, and queryText must be provided.',
        });
      }

      const query = await officerService.raiseQuery(
        officerId,
        applicationId,
        departmentCode,
        queryText,
        officerName
      );
      res.status(201).json({
        success: true,
        message: 'Official scrutiny query dispatched to applicant. Statutory clock paused.',
        data: query,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('empty')) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async replyQuery(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { citizenResponse } = req.body;

      if (!citizenResponse || !citizenResponse.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Citizen clarification response cannot be empty.',
        });
      }

      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const result = await officerService.replyQuery(id, citizenResponse, requestingUser);
      res.status(200).json({
        success: true,
        message: 'Clarification reply submitted successfully. Statutory clock resumed.',
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

  public async submitDecision(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, remarks, officerName, departmentCode } = req.body;

      if (!decision || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
        return res.status(400).json({
          success: false,
          error: "Decision must be specified as 'APPROVED' or 'REJECTED'.",
        });
      }

      if (!remarks || !remarks.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Statutory officer scrutiny findings / remarks must be provided.',
        });
      }

      const effectiveOfficer = officerName || req.user?.fullName || 'Competent Authority';
      const result = await officerService.submitDecision(
        id,
        decision,
        remarks,
        effectiveOfficer,
        departmentCode
      );
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await officerService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getApplicationSla(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const sla = await slaService.getApplicationSla(id, requestingUser);
      res.status(200).json({
        success: true,
        data: sla,
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

  public async getEscalations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deptCode = (req.query.department as string) || undefined;
      const queue = await slaService.getEscalationQueue(deptCode);
      res.status(200).json({
        success: true,
        data: queue,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const officerController = new OfficerController();
