import { db, StoredNotification } from './db.service';
import { adminService } from './admin.service';

export interface AlertDispatchResult {
  success: boolean;
  dispatchId: string;
  channel: 'IN_APP' | 'SMS' | 'WHATSAPP' | 'EMAIL';
  recipientContact: string;
  title: string;
  message: string;
  status: 'DELIVERED';
  timestamp: string;
}

export class NotificationService {
  /**
   * Fetch notifications from PostgreSQL
   */
  public async getNotifications(
    userId?: string,
    filters?: { unreadOnly?: boolean; type?: string }
  ): Promise<StoredNotification[]> {
    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    }
    if (filters?.unreadOnly) {
      whereClause.isRead = false;
    }
    if (filters?.type) {
      whereClause.type = filters.type as any;
    }

    const notifs = await db.prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return notifs.map(n => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type as any,
      isRead: n.isRead,
      linkUrl: n.linkUrl || undefined,
      createdAt: n.createdAt,
    }));
  }

  /**
   * Mark single notification as read in PostgreSQL
   */
  public async markAsRead(id: string, userId?: string): Promise<StoredNotification | null> {
    const notif = await db.prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) return null;
    if (userId && notif.userId !== userId) {
      throw new Error('Forbidden: You cannot modify notifications belonging to another account.');
    }

    const updated = await db.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      message: updated.message,
      type: updated.type as any,
      isRead: updated.isRead,
      linkUrl: updated.linkUrl || undefined,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Mark all notifications as read in PostgreSQL
   */
  public async markAllAsRead(userId: string): Promise<{ success: boolean; updatedCount: number }> {
    const result = await db.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, updatedCount: result.count };
  }

  /**
   * Dispatch notification in PostgreSQL
   */
  public async dispatchStatutoryAlert(
    userId: string,
    alertData: {
      title: string;
      message: string;
      channel: 'IN_APP' | 'SMS' | 'WHATSAPP' | 'EMAIL';
      type?: 'STATUS_UPDATE' | 'QUERY' | 'SLA_WARNING' | 'INSPECTION' | 'RENEWAL' | 'SYSTEM';
      linkUrl?: string;
      recipientContact?: string;
    }
  ): Promise<AlertDispatchResult> {
    const user = await db.prisma.user.findUnique({ where: { id: userId } });
    const recipientContact = alertData.recipientContact || user?.phone || user?.email || '';

    const created = await db.prisma.notification.create({
      data: {
        userId,
        title: alertData.title,
        message: alertData.message,
        type: (alertData.type as any) || 'SYSTEM',
        isRead: false,
        linkUrl: alertData.linkUrl || '/dashboard',
      },
    });

    try {
      await db.prisma.auditLog.create({
        data: {
          userId,
          action: 'NOTIFICATION_DISPATCHED',
          entityName: 'Notification',
          entityId: created.id,
          detailsJson: {
            channel: alertData.channel,
            recipient: recipientContact,
            title: alertData.title,
          },
        },
      });
    } catch {}

    const dispatchId = `DISPATCH-MH-${alertData.channel}-${Date.now()}`;

    return {
      success: true,
      dispatchId,
      channel: alertData.channel,
      recipientContact,
      title: alertData.title,
      message: alertData.message,
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
    };
  }

  public async getAuditLogs() {
    return adminService.getAuditLogs();
  }
}

export const notificationService = new NotificationService();
