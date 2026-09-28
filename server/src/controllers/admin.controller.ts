import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { AuthenticatedRequest } from '../types';

export class AdminController {
  public async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getStateAnalytics();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const roleFilter = (req.query.role as string) || undefined;
      const users = await adminService.getUsers(roleFilter);
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  }

  public async toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const adminId = req.user?.userId || 'user-admin';
      const result = await adminService.toggleUserStatus(id, Boolean(isActive), adminId);
      res.status(200).json({
        success: true,
        message: `User operational status set to ${isActive ? 'Active' : 'Inactive'}.`,
        data: result,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { action, entityName, userRole, limit } = req.query;
      const logs = await adminService.getAuditLogs({
        action: action as string,
        entityName: entityName as string,
        userRole: userRole as string,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rules = await adminService.getAllRules();
      res.status(200).json({
        success: true,
        data: rules,
      });
    } catch (err) {
      next(err);
    }
  }

  public async createRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.userId || 'user-admin';
      const rule = await adminService.createRule(adminId, req.body);
      res.status(201).json({
        success: true,
        message: 'Statutory clearance rule created and loaded into engine.',
        data: rule,
      });
    } catch (err: any) {
      if (err.message && (err.message.includes('already exists') || err.message.includes('Missing required'))) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async updateRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const adminId = req.user?.userId || 'user-admin';
      const rule = await adminService.updateRule(adminId, id, req.body);
      res.status(200).json({
        success: true,
        message: 'Statutory rule updated successfully.',
        data: rule,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return res.status(404).json({ success: false, error: err.message });
      }
      next(err);
    }
  }
}

export const adminController = new AdminController();
