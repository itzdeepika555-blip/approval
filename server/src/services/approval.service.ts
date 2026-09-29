import { db, MasterApproval, MasterDepartment } from './db.service';
import { evaluateApprovalRules } from '../engine/rule-evaluator';

export class ApprovalService {
  /**
   * Retrieves all registered departments in Maharashtra from PostgreSQL
   */
  public async getDepartments(): Promise<MasterDepartment[]> {
    const depts = await db.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    return depts.map(d => ({
      id: d.id,
      code: d.code,
      name: d.name,
      nameMarathi: d.nameMarathi || undefined,
      description: d.description || undefined,
      portalUrl: d.portalUrl || undefined,
      nodalOfficerEmail: d.nodalOfficerEmail || undefined,
      slaWorkingDays: d.slaWorkingDays,
      isActive: d.isActive,
    }));
  }

  /**
   * Retrieves all master approvals from PostgreSQL
   */
  public async getAllApprovals(): Promise<MasterApproval[]> {
    const apps = await db.prisma.approval.findMany({
      where: { isActive: true },
      include: { department: true },
      orderBy: { approvalCode: 'asc' },
    });

    return apps.map(a => ({
      id: a.id,
      departmentId: a.departmentId,
      departmentCode: a.department.code,
      approvalCode: a.approvalCode,
      name: a.name,
      nameMarathi: a.nameMarathi || undefined,
      stage: a.stage as any,
      category: a.category,
      description: a.description,
      statutoryAct: a.statutoryAct,
      statutoryTimelineDays: a.statutoryTimelineDays,
      validityPeriodMonths: a.validityPeriodMonths || undefined,
      renewalRequired: a.renewalRequired,
      requiredDocCodes: a.requiredDocCodes,
      feeStructureDetails: a.feeStructureDetails || undefined,
      externalPortalLink: a.externalPortalLink || undefined,
      isActive: a.isActive,
    }));
  }

  /**
   * Evaluates statutory rules against profile parameters to determine applicable approvals
   */
  public async assessApprovals(profile: any) {
    const rules = await db.prisma.approvalRule.findMany({
      where: { isActive: true },
      include: { approval: true },
    });

    const masterRules = rules.map(r => ({
      id: r.id,
      approvalCode: r.approval.approvalCode,
      ruleCode: r.ruleCode,
      ruleName: r.ruleName,
      priority: r.priority,
      conditionsJson: r.conditionsJson,
      explanationTpl: r.explanationTpl,
    }));

    const ruleResults = evaluateApprovalRules(masterRules, profile);
    const triggeredApprovalCodes = new Set(ruleResults.map(r => r.approvalCode));

    const allApprovals = await this.getAllApprovals();

    // Map to approval master items
    const applicableApprovals = allApprovals
      .filter(app => triggeredApprovalCodes.has(app.approvalCode))
      .map(app => {
        const matchingRule = ruleResults.find(r => r.approvalCode === app.approvalCode);
        return {
          ...app,
          triggerReason: matchingRule?.reason || 'Mandatory statutory requirement based on industrial parameters.',
          status: 'NOT_STARTED',
        };
      });

    // Baseline if none matched
    if (applicableApprovals.length === 0) {
      const defaultCodes = profile?.isMidcArea ? ['MIDC_BLDG_PLAN', 'FIRE_PROVISIONAL_NOC'] : ['REVENUE_NA_PERM', 'FIRE_PROVISIONAL_NOC'];
      applicableApprovals.push(
        ...allApprovals
          .filter(a => defaultCodes.includes(a.approvalCode))
          .map(a => ({
            ...a,
            triggerReason: 'Baseline industrial establishment clearance.',
            status: 'NOT_STARTED',
          }))
      );
    }

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
   * Returns parallel department clearance statuses based on real database records
   */
  public async getDepartmentClearances(userId?: string) {
    const whereApp: any = {};
    if (userId) {
      whereApp.userId = userId;
    }

    const activeApp = await db.prisma.application.findFirst({
      where: whereApp,
      include: {
        applicationApprovals: {
          include: { approval: true, department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeApp && activeApp.applicationApprovals.length > 0) {
      return activeApp.applicationApprovals.map(app => {
        const sla = app.approval?.statutoryTimelineDays || 30;
        const appliedTime = app.appliedAt ? app.appliedAt.getTime() : activeApp.createdAt.getTime();
        const daysElapsed = Math.max(0, Math.floor((Date.now() - appliedTime) / (1000 * 60 * 60 * 24)));

        const daysRemaining = Math.max(0, sla - daysElapsed);
        return {
          id: app.id,
          departmentCode: app.department.code,
          departmentName: app.department.name,
          approvalName: app.approval?.name || 'Statutory Approval',
          status: app.status,
          slaDays: sla,
          daysElapsed,
          daysRemaining,
          officerName: 'Competent Scrutiny Authority',
          officerAssigned: 'Competent Scrutiny Authority',
          remarks: app.remarks || 'Application under departmental verification.',
          notes: app.remarks || 'Application under departmental verification.',
          updatedAt: app.updatedAt ? app.updatedAt.toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        };
      });
    }

    // Return real empty list if no active application
    return [];
  }
}

export const approvalService = new ApprovalService();
