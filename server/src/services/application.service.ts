import { db, StoredApplication, StoredApplicationApproval } from './db.service';

export class ApplicationService {
  /**
   * List applications (filtered by user if citizen)
   */
  public async getApplications(userId?: string, role?: string): Promise<StoredApplication[]> {
    if (role === 'OFFICER' || role === 'ADMIN') {
      return db.applications;
    }
    return db.applications.filter(a => a.userId === userId);
  }

  /**
   * Get single application by ID or applicationNumber
   */
  public async getApplicationById(id: string): Promise<StoredApplication | null> {
    const app = db.applications.find(a => a.id === id || a.applicationNumber === id);
    return app || null;
  }

  /**
   * Submit consolidated application across all parallel departments
   */
  public async submitApplication(userId: string, payload: any): Promise<StoredApplication> {
    const appNumber = `MH-${new Date().getFullYear()}-IND-${Math.floor(10000 + Math.random() * 90000)}`;

    const userProfile = db.businessProfiles.find(p => p.userId === userId) || db.businessProfiles[0];
    const profileId = userProfile ? userProfile.id : `prof-${Date.now()}`;

    // Map requested approvals to instantiated application approvals
    let rawApprovals = payload.approvals || [];
    if (!Array.isArray(rawApprovals) || rawApprovals.length === 0) {
      rawApprovals = [
        { approvalCode: 'MPCB_CTE', name: 'Consent to Establish (CTE)', departmentCode: 'MPCB', statutoryTimelineDays: 45 },
        { approvalCode: 'DISH_FACT_LIC', name: 'Factory Registration and License', departmentCode: 'DISH', statutoryTimelineDays: 30 },
      ];
    }
    const instantiatedApprovals: StoredApplicationApproval[] = rawApprovals.map((item: any, idx: number) => {
      const master = db.approvals.find(a => a.approvalCode === item.approvalCode || a.id === item.id);
      const slaDays = master?.statutoryTimelineDays || item.statutoryTimelineDays || 30;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + slaDays);

      return {
        id: `aa-${Date.now()}-${idx}`,
        applicationId: '',
        approvalId: master?.id || item.id || `appr-${idx}`,
        approvalCode: master?.approvalCode || item.approvalCode || 'MPCB_CTE',
        approvalName: master?.name || item.name || 'Statutory Industrial Approval',
        departmentCode: master?.departmentCode || item.departmentCode || 'MPCB',
        status: 'IN_PROGRESS',
        statutorySlaDays: slaDays,
        targetCompletionDate: targetDate,
        appliedDate: new Date(),
        remarks: 'Application under active scrutiny by competent authority.',
      };
    });

    const targetCompletion = new Date();
    targetCompletion.setDate(targetCompletion.getDate() + 45); // Standard Maharashtra 45-day RTS cap

    const newApp: StoredApplication = {
      id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      businessProfileId: profileId,
      applicationNumber: appNumber,
      stage: 'SUBMITTED',
      overallProgress: 15,
      projectStage: 'PRE_ESTABLISHMENT',
      totalApprovalsCount: instantiatedApprovals.length,
      approvedCount: 0,
      rejectedCount: 0,
      queryPendingCount: 0,
      submittedAt: new Date(),
      targetCompletionDate: targetCompletion,
      createdAt: new Date(),
      updatedAt: new Date(),
      approvals: instantiatedApprovals,
    };

    // Link application ID to child approvals
    newApp.approvals.forEach(a => (a.applicationId = newApp.id));

    db.applications.unshift(newApp);

    // Create Audit Log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId,
      action: 'APPLICATION_SUBMITTED',
      entityName: 'Application',
      entityId: newApp.id,
      details: { applicationNumber: appNumber, approvalsCount: instantiatedApprovals.length },
      createdAt: new Date(),
    });

    // Create Notification for citizen
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId,
      title: 'Application Submitted Successfully',
      message: `Your industrial single-window application ${appNumber} has been dispatched to ${instantiatedApprovals.length} departments.`,
      type: 'STATUS_UPDATE',
      isRead: false,
      linkUrl: '/approval-tracker',
      createdAt: new Date(),
    });

    return newApp;
  }

  /**
   * Update existing application
   */
  public async updateApplication(id: string, updates: Partial<StoredApplication>): Promise<StoredApplication | null> {
    const index = db.applications.findIndex(a => a.id === id || a.applicationNumber === id);
    if (index === -1) return null;

    db.applications[index] = {
      ...db.applications[index],
      ...updates,
      updatedAt: new Date(),
    };

    return db.applications[index];
  }
}

export const applicationService = new ApplicationService();
