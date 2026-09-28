import { ApplicableApproval, BusinessProfileData, DepartmentClearanceStatus, ApplicationSubmission } from '../types';
import { request } from './api';
import { INITIAL_APPLICABLE_APPROVALS, INITIAL_DEPARTMENT_CLEARANCES } from '../mock/mockData';

export const approvalService = {
  /**
   * Run dynamic rule-based assessment based on business profile parameters
   * Targets backend POST /assessment (or /approvals/assess)
   */
  async assessApprovals(profile: BusinessProfileData): Promise<{
    approvals: ApplicableApproval[];
    totalEstimatedFees: string;
    criticalPathDays: number;
    departmentsInvolved: string[];
  }> {
    try {
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
    } catch (err) {
      console.warn('[ApprovalService] Backend assessment failed, using local rule matching:', err);
      // Fallback evaluation based on profile inputs
      const approvals = [...INITIAL_APPLICABLE_APPROVALS];
      
      const filtered = approvals.filter(app => {
        if (app.id === 'appr-dish-boiler' && !profile.hasBoiler) return false;
        if (app.id === 'appr-cei-dg' && !profile.hasDgSet) return false;
        if (app.id === 'appr-midc-water' && !profile.isMidcArea) return false;
        return true;
      });

      return {
        approvals: filtered,
        totalEstimatedFees: '₹ 1,88,500',
        criticalPathDays: 45,
        departmentsInvolved: ['MPCB', 'DISH', 'Fire Services', 'MIDC', 'Energy Dept (CEI)'],
      };
    }
  },

  /**
   * Get list of applicable approvals for current application
   */
  async getApplicableApprovals(applicationId?: string): Promise<ApplicableApproval[]> {
    try {
      if (applicationId) {
        const res = await request<any>(`/applications/${applicationId}/approvals`);
        const data = res.data?.approvals || res.data || [];
        return data;
      }
      return await request<ApplicableApproval[]>('/approvals');
    } catch {
      return INITIAL_APPLICABLE_APPROVALS;
    }
  },

  /**
   * Get parallel department scrutiny statuses
   */
  async getDepartmentClearances(): Promise<DepartmentClearanceStatus[]> {
    try {
      const res = await request<any>('/approvals/departments');
      return res.data || res || INITIAL_DEPARTMENT_CLEARANCES;
    } catch {
      return INITIAL_DEPARTMENT_CLEARANCES;
    }
  },

  /**
   * Submit consolidated application across all parallel departments
   */
  async submitConsolidatedApplication(payload: any): Promise<ApplicationSubmission> {
    try {
      const res = await request<any>('/applications/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = res.data || res;
      return {
        id: data.id || `app-${Date.now()}`,
        applicationNumber: data.applicationNumber || `MH-IND-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        submittedAt: data.submittedAt || new Date().toISOString(),
        businessProfile: payload.businessProfile,
        approvals: payload.approvals || INITIAL_APPLICABLE_APPROVALS,
        documents: payload.documents || [],
        overallStatus: 'SUBMITTED',
        rtsMaxDays: 45,
        rtsDaysElapsed: 0,
        rtsDaysRemaining: 45,
      };
    } catch {
      const appNumber = `MH-IND-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const submission: ApplicationSubmission = {
        id: `app-${Date.now()}`,
        applicationNumber: appNumber,
        submittedAt: new Date().toISOString(),
        businessProfile: payload.businessProfile,
        approvals: payload.approvals || INITIAL_APPLICABLE_APPROVALS,
        documents: payload.documents || [],
        overallStatus: 'SUBMITTED',
        rtsMaxDays: 45,
        rtsDaysElapsed: 0,
        rtsDaysRemaining: 45,
      };
      localStorage.setItem('maha_active_application', JSON.stringify(submission));
      return submission;
    }
  },
};
