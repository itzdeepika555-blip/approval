import { Response, NextFunction } from 'express';
import { businessProfileService } from '../services/businessProfile.service';
import { AuthenticatedRequest } from '../types';

export class BusinessProfileController {
  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }

      const profile = await businessProfileService.getProfileByUserId(userId);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  }

  public async saveProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized. Authentication token required.',
        });
      }

      const saved = await businessProfileService.saveProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Business profile saved successfully.',
        data: saved,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const businessProfileController = new BusinessProfileController();
