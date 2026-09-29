import { db, StoredApplication } from './db.service';
import { applicationService } from './application.service';

export type EscalationLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'BREACHED_OR_DEEMED';

export interface ClearanceSlaDetail {
  approvalCode: string;
  approvalName: string;
  departmentCode: string;
  statutorySlaDays: number;
  status: string;
  daysElapsed: number;
  stopClockPausedDays: number;
  netDaysElapsed: number;
  daysRemaining: number;
  escalationLevel: EscalationLevel;
  escalationAuthority: string;
  isDeemedApprovalTriggered: boolean;
}

export interface ApplicationSlaReport {
  applicationId: string;
  applicationNumber: string;
  businessName: string;
  submittedAt: string;
  overallStatutorySlaDays: number;
  daysElapsed: number;
  stopClockPausedDays: number;
  netDaysElapsed: number;
  daysRemaining: number;
  escalationLevel: EscalationLevel;
  escalationAuthority: string;
  isDeemedApprovalTriggered: boolean;
  activeQueriesCount: number;
  isClockPaused: boolean;
  clearances: ClearanceSlaDetail[];
  appellateHierarchy: {
    firstAppellateAuthority: string;
    secondAppellateAuthority: string;
    deemedApprovalStatute: string;
  };
}

export class SlaService {
  /**
   * Calculate statutory SLA and escalation status for a given application
   * under Maharashtra Right to Public Services Act 2015.
   */
  public calculateApplicationSla(application: StoredApplication): ApplicationSlaReport {
    const profile = (application as any).businessProfile || db.businessProfiles.find(p => p.id === application.businessProfileId);
    const submissionDate = application.submittedAt || application.createdAt || new Date();
    const now = new Date();

    const rawDaysElapsed = Math.max(
      0,
      Math.floor((now.getTime() - new Date(submissionDate).getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate Stop-Clock query pauses (Maharashtra RTS Act Section 7)
    const appQueries = db.queries.filter(
      q => q.applicationId === application.id || q.applicationId === application.applicationNumber
    );

    let totalPausedDays = 0;
    let hasOpenQuery = false;

    for (const q of appQueries) {
      const qStart = new Date(q.createdAt).getTime();
      if (q.status === 'RESOLVED' && q.answeredAt) {
        const qEnd = new Date(q.answeredAt).getTime();
        const pausedMs = Math.max(0, qEnd - qStart);
        totalPausedDays += Math.floor(pausedMs / (1000 * 60 * 60 * 24));
      } else if (q.status === 'OPEN') {
        hasOpenQuery = true;
        const pausedMs = Math.max(0, now.getTime() - qStart);
        totalPausedDays += Math.floor(pausedMs / (1000 * 60 * 60 * 24));
      }
    }

    const overallSlaCap = 45; // Statutory maximum for industrial clearances
    const netOverallElapsed = Math.max(0, rawDaysElapsed - totalPausedDays);
    const overallDaysRemaining = overallSlaCap - netOverallElapsed;

    const overallLevel = this.determineEscalationLevel(overallDaysRemaining);

    // Calculate per-clearance SLA
    const clearances: ClearanceSlaDetail[] = application.approvals.map(appr => {
      const slaDays = appr.statutorySlaDays || 30;
      const netElapsed = Math.max(0, rawDaysElapsed - totalPausedDays);
      const remaining = appr.status === 'APPROVED' ? 0 : slaDays - netElapsed;
      const level = appr.status === 'APPROVED' ? 'NORMAL' : this.determineEscalationLevel(remaining);

      return {
        approvalCode: appr.approvalCode,
        approvalName: appr.approvalName,
        departmentCode: appr.departmentCode,
        statutorySlaDays: slaDays,
        status: appr.status,
        daysElapsed: rawDaysElapsed,
        stopClockPausedDays: totalPausedDays,
        netDaysElapsed: netElapsed,
        daysRemaining: remaining,
        escalationLevel: level,
        escalationAuthority: this.getAuthorityForLevel(level, appr.departmentCode),
        isDeemedApprovalTriggered: remaining <= 0 && appr.status !== 'APPROVED',
      };
    });

    return {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      businessName: profile?.businessName || 'Industrial Unit',
      submittedAt: new Date(submissionDate).toISOString().substring(0, 10),
      overallStatutorySlaDays: overallSlaCap,
      daysElapsed: rawDaysElapsed,
      stopClockPausedDays: totalPausedDays,
      netDaysElapsed: netOverallElapsed,
      daysRemaining: overallDaysRemaining,
      escalationLevel: overallLevel,
      escalationAuthority: this.getAuthorityForLevel(overallLevel),
      isDeemedApprovalTriggered: overallDaysRemaining <= 0 && application.stage !== 'APPROVED',
      activeQueriesCount: appQueries.filter(q => q.status === 'OPEN').length,
      isClockPaused: hasOpenQuery,
      clearances,
      appellateHierarchy: {
        firstAppellateAuthority: 'Joint Director of Industries (Regional Office)',
        secondAppellateAuthority: 'Principal Secretary (Industries), Govt. of Maharashtra',
        deemedApprovalStatute: 'Section 7(2) of Maharashtra Right to Public Services Act 2015',
      },
    };
  }

  /**
   * Determine RTS escalation level based on statutory days remaining
   */
  public determineEscalationLevel(daysRemaining: number): EscalationLevel {
    if (daysRemaining <= 0) return 'BREACHED_OR_DEEMED';
    if (daysRemaining <= 3) return 'CRITICAL';
    if (daysRemaining <= 7) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Get designated Appellate Authority title according to RTS statutory escalation tier
   */
  private getAuthorityForLevel(level: EscalationLevel, deptCode?: string): string {
    switch (level) {
      case 'BREACHED_OR_DEEMED':
        return 'Second Appellate Authority: Principal Secretary (Industries), Govt. of Maharashtra (Deemed Approval Enforced)';
      case 'CRITICAL':
        return 'First Appellate Authority: Joint Director of Industries (Pune/Regional Head)';
      case 'WARNING':
        return `Competent Scrutiny Officer: Head of Department (${deptCode || 'Single Window Nodal Agency'})`;
      case 'NORMAL':
      default:
        return 'Dealing Scrutiny Officer / Field Inspector';
    }
  }

  /**
   * Get SLA report for an application with tenant authorization check
   */
  public async getApplicationSla(
    applicationId: string,
    requestingUser?: { userId: string; role: string }
  ): Promise<ApplicationSlaReport> {
    let app: StoredApplication | null = null;
    try {
      app = await applicationService.getApplicationById(applicationId, requestingUser?.userId, requestingUser?.role);
    } catch {}

    if (!app) {
      app = db.applications.find(a => a.id === applicationId || a.applicationNumber === applicationId) || null;
    }

    if (!app) {
      throw new Error(`Application '${applicationId}' not found.`);
    }

    // Tenant check: Citizen can only view SLA for their own application
    if (requestingUser && requestingUser.role === 'CITIZEN' && app.userId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to view SLA metrics for this application.');
    }

    return this.calculateApplicationSla(app);
  }

  /**
   * Get all applications requiring officer escalation attention
   */
  public async getEscalationQueue(departmentCode?: string): Promise<ApplicationSlaReport[]> {
    const reports = db.applications.map(app => this.calculateApplicationSla(app));
    return reports.filter(r => {
      if (departmentCode) {
        return r.clearances.some(c => c.departmentCode === departmentCode && c.escalationLevel !== 'NORMAL');
      }
      return r.escalationLevel !== 'NORMAL';
    });
  }
}

export const slaService = new SlaService();
