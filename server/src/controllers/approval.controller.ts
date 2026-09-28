import { Request, Response, NextFunction } from 'express';
import { approvalService } from '../services/approval.service';
import { AuthenticatedRequest } from '../types';

export class ApprovalController {
  public async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const depts = await approvalService.getDepartments();
      res.status(200).json({
        success: true,
        data: depts,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getApprovals(req: Request, res: Response, next: NextFunction) {
    try {
      const approvals = await approvalService.getAllApprovals();
      res.status(200).json({
        success: true,
        data: approvals,
      });
    } catch (err) {
      next(err);
    }
  }

  public async assess(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await approvalService.assessApprovals(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getDepartmentClearances(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const clearances = await approvalService.getDepartmentClearances(userId);
      res.status(200).json({
        success: true,
        data: clearances,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const approvalController = new ApprovalController();
