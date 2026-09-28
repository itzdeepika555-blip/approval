import { db, StoredCompliance, StoredRenewal } from './db.service';

export interface ComplianceView {
  id: string;
  userId: string;
  businessProfileId: string;
  title: string;
  statutoryAct: string;
  approvalCode: string;
  frequency: string;
  dueDate: string;
  nextDueDate: string;
  status: 'PENDING' | 'COMPLIANT' | 'OVERDUE' | 'UPCOMING';
  penaltyClause: string;
  submissionPortal: string;
  submissionDocUrl?: string;
  lastSubmittedAt?: string;
  lastSubmissionRemarks?: string;
  reminderStatus: 'PENDING' | 'SENT';
  lastRemindedAt?: string;
}

export interface RenewalView {
  id: string;
  userId: string;
  businessProfileId: string;
  licenceName: string;
  approvalName: string;
  licenceNumber: string;
  licenseNumber: string;
  issuingDepartment: string;
  department: string;
  approvalCode: string;
  validUntil: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'VALID' | 'DUE_SOON' | 'OVERDUE' | 'RENEWAL_FILED';
  renewalFeeInr: number;
  renewalFee: string;
  renewalPeriodYears: number;
  paymentReference?: string;
  applicantRemarks?: string;
  filedAt?: string;
  approvedAt?: string;
  endorsementNumber?: string;
  officerRemarks?: string;
  lastRemindedAt?: string;
  renewalWindowOpen: boolean;
}

export class ComplianceService {
  /**
   * Retrieves compliance calendar items with multi-tenant boundaries.
   */
  public async getCompliances(requestingUser?: { userId: string; role: string }): Promise<ComplianceView[]> {
    let list = [...db.compliances];

    if (requestingUser && requestingUser.role === 'CITIZEN') {
      list = list.filter(c => c.userId === requestingUser.userId);
    }

    return list.map(c => this.mapComplianceToView(c));
  }

  /**
   * Citizen submits an annual / periodic statutory return or compliance report.
   */
  public async submitCompliance(
    complianceId: string,
    payload: {
      submissionDocUrl: string;
      remarks: string;
      annualMetricsJson?: any;
    },
    requestingUser?: { userId: string; role: string }
  ): Promise<ComplianceView> {
    if (!payload.submissionDocUrl || !payload.submissionDocUrl.trim()) {
      throw new Error('Mandatory statutory compliance document attachment is required.');
    }
    if (!payload.remarks || payload.remarks.trim().length < 5) {
      throw new Error('Compliance submission remarks must contain at least 5 characters.');
    }

    const compliance = db.compliances.find(c => c.id === complianceId);
    if (!compliance) {
      throw new Error(`Statutory compliance record '${complianceId}' not found.`);
    }

    // Multi-tenant isolation: Citizen can only file for their owned record
    if (requestingUser && requestingUser.role === 'CITIZEN' && compliance.userId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to submit compliance for this business.');
    }

    // Advance due date to next statutory cycle
    const currentDueDate = new Date(compliance.dueDate);
    const validCurrentDate = isNaN(currentDueDate.getTime()) ? new Date() : currentDueDate;

    const nextDueDateObj = new Date(validCurrentDate);
    if (compliance.frequency === 'QUARTERLY') {
      nextDueDateObj.setMonth(nextDueDateObj.getMonth() + 3);
    } else if (compliance.frequency === 'MONTHLY') {
      nextDueDateObj.setMonth(nextDueDateObj.getMonth() + 1);
    } else if (compliance.frequency === 'HALF_YEARLY') {
      nextDueDateObj.setMonth(nextDueDateObj.getMonth() + 6);
    } else {
      // Default: ANNUAL
      nextDueDateObj.setFullYear(nextDueDateObj.getFullYear() + 1);
    }

    const nextDueDateStr = nextDueDateObj.toISOString().split('T')[0];

    compliance.status = 'COMPLIANT';
    compliance.dueDate = nextDueDateStr;
    compliance.submissionDocUrl = payload.submissionDocUrl.trim();
    compliance.lastSubmittedAt = new Date();
    compliance.lastSubmissionRemarks = payload.remarks.trim();
    compliance.reminderStatus = 'PENDING';

    // 1. Audit Trail
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: requestingUser?.userId || compliance.userId,
      userRole: requestingUser?.role || 'CITIZEN',
      action: 'STATUTORY_COMPLIANCE_SUBMITTED',
      entityName: 'ComplianceRecord',
      entityId: compliance.id,
      details: {
        complianceTitle: compliance.title,
        statutoryAct: compliance.statutoryAct,
        documentUrl: compliance.submissionDocUrl,
        nextDueDate: nextDueDateStr,
      },
      createdAt: new Date(),
    });

    // 2. Notification to user
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: compliance.userId,
      title: 'Compliance Return Filed Successfully',
      message: `Statutory filing for "${compliance.title}" has been acknowledged. Next compliance cycle due date: ${nextDueDateStr}.`,
      type: 'STATUS_UPDATE',
      isRead: false,
      channel: 'IN_APP',
      linkUrl: '/compliance-renewals',
      createdAt: new Date(),
    });

    return this.mapComplianceToView(compliance);
  }

  /**
   * Dispatches automated multi-channel statutory reminder (SMS, WhatsApp, Email).
   */
  public async triggerComplianceReminder(
    complianceId: string,
    requestingUser?: { userId: string; role: string }
  ): Promise<{ success: boolean; dispatchId: string; message: string; channels: string[] }> {
    const compliance = db.compliances.find(c => c.id === complianceId);
    if (!compliance) {
      throw new Error(`Statutory compliance record '${complianceId}' not found.`);
    }

    if (requestingUser && requestingUser.role === 'CITIZEN' && compliance.userId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to trigger alerts for this record.');
    }

    compliance.reminderStatus = 'SENT';
    compliance.lastRemindedAt = new Date();

    const dispatchId = `DISPATCH-MH-CMP-${Date.now()}`;
    const channels = ['SMS', 'WHATSAPP', 'IN_APP'];

    // Notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: compliance.userId,
      title: `Statutory Compliance Alert: ${compliance.title}`,
      message: `Official Reminder: Statutory return under ${compliance.statutoryAct} is due on ${compliance.dueDate}. Penalty for delay: ${compliance.penaltyClause || 'Under statutory rules'}.`,
      type: 'RENEWAL',
      isRead: false,
      channel: 'WHATSAPP',
      linkUrl: '/compliance-renewals',
      createdAt: new Date(),
    });

    // Audit log
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: requestingUser?.userId || compliance.userId,
      userRole: requestingUser?.role || 'CITIZEN',
      action: 'COMPLIANCE_REMINDER_DISPATCHED',
      entityName: 'ComplianceRecord',
      entityId: compliance.id,
      details: {
        dispatchId,
        channels,
        dueDate: compliance.dueDate,
      },
      createdAt: new Date(),
    });

    return {
      success: true,
      dispatchId,
      message: `Automated SMS & WhatsApp statutory reminder dispatched for "${compliance.title}".`,
      channels,
    };
  }

  /**
   * Retrieves active licenses and renewal deadlines with multi-tenant isolation.
   */
  public async getRenewals(requestingUser?: { userId: string; role: string }): Promise<RenewalView[]> {
    let list = [...db.renewals];

    if (requestingUser && requestingUser.role === 'CITIZEN') {
      list = list.filter(r => r.userId === requestingUser.userId);
    }

    return list.map(r => this.mapRenewalToView(r));
  }

  /**
   * Citizen files a fast-track statutory license renewal petition.
   */
  public async applyRenewal(
    renewalId: string,
    payload: {
      renewalPeriodYears?: number;
      paymentReference?: string;
      applicantRemarks?: string;
    },
    requestingUser?: { userId: string; role: string }
  ): Promise<RenewalView> {
    const renewal = db.renewals.find(r => r.id === renewalId);
    if (!renewal) {
      throw new Error(`Statutory license renewal record '${renewalId}' not found.`);
    }

    if (requestingUser && requestingUser.role === 'CITIZEN' && renewal.userId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to renew this license.');
    }

    if (renewal.status === 'RENEWAL_FILED') {
      throw new Error(`Renewal application is already under active departmental scrutiny.`);
    }

    const periodYears = payload.renewalPeriodYears && payload.renewalPeriodYears >= 1 && payload.renewalPeriodYears <= 5
      ? payload.renewalPeriodYears
      : 1;

    // Standard Maharashtra Industrial Fast-Track Renewal Fee (₹ 5,000 / year)
    const renewalFee = (renewal.renewalFeeInr || 5000) * periodYears;
    const paymentRef = payload.paymentReference || `MH-EPAY-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    renewal.status = 'RENEWAL_FILED';
    renewal.renewalPeriodYears = periodYears;
    renewal.renewalFeeInr = renewalFee;
    renewal.paymentReference = paymentRef;
    renewal.applicantRemarks = payload.applicantRemarks || 'Fast-track renewal applied under Maharashtra Single Window Act 2016.';
    renewal.filedAt = new Date();

    // 1. Audit trail
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: requestingUser?.userId || renewal.userId,
      userRole: requestingUser?.role || 'CITIZEN',
      action: 'LICENSE_RENEWAL_FILED',
      entityName: 'Renewal',
      entityId: renewal.id,
      details: {
        licenceName: renewal.licenceName,
        licenceNumber: renewal.licenceNumber,
        periodYears,
        renewalFee,
        paymentReference: paymentRef,
      },
      createdAt: new Date(),
    });

    // 2. Notification to citizen
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: renewal.userId,
      title: 'License Renewal Application Filed',
      message: `Fast-track renewal docket generated for ${renewal.licenceName} (${renewal.licenceNumber}). Payment reference: ${paymentRef}.`,
      type: 'STATUS_UPDATE',
      isRead: false,
      channel: 'IN_APP',
      linkUrl: '/compliance-renewals',
      createdAt: new Date(),
    });

    return this.mapRenewalToView(renewal);
  }

  /**
   * Officer or Administrator adjudicates a fast-track statutory license renewal.
   */
  public async decideRenewal(
    renewalId: string,
    payload: {
      decision: 'APPROVED' | 'REJECTED';
      remarks: string;
    },
    officerUser?: { userId: string; role: string; fullName?: string }
  ): Promise<RenewalView> {
    if (!payload.remarks || payload.remarks.trim().length < 5) {
      throw new Error('Mandatory statutory officer adjudication remarks must be provided.');
    }
    if (payload.decision !== 'APPROVED' && payload.decision !== 'REJECTED') {
      throw new Error('Decision must be either APPROVED or REJECTED.');
    }

    const renewal = db.renewals.find(r => r.id === renewalId);
    if (!renewal) {
      throw new Error(`Statutory renewal record '${renewalId}' not found.`);
    }

    if (payload.decision === 'APPROVED') {
      const currentExpiry = new Date(renewal.validUntil);
      const baseDate = isNaN(currentExpiry.getTime()) || currentExpiry.getTime() < Date.now()
        ? new Date()
        : currentExpiry;

      const yearsToAdd = renewal.renewalPeriodYears || 1;
      baseDate.setFullYear(baseDate.getFullYear() + yearsToAdd);

      const endorsementNum = `MH-RNW-END-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      renewal.status = 'VALID';
      renewal.validUntil = baseDate.toISOString().split('T')[0];
      renewal.approvedAt = new Date();
      renewal.endorsementNumber = endorsementNum;
      renewal.officerRemarks = payload.remarks.trim();

      // Audit Log
      db.auditLogs.push({
        id: `audit-${Date.now()}`,
        userId: officerUser?.userId || 'user-officer-mpcb',
        userRole: officerUser?.role || 'OFFICER',
        action: 'LICENSE_RENEWAL_APPROVED',
        entityName: 'Renewal',
        entityId: renewal.id,
        details: {
          licenceNumber: renewal.licenceNumber,
          extendedUntil: renewal.validUntil,
          endorsementNumber: endorsementNum,
          officerRemarks: payload.remarks.trim(),
        },
        createdAt: new Date(),
      });

      // Notification
      db.notifications.push({
        id: `notif-${Date.now()}`,
        userId: renewal.userId,
        title: 'Statutory License Renewed',
        message: `Your license ${renewal.licenceName} has been extended until ${renewal.validUntil} under Endorsement ${endorsementNum}.`,
        type: 'STATUS_UPDATE',
        isRead: false,
        channel: 'SMS',
        linkUrl: '/compliance-renewals',
        createdAt: new Date(),
      });
    } else {
      renewal.status = 'OVERDUE';
      renewal.officerRemarks = payload.remarks.trim();

      db.auditLogs.push({
        id: `audit-${Date.now()}`,
        userId: officerUser?.userId || 'user-officer-mpcb',
        userRole: officerUser?.role || 'OFFICER',
        action: 'LICENSE_RENEWAL_REJECTED',
        entityName: 'Renewal',
        entityId: renewal.id,
        details: {
          licenceNumber: renewal.licenceNumber,
          rejectionReason: payload.remarks.trim(),
        },
        createdAt: new Date(),
      });

      db.notifications.push({
        id: `notif-${Date.now()}`,
        userId: renewal.userId,
        title: 'License Renewal Rejected',
        message: `Renewal for ${renewal.licenceName} was rejected: ${payload.remarks.trim()}. Please file fresh clarification.`,
        type: 'STATUS_UPDATE',
        isRead: false,
        channel: 'IN_APP',
        linkUrl: '/compliance-renewals',
        createdAt: new Date(),
      });
    }

    return this.mapRenewalToView(renewal);
  }

  /**
   * Dispatches automated license expiration alert.
   */
  public async triggerRenewalReminder(
    renewalId: string,
    requestingUser?: { userId: string; role: string }
  ): Promise<{ success: boolean; dispatchId: string; message: string; channels: string[] }> {
    const renewal = db.renewals.find(r => r.id === renewalId);
    if (!renewal) {
      throw new Error(`Statutory renewal record '${renewalId}' not found.`);
    }

    if (requestingUser && requestingUser.role === 'CITIZEN' && renewal.userId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to trigger alerts for this license.');
    }

    renewal.lastRemindedAt = new Date();
    const dispatchId = `DISPATCH-MH-RNW-${Date.now()}`;
    const channels = ['SMS', 'WHATSAPP', 'EMAIL'];

    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: renewal.userId,
      title: `License Expiry Alert: ${renewal.licenceName}`,
      message: `Your statutory license (${renewal.licenceNumber}) expires on ${renewal.validUntil}. Fast-track renewal window is active.`,
      type: 'RENEWAL',
      isRead: false,
      channel: 'SMS',
      linkUrl: '/compliance-renewals',
      createdAt: new Date(),
    });

    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: requestingUser?.userId || renewal.userId,
      userRole: requestingUser?.role || 'CITIZEN',
      action: 'RENEWAL_REMINDER_DISPATCHED',
      entityName: 'Renewal',
      entityId: renewal.id,
      details: {
        dispatchId,
        channels,
        validUntil: renewal.validUntil,
      },
      createdAt: new Date(),
    });

    return {
      success: true,
      dispatchId,
      message: `Automated SMS & WhatsApp statutory reminder dispatched for "${renewal.licenceName}"!`,
      channels,
    };
  }

  private mapComplianceToView(c: StoredCompliance): ComplianceView {
    return {
      id: c.id,
      userId: c.userId,
      businessProfileId: c.businessProfileId,
      title: c.title,
      statutoryAct: c.statutoryAct,
      approvalCode: c.approvalCode || 'GEN_COMP',
      frequency: c.frequency,
      dueDate: c.dueDate,
      nextDueDate: c.dueDate,
      status: c.status as any,
      penaltyClause: c.penaltyClause || 'Statutory fine under Maharashtra Environmental & Industrial Rules.',
      submissionPortal: c.submissionPortal || 'https://maitri.maharashtra.gov.in',
      submissionDocUrl: c.submissionDocUrl,
      lastSubmittedAt: c.lastSubmittedAt ? c.lastSubmittedAt.toISOString().replace('T', ' ').substring(0, 16) : undefined,
      lastSubmissionRemarks: c.lastSubmissionRemarks,
      reminderStatus: c.reminderStatus || 'PENDING',
      lastRemindedAt: c.lastRemindedAt ? c.lastRemindedAt.toISOString().replace('T', ' ').substring(0, 16) : undefined,
    };
  }

  private mapRenewalToView(r: StoredRenewal): RenewalView {
    const validUntilDate = new Date(r.validUntil);
    const now = new Date();
    const diffMs = validUntilDate.getTime() - now.getTime();
    const daysRemaining = isNaN(diffMs) ? 90 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status = r.status;
    if (status !== 'RENEWAL_FILED') {
      if (daysRemaining < 0) {
        status = 'OVERDUE';
      } else if (daysRemaining <= 60) {
        status = 'DUE_SOON';
      } else {
        status = 'VALID';
      }
    }

    const fee = r.renewalFeeInr || 7500;

    return {
      id: r.id,
      userId: r.userId,
      businessProfileId: r.businessProfileId,
      licenceName: r.licenceName,
      approvalName: r.licenceName,
      licenceNumber: r.licenceNumber,
      licenseNumber: r.licenceNumber,
      issuingDepartment: r.issuingDepartment,
      department: r.issuingDepartment,
      approvalCode: r.approvalCode || 'GEN_LIC',
      validUntil: r.validUntil,
      expiryDate: r.validUntil,
      daysRemaining,
      status,
      renewalFeeInr: fee,
      renewalFee: `₹ ${fee.toLocaleString('en-IN')}`,
      renewalPeriodYears: r.renewalPeriodYears || 1,
      paymentReference: r.paymentReference,
      applicantRemarks: r.applicantRemarks,
      filedAt: r.filedAt ? r.filedAt.toISOString().replace('T', ' ').substring(0, 16) : undefined,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString().replace('T', ' ').substring(0, 16) : undefined,
      endorsementNumber: r.endorsementNumber,
      officerRemarks: r.officerRemarks,
      lastRemindedAt: r.lastRemindedAt ? r.lastRemindedAt.toISOString().replace('T', ' ').substring(0, 16) : undefined,
      renewalWindowOpen: daysRemaining <= 90,
    };
  }
}

export const complianceService = new ComplianceService();
