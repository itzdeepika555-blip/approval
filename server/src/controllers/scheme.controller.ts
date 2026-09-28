import { Request, Response, NextFunction } from 'express';
import { schemeService } from '../services/scheme.service';

export class SchemeController {
  public async getSchemes(req: Request, res: Response, next: NextFunction) {
    try {
      const schemes = await schemeService.getSchemes();
      res.status(200).json({
        success: true,
        data: schemes,
      });
    } catch (err) {
      next(err);
    }
  }

  public async checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const profile = req.body || {};
      const result = await schemeService.checkEligibility(id, profile);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async matchSchemes(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = req.body || {};
      const results = await schemeService.matchAllSchemes(profile);
      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getCompliances(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await schemeService.getCompliances();
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getRenewals(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await schemeService.getRenewals();
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const schemeController = new SchemeController();
