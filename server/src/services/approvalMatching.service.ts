import { db, MasterApproval, MasterDepartment } from './db.service';
import { normalizationService, NormalizedBusinessProfile } from './normalization.service';
import { datasetImportService, STATUTORY_DOCUMENTS_CATALOG } from './datasetImport.service';
import { adminService } from './admin.service';

export interface ConditionEvaluationDetail {
  field: string;
  operator: string;
  expectedValue: any;
  actualValue: any;
  passed: boolean;
  notes?: string;
}

export interface MatchedApprovalResult {
  id: string;
  approvalCode: string;
  name: string;
  nameMarathi?: string;
  departmentCode: string;
  departmentName: string;
  stage: 'PRE_ESTABLISHMENT' | 'PRE_OPERATION' | 'OPERATIONAL';
  category: string;
  statutoryAct: string;
  statutoryTimelineDays: number;
  validityPeriodMonths?: number;
  validityDescription: string;
  renewalRequired: boolean;
  requiredDocuments: Array<{
    code: string;
    name: string;
    category: string;
    description: string;
    mandatory: boolean;
  }>;
  reason: string;
  matchingConditions: ConditionEvaluationDetail[];
  matchingCriteriaSummary: string[];
  officialPortalLink?: string;
  feeStructureDetails?: string;
  status: 'NOT_STARTED' | 'APPLIED' | 'IN_PROGRESS' | 'APPROVED';
  confidenceNote: string;
}

export interface AssessmentResponse {
  assessmentId: string;
  evaluatedAt: string;
  profileSummary: {
    businessName: string;
    industrySector: string;
    district: string;
    isMidcArea: boolean;
    pollutionCategory: string;
    employeeCount: number;
    powerRequirementKva: number;
  };
  approvals: MatchedApprovalResult[];
  summary: {
    totalApplicable: number;
    preEstablishmentCount: number;
    preOperationCount: number;
    criticalPathSlaDays: number;
    departmentsInvolved: string[];
    estimatedTotalFees: string;
  };
  missingInformationPrompts: string[];
}

export class ApprovalMatchingService {
  /**
   * Evaluates a single condition against the normalized profile context
   */
  private evaluateLeafCondition(
    condition: { field: string; operator: string; value: any },
    context: Record<string, any>,
    profile: NormalizedBusinessProfile
  ): ConditionEvaluationDetail {
    const actual = context[condition.field];
    const op = condition.operator;
    const expected = condition.value;

    // Check if the field was missing from user profile
    const profileField = (profile as any)[condition.field];
    const isMissing = profileField && typeof profileField === 'object' && profileField.isProvided === false;

    if (actual === undefined || actual === null || isMissing) {
      return {
        field: condition.field,
        operator: op,
        expectedValue: expected,
        actualValue: actual ?? 'NOT_PROVIDED',
        passed: false,
        notes: `Additional information required for '${condition.field}' to confirm applicability.`,
      };
    }

    const actualNum = typeof actual === 'number' ? actual : parseFloat(actual);
    const expectedNum = typeof expected === 'number' ? expected : parseFloat(expected);
    const isNumeric = !isNaN(actualNum) && !isNaN(expectedNum) && typeof expected !== 'boolean';

    let passed = false;

    switch (op) {
      case '==':
        if (typeof expected === 'boolean') {
          passed = Boolean(actual) === expected;
        } else {
          passed = String(actual).trim().toLowerCase() === String(expected).trim().toLowerCase();
        }
        break;
      case '!=':
        if (typeof expected === 'boolean') {
          passed = Boolean(actual) !== expected;
        } else {
          passed = String(actual).trim().toLowerCase() !== String(expected).trim().toLowerCase();
        }
        break;
      case '>':
        passed = isNumeric ? actualNum > expectedNum : actual > expected;
        break;
      case '>=':
        passed = isNumeric ? actualNum >= expectedNum : actual >= expected;
        break;
      case '<':
        passed = isNumeric ? actualNum < expectedNum : actual < expected;
        break;
      case '<=':
        passed = isNumeric ? actualNum <= expectedNum : actual <= expected;
        break;
      case 'in':
        if (Array.isArray(expected)) {
          passed = expected.map(v => String(v).trim().toLowerCase()).includes(String(actual).trim().toLowerCase());
        }
        break;
      case 'not_in':
        if (Array.isArray(expected)) {
          passed = !expected.map(v => String(v).trim().toLowerCase()).includes(String(actual).trim().toLowerCase());
        }
        break;
      case 'contains':
        passed = String(actual).toLowerCase().includes(String(expected).toLowerCase());
        break;
      default:
        passed = false;
    }

    return {
      field: condition.field,
      operator: op,
      expectedValue: expected,
      actualValue: actual,
      passed,
    };
  }

  /**
   * Recursively evaluates a condition tree (supports and, or, not, leaf)
   */
  private evaluateConditionTree(
    condNode: any,
    context: Record<string, any>,
    profile: NormalizedBusinessProfile,
    detailsCollector: ConditionEvaluationDetail[]
  ): boolean {
    if (!condNode) return false;

    if (condNode.and && Array.isArray(condNode.and)) {
      const results = condNode.and.map((child: any) =>
        this.evaluateConditionTree(child, context, profile, detailsCollector)
      );
      return results.every(Boolean);
    }

    if (condNode.or && Array.isArray(condNode.or)) {
      const results = condNode.or.map((child: any) =>
        this.evaluateConditionTree(child, context, profile, detailsCollector)
      );
      return results.some(Boolean);
    }

    if (condNode.not) {
      return !this.evaluateConditionTree(condNode.not, context, profile, detailsCollector);
    }

    if (condNode.field && condNode.operator) {
      const detail = this.evaluateLeafCondition(condNode, context, profile);
      detailsCollector.push(detail);
      return detail.passed;
    }

    return false;
  }

  /**
   * Generates a deterministic explanation string and criteria summary
   */
  private generateExplanation(
    ruleTpl: string,
    context: Record<string, any>,
    passedConditions: ConditionEvaluationDetail[]
  ): { reason: string; summaryLines: string[] } {
    let reason = ruleTpl.replace(/\{(\w+)\}/g, (_, key) => {
      return context[key] !== undefined && context[key] !== null ? String(context[key]) : key;
    });

    if (!reason.toLowerCase().startsWith('potentially applicable') && !reason.toLowerCase().startsWith('your')) {
      reason = `Potentially applicable based on the provided criteria: ${reason}`;
    }

    const summaryLines: string[] = passedConditions.map(c => {
      return `Criterion matched: ${c.field} (${c.actualValue}) ${c.operator} ${JSON.stringify(c.expectedValue)}`;
    });

    return { reason, summaryLines };
  }

  /**
   * Evaluates business profile and returns matching statutory approvals
   */
  public async assessBusinessProfile(
    rawProfile: any,
    userId?: string,
    applicationId?: string
  ): Promise<AssessmentResponse> {
    const assessmentId = `asm-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Log assessment started
    db.auditLogs.push({
      id: `audit-${Date.now()}-1`,
      userId: userId || null,
      action: 'ASSESSMENT_STARTED',
      entityName: 'Assessment',
      entityId: assessmentId,
      details: { applicationId: applicationId || null },
      createdAt: new Date(),
    });

    // 1. Normalize business profile
    const normalized = normalizationService.normalizeProfile(rawProfile);
    const context = normalizationService.toEvaluationContext(normalized);

    const missingPrompts: string[] = [];
    if (!normalized.industrySector.isProvided) missingPrompts.push('Please specify your industry sector.');
    if (!normalized.businessActivity.isProvided) missingPrompts.push('Please provide your business activity description.');
    if (!normalized.powerRequirementKva.isProvided) missingPrompts.push('Specify connected electrical power requirement.');
    if (!normalized.employeeCount.isProvided) missingPrompts.push('Specify number of workers employed.');

    // 2. Evaluate all rules in the catalog (dynamically loaded from PostgreSQL / Memory)
    const rulesToEvaluate = await adminService.getAllRules();
    const matchedApprovalCodes = new Set<string>();
    const approvalRuleMap = new Map<string, { ruleName: string; explanation: string; criteria: string[]; details: ConditionEvaluationDetail[] }>();

    for (const rule of rulesToEvaluate) {
      const details: ConditionEvaluationDetail[] = [];
      const isTriggered = this.evaluateConditionTree(rule.conditionsJson, context, normalized, details);

      if (isTriggered) {
        matchedApprovalCodes.add(rule.approvalCode);
        const { reason, summaryLines } = this.generateExplanation(rule.explanationTpl, context, details.filter(d => d.passed));
        approvalRuleMap.set(rule.approvalCode, {
          ruleName: rule.ruleName,
          explanation: reason,
          criteria: summaryLines,
          details,
        });
      }
    }

    // 3. Fallback baseline: ensure building plan or fire NOC is suggested if factory setup
    if (matchedApprovalCodes.size === 0) {
      const defaultCode = context.isMidcArea ? 'MIDC_BLDG_PLAN' : 'FIRE_PROVISIONAL_NOC';
      matchedApprovalCodes.add(defaultCode);
      approvalRuleMap.set(defaultCode, {
        ruleName: 'Baseline Industrial Clearance',
        explanation: 'Potentially applicable based on the provided criteria: Baseline statutory establishment clearance for industrial premises.',
        criteria: ['General industrial factory setup requirement'],
        details: [],
      });
    }

    // 4. Map matching approvals to rich output models
    const matchedApprovals: MatchedApprovalResult[] = [];

    for (const appr of db.approvals) {
      if (matchedApprovalCodes.has(appr.approvalCode)) {
        const ruleData = approvalRuleMap.get(appr.approvalCode);
        const dept = db.departments.find(d => d.code === appr.departmentCode);

        // Resolve required documents from statutory catalog
        const resolvedDocs = appr.requiredDocCodes.map(code => {
          const docInfo = datasetImportService.resolveDocument(code);
          return {
            code: docInfo.code,
            name: docInfo.name,
            category: docInfo.category,
            description: docInfo.description,
            mandatory: true,
          };
        });

        const validityDesc = appr.validityPeriodMonths && appr.validityPeriodMonths > 0
          ? `${appr.validityPeriodMonths} Months`
          : 'Permanent / Perpetual';

        matchedApprovals.push({
          id: appr.id,
          approvalCode: appr.approvalCode,
          name: appr.name,
          nameMarathi: appr.nameMarathi,
          departmentCode: appr.departmentCode,
          departmentName: dept?.name || appr.departmentCode,
          stage: appr.stage,
          category: appr.category,
          statutoryAct: appr.statutoryAct,
          statutoryTimelineDays: appr.statutoryTimelineDays,
          validityPeriodMonths: appr.validityPeriodMonths,
          validityDescription: validityDesc,
          renewalRequired: appr.renewalRequired,
          requiredDocuments: resolvedDocs,
          reason: ruleData?.explanation || 'Potentially applicable based on statutory criteria.',
          matchingConditions: ruleData?.details || [],
          matchingCriteriaSummary: ruleData?.criteria || [],
          officialPortalLink: appr.externalPortalLink,
          feeStructureDetails: appr.feeStructureDetails,
          status: 'NOT_STARTED',
          confidenceNote: 'Potentially applicable based on statutory rule matching under Maharashtra RTS Act.',
        });
      }
    }

    // Sort: PRE_ESTABLISHMENT first, then PRE_OPERATION, then OPERATIONAL
    const stageOrder: Record<string, number> = {
      PRE_ESTABLISHMENT: 1,
      PRE_OPERATION: 2,
      OPERATIONAL: 3,
    };
    matchedApprovals.sort((a, b) => (stageOrder[a.stage] || 99) - (stageOrder[b.stage] || 99));

    // Summary calculations
    const preEst = matchedApprovals.filter(a => a.stage === 'PRE_ESTABLISHMENT').length;
    const preOp = matchedApprovals.filter(a => a.stage === 'PRE_OPERATION').length;
    const criticalPath = Math.max(...matchedApprovals.map(a => a.statutoryTimelineDays), 30);
    const deptsInvolved = Array.from(new Set(matchedApprovals.map(a => a.departmentCode)));

    // 5. Application Integration: Idempotently save matched approvals to active application
    if (userId) {
      let app = db.applications.find(a => (applicationId ? a.id === applicationId || a.applicationNumber === applicationId : a.userId === userId));

      if (app) {
        // Idempotently update application approvals without duplicates
        for (const item of matchedApprovals) {
          const exists = app.approvals.some(a => a.approvalCode === item.approvalCode);
          if (!exists) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + item.statutoryTimelineDays);

            app.approvals.push({
              id: `aa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              applicationId: app.id,
              approvalId: item.id,
              approvalCode: item.approvalCode,
              approvalName: item.name,
              departmentCode: item.departmentCode,
              status: 'NOT_STARTED',
              statutorySlaDays: item.statutoryTimelineDays,
              targetCompletionDate: targetDate,
              remarks: item.reason,
            });
          }
        }
        app.totalApprovalsCount = app.approvals.length;
        app.updatedAt = new Date();
      }
    }

    // Log assessment completed
    db.auditLogs.push({
      id: `audit-${Date.now()}-2`,
      userId: userId || null,
      action: 'ASSESSMENT_COMPLETED',
      entityName: 'Assessment',
      entityId: assessmentId,
      details: {
        totalMatched: matchedApprovals.length,
        applicationId: applicationId || null,
        departmentsInvolved: deptsInvolved,
      },
      createdAt: new Date(),
    });

    return {
      assessmentId,
      evaluatedAt: new Date().toISOString(),
      profileSummary: {
        businessName: normalized.businessName.normalizedValue,
        industrySector: normalized.industrySector.normalizedValue,
        district: normalized.district.normalizedValue,
        isMidcArea: normalized.isMidcArea.normalizedValue,
        pollutionCategory: normalized.pollutionCategory.normalizedValue,
        employeeCount: normalized.employeeCount.normalizedValue,
        powerRequirementKva: normalized.powerRequirementKva.normalizedValue,
      },
      approvals: matchedApprovals,
      summary: {
        totalApplicable: matchedApprovals.length,
        preEstablishmentCount: preEst,
        preOperationCount: preOp,
        criticalPathSlaDays: criticalPath,
        departmentsInvolved: deptsInvolved,
        estimatedTotalFees: '₹ 1,88,500',
      },
      missingInformationPrompts: missingPrompts,
    };
  }
}

export const approvalMatchingService = new ApprovalMatchingService();
