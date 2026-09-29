import { ApplicableApproval, BusinessProfileData, DepartmentClearanceStatus, ApplicationSubmission } from '../types';
import { request } from './api';

export const approvalService = {
  /**
   * Run dynamic rule-based assessment based on business profile parameters
   * Targets backend POST /assessment
   */
  async assessApprovals(profile: BusinessProfileData): Promise<{
    approvals: ApplicableApproval[];
    totalEstimatedFees: string;
    criticalPathDays: number;
    departmentsInvolved: string[];
  }> {
    const response = await request<any>('/assessment', {
      method: 'POST',
      body: JSON.stringify(profile),
    });

    const data = response.data || response;
    const rawApprovals = data.approvals || [];

    const mappedApprovals: ApplicableApproval[] = rawApprovals.map((app: any) => ({
      id: app.id || app.approvalCode,
      approvalCode: app.approvalCode,
      name: app.name,
      nameMarathi: app.nameMarathi,
      departmentCode: app.departmentCode,
      departmentName: app.departmentName,
      stage: app.stage || 'PRE_ESTABLISHMENT',
      category: app.category || 'NOC',
      statutoryAct: app.statutoryAct || 'Statutory Industry Regulation',
      statutoryTimelineDays: app.statutoryTimelineDays || 30,
      expectedTimelineDays: app.statutoryTimelineDays || 30,
      reason: app.reason || 'Potentially applicable based on statutory criteria.',
      requiredDocuments: (app.requiredDocuments || []).map((doc: any) =>
        typeof doc === 'string' ? doc : `${doc.name} (${doc.code})`
      ),
      validityMonths: app.validityPeriodMonths ?? null,
      renewalRequired: Boolean(app.renewalRequired),
      status: app.status || 'NOT_STARTED',
      feeEstimate: app.feeStructureDetails || 'As per statutory schedule',
      officialPortalLink: app.officialPortalLink || undefined,
      matchingCriteriaSummary: app.matchingCriteriaSummary || [],
    }));

    return {
      approvals: mappedApprovals,
      totalEstimatedFees: data.summary?.estimatedTotalFees || '₹ 1,88,500',
      criticalPathDays: data.summary?.criticalPathSlaDays || 45,
      departmentsInvolved: data.summary?.departmentsInvolved || ['MPCB', 'MIDC', 'DISH', 'FIRE'],
    };
  },

  /**
   * Get list of applicable approvals for current application
   */
  async getApplicableApprovals(applicationId?: string): Promise<ApplicableApproval[]> {
    try {
      if (applicationId) {
        const res = await request<any>(`/applications/${applicationId}/approvals`);
        return res.data?.approvals || res.approvals || res || [];
      }
      const res = await request<any>('/approvals');
      const list = Array.isArray(res) ? res : res.data || [];
      return list.map((app: any) => ({
        id: app.id || app.approvalCode,
        approvalCode: app.approvalCode,
        name: app.name,
        nameMarathi: app.nameMarathi,
        departmentCode: app.departmentCode,
        departmentName: app.departmentCode,
        stage: app.stage || 'PRE_ESTABLISHMENT',
        category: app.category || 'NOC',
        statutoryAct: app.statutoryAct || '',
        statutoryTimelineDays: app.statutoryTimelineDays || 30,
        expectedTimelineDays: app.statutoryTimelineDays || 30,
        reason: 'Statutory Maharashtra clearance',
        requiredDocuments: app.requiredDocCodes || [],
        validityMonths: app.validityPeriodMonths || null,
        renewalRequired: Boolean(app.renewalRequired),
        status: 'NOT_STARTED',
        feeEstimate: app.feeStructureDetails || '',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Get parallel department scrutiny statuses from real PostgreSQL database
   */
  async getDepartmentClearances(): Promise<DepartmentClearanceStatus[]> {
    try {
      const res = await request<any>('/approvals/departments');
      const list = Array.isArray(res) ? res : res.data || [];
      return list;
    } catch {
      return [];
    }
  },

  /**
   * Submit consolidated application across all parallel departments
   */
  async submitConsolidatedApplication(payload: any): Promise<ApplicationSubmission> {
    const res = await request<any>('/applications/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = res.data || res;
    const submission: ApplicationSubmission = {
      id: data.id,
      applicationNumber: data.applicationNumber,
      submittedAt: data.submittedAt || new Date().toISOString(),
      businessProfile: payload.businessProfile,
      approvals: payload.approvals || [],
      documents: payload.documents || [],
      overallStatus: data.stage || 'SUBMITTED',
      rtsMaxDays: 45,
      rtsDaysElapsed: 0,
      rtsDaysRemaining: 45,
    };

    return submission;
  },
};
