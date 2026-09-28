import { db, StoredNotification } from './db.service';

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
  public async getNotifications(
    userId?: string,
    filters?: { unreadOnly?: boolean; type?: string }
  ): Promise<StoredNotification[]> {
    let list = [...db.notifications];
    if (userId) {
      list = list.filter(n => n.userId === userId);
    }
    if (filters?.unreadOnly) {
      list = list.filter(n => !n.isRead);
    }
    if (filters?.type) {
      list = list.filter(n => n.type === filters.type);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async markAsRead(id: string, userId?: string): Promise<StoredNotification | null> {
    const notif = db.notifications.find(n => n.id === id);
    if (!notif) return null;
    if (userId && notif.userId !== userId) {
      throw new Error('Forbidden: You cannot modify notifications belonging to another account.');
    }
    notif.isRead = true;
    return notif;
  }

  public async markAllAsRead(userId: string): Promise<{ success: boolean; updatedCount: number }> {
    let count = 0;
    for (const notif of db.notifications) {
      if (notif.userId === userId && !notif.isRead) {
        notif.isRead = true;
        count++;
      }
    }
    return { success: true, updatedCount: count };
  }

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
    const user = db.users.find(u => u.id === userId);
    const recipientContact = alertData.recipientContact || user?.phone || user?.email || '+91 98220 12345';

    const notif: StoredNotification = {
      id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      title: alertData.title,
      message: alertData.message,
      type: alertData.type || 'SYSTEM',
      channel: alertData.channel || 'IN_APP',
      recipientContact,
      isRead: false,
      linkUrl: alertData.linkUrl || '/dashboard',
      createdAt: new Date(),
    };

    db.notifications.unshift(notif);

    // Audit log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId,
      userRole: user?.role || 'CITIZEN',
      action: 'NOTIFICATION_DISPATCHED',
      entityName: 'Notification',
      entityId: notif.id,
      details: {
        channel: alertData.channel,
        recipient: recipientContact,
        title: alertData.title,
      },
      createdAt: new Date(),
    });

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

  public async getAuditLogs(): Promise<any[]> {
    return db.auditLogs;
  }
}

export const notificationService = new NotificationService();
