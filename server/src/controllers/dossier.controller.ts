import { Response, NextFunction } from 'express';
import { dossierService } from '../services/dossier.service';
import { AuthenticatedRequest } from '../types';

export class DossierController {
  public async getCertificate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const certificate = await dossierService.generateCertificate(id, requestingUser);

      res.status(200).json({
        success: true,
        message: 'Composite Single-Window Industrial Clearance Certificate generated successfully.',
        data: certificate,
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

  public async getDossier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requestingUser = req.user ? { userId: req.user.userId, role: req.user.role } : undefined;
      const dossier = await dossierService.generateDossier(id, requestingUser);

      res.status(200).json({
        success: true,
        message: 'Consolidated Single-Window Industrial Project Dossier compiled successfully.',
        data: dossier,
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

export const dossierController = new DossierController();
