import { Response, NextFunction } from 'express';
import { applicationService } from '../services/application.service';
import { AuthenticatedRequest } from '../types';

export class ApplicationController {
  public async getApplications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }
      const apps = await applicationService.getApplications(userId, role);
      res.status(200).json({
        success: true,
        data: apps,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getApplicationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
        data: app,
      });
    } catch (err) {
      next(err);
    }
  }

  public async submitApplication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required to submit an application.',
        });
      }

      const submitted = await applicationService.submitApplication(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Consolidated application submitted successfully.',
        data: submitted,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateApplication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

      const updated = await applicationService.updateApplication(id, req.body, userId, role);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or unauthorized access.',
          errorCode: 'APPLICATION_NOT_FOUND',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Application updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const applicationController = new ApplicationController();
