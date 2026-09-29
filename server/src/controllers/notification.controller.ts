import { Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../types';

export class NotificationController {
  public async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const unreadOnly = req.query.unreadOnly === 'true';
      const type = req.query.type as string;
      const notifications = await notificationService.getNotifications(userId, { unreadOnly, type });
      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  public async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const updated = await notificationService.markAsRead(id, userId);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        return res.status(403).json({ success: false, error: err.message });
      }
      next(err);
    }
  }

  public async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Authentication required.',
        });
      }
      const result = await notificationService.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        message: `Marked ${result.updatedCount} notifications as read.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async dispatchAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Authentication required.',
        });
      }
      const { title, message, channel, type, linkUrl, recipientContact } = req.body;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          error: 'Title and message are required for statutory alert dispatch.',
        });
      }

      const result = await notificationService.dispatchStatutoryAlert(userId, {
        title,
        message,
        channel: channel || 'IN_APP',
        type,
        linkUrl,
        recipientContact,
      });

      res.status(201).json({
        success: true,
        message: 'Statutory alert dispatched successfully across designated channels.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await notificationService.getAuditLogs();
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
