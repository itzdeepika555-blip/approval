import { Response, NextFunction } from 'express';
import { inspectionService } from '../services/inspection.service';
import { AuthenticatedRequest } from '../types';

export class InspectionController {
  public async getSlots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      const slots = await inspectionService.getInspectionSlots(userId, role);
      res.status(200).json({
        success: true,
        data: slots,
      });
    } catch (err) {
      next(err);
    }
  }

  public async bookSlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || 'user-citizen-demo';
      const { slotId, preferredDate, timeSlot, applicationId } = req.body;

      if (!slotId || !preferredDate || !timeSlot) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: slotId, preferredDate, and timeSlot must be provided.',
        });
      }

      const booked = await inspectionService.bookSlot(userId, slotId, preferredDate, timeSlot, applicationId);
      res.status(200).json({
        success: true,
        message: 'Joint Common Inspection scheduled successfully across participating departments.',
        data: booked,
      });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      if (err.message && err.message.includes('conflict')) {
        return res.status(409).json({ success: false, error: err.message });
      }
      if (err.message && (err.message.includes('Invalid') || err.message.includes('cannot be in the past'))) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next(err);
    }
  }
}

export const inspectionController = new InspectionController();
