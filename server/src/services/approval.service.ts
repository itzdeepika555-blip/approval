import { db, MasterApproval, MasterDepartment } from './db.service';
import { evaluateApprovalRules } from '../engine/rule-evaluator';

export class ApprovalService {
  /**
   * Retrieves all registered departments in Maharashtra
   */
  public async getDepartments(): Promise<MasterDepartment[]> {
    return db.departments;
  }

  /**
   * Retrieves all master approvals
   */
  public async getAllApprovals(): Promise<MasterApproval[]> {
    return db.approvals;
  }

  /**
   * Evaluates statutory rules against profile parameters to determine applicable approvals
   */
  public async assessApprovals(profile: any) {
    const rules = db.rules;
    const ruleResults = evaluateApprovalRules(rules, profile);

    const triggeredApprovalCodes = new Set(ruleResults.map(r => r.approvalCode));

    // Map to approval master items
    const applicableApprovals = db.approvals
      .filter(app => triggeredApprovalCodes.has(app.approvalCode))
      .map(app => {
        const matchingRule = ruleResults.find(r => r.approvalCode === app.approvalCode);
        return {
          ...app,
          triggerReason: matchingRule?.reason || 'Mandatory statutory requirement based on industrial parameters.',
          status: 'NOT_STARTED',
        };
      });

    // Also include default base clearances if none matched (e.g. fire / revenue / plan)
    if (applicableApprovals.length === 0) {
      const defaultCodes = ['FIRE_PROVISIONAL_NOC', 'MIDC_BLDG_PLAN'];
      applicableApprovals.push(
        ...db.approvals
          .filter(a => defaultCodes.includes(a.approvalCode))
          .map(a => ({
            ...a,
            triggerReason: 'Baseline industrial establishment clearance.',
            status: 'NOT_STARTED',
          }))
      );
    }

    // Calculate critical path (maximum statutory SLA days among parallel approvals)
    const criticalPathDays = Math.max(...applicableApprovals.map(a => a.statutoryTimelineDays), 30);
    const departmentsInvolved = Array.from(new Set(applicableApprovals.map(a => a.departmentCode)));

    return {
      approvals: applicableApprovals,
      totalEstimatedFees: '₹ 1,88,500',
      criticalPathDays,
      departmentsInvolved,
    };
  }

  /**
   * Returns parallel department clearance statuses
   */
  public async getDepartmentClearances(userId?: string) {
    // Return live tracking status from active application if available
    const activeApp = db.applications.find(a => (userId ? a.userId === userId : true));

    if (activeApp && activeApp.approvals.length > 0) {
      return activeApp.approvals.map(app => {
        const dept = db.departments.find(d => d.code === app.departmentCode);
        return {
          departmentCode: app.departmentCode,
          departmentName: dept?.name || app.departmentCode,
          approvalName: app.approvalName,
          status: app.status,
          slaDays: app.statutorySlaDays,
          daysElapsed: Math.floor(Math.random() * (app.statutorySlaDays / 2)),
          officerName: 'Dr. Rahul Deshmukh',
          remarks: app.remarks || 'Application under departmental verification.',
        };
      });
    }

    // Default departmental statuses for presentation
    return [
      {
        departmentCode: 'MPCB',
        departmentName: 'Maharashtra Pollution Control Board',
        approvalName: 'Consent to Establish (CTE)',
        status: 'QUERY_RAISED',
        slaDays: 45,
        daysElapsed: 14,
        officerName: 'Dr. Rahul Deshmukh',
        remarks: 'Clarification sought regarding ETP capacity.',
      },
      {
        departmentCode: 'DISH',
        departmentName: 'Directorate of Industrial Safety & Health',
        approvalName: 'Factory Registration & License',
        status: 'IN_PROGRESS',
        slaDays: 30,
        daysElapsed: 8,
        officerName: 'Shri A. P. Kulkarni',
        remarks: 'Structural stability certificate under scrutiny.',
      },
      {
        departmentCode: 'FIRE',
        departmentName: 'Maharashtra Fire Services',
        approvalName: 'Provisional Fire Safety NOC',
        status: 'APPROVED',
        slaDays: 21,
        daysElapsed: 12,
        officerName: 'Chief Fire Officer',
        remarks: 'Cleared architectural fire egress guidelines.',
      },
      {
        departmentCode: 'MIDC',
        departmentName: 'MIDC Industrial Authority',
        approvalName: 'Building Plan Approval',
        status: 'APPROVED',
        slaDays: 30,
        daysElapsed: 18,
        officerName: 'Executive Engineer (Civil)',
        remarks: 'Commencement Certificate issued.',
      },
      {
        departmentCode: 'MSEDCL',
        departmentName: 'MSEDCL (State Electricity)',
        approvalName: 'High Tension (HT) Power Sanction',
        status: 'IN_PROGRESS',
        slaDays: 15,
        daysElapsed: 6,
        officerName: 'Superintending Engineer',
        remarks: 'Substation feasibility report awaited.',
      },
    ];
  }
}

export const approvalService = new ApprovalService();
