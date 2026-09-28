/**
 * SIH26130 Phase 7 - Automated Test Suite
 * 14 Scenarios for Administrative Governance & Control Center,
 * State Performance Analytics, Master Statutory Rules Management,
 * Regulatory Audit Trail Explorer with PII Masking,
 * User Governance, and Maharashtra RTS Act 2015 Statutory Appeals.
 */

import { adminService } from '../services/admin.service';
import { appealService } from '../services/appeal.service';
import { db, StoredApplication, StoredAppeal } from '../services/db.service';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(id: string, name: string, passed: boolean, details: string) {
  results.push({ id, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${id}] ${icon} | ${name}`);
  console.log(`               Details: ${details}\n`);
}

async function runPhase7Tests() {
  console.log('====================================================');
  console.log(' SIH26130 Phase 7 - Automated Test Suite');
  console.log(' 14 Admin Governance, State Analytics, Audit & RTS Appeals Scenarios');
  console.log('====================================================\n');

  // Baseline mock setup for Phase 7
  const citizenAId = 'user-citizen-p7-alpha';
  const citizenBId = 'user-citizen-p7-beta';
  const officerId = 'user-officer-joint-dir';
  const adminId = 'user-admin-state-hq';

  const testAppA: StoredApplication = {
    id: 'app-p7-tenant-a',
    userId: citizenAId,
    businessProfileId: 'prof-p7-chem-eng',
    applicationNumber: 'MH-2026-IND-99101',
    stage: 'UNDER_SCRUTINY',
    overallProgress: 50,
    projectStage: 'PRE_ESTABLISHMENT',
    totalApprovalsCount: 2,
    approvedCount: 0,
    rejectedCount: 0,
    queryPendingCount: 0,
    submittedAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000), // 48 days ago (breached 45d SLA)
    targetCompletionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    approvals: [
      {
        id: 'aa-p7-mpcb',
        applicationId: 'app-p7-tenant-a',
        approvalId: 'appr-mpcb-cte',
        approvalCode: 'MPCB_CTE',
        approvalName: 'Consent to Establish (CTE)',
        departmentCode: 'MPCB',
        status: 'IN_PROGRESS',
        statutorySlaDays: 45,
        appliedDate: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'aa-p7-dish',
        applicationId: 'app-p7-tenant-a',
        approvalId: 'appr-dish-fact',
        approvalCode: 'DISH_FACT_LIC',
        approvalName: 'DISH Factory Plan Approval & Registration',
        departmentCode: 'DISH',
        status: 'IN_PROGRESS',
        statutorySlaDays: 30,
        appliedDate: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
      },
    ],
  };

  db.applications.push(testAppA);

  // -------------------------------------------------------------------------
  // Scenario 01: State-level executive analytics computation
  // -------------------------------------------------------------------------
  try {
    const analytics = await adminService.getStateAnalytics();
    const s = analytics.stateSummary;
    const isValid =
      s.totalApplicationsReceived > 0 &&
      s.totalIndustrialInvestmentCr > 0 &&
      s.totalEmploymentGenerated > 0 &&
      s.overallSlaCompliancePercentage >= 0 &&
      s.overallSlaCompliancePercentage <= 100 &&
      s.totalStatutoryClearancesIssued >= 0;

    recordTest(
      'PHASE7-01',
      'State-Level Executive Analytics Computation',
      isValid,
      `Calculated: Applications=${s.totalApplicationsReceived}, Capex=₹${s.totalIndustrialInvestmentCr} Cr, Compliance=${s.overallSlaCompliancePercentage}%, Clearances=${s.totalStatutoryClearancesIssued}`
    );
  } catch (err: any) {
    recordTest('PHASE7-01', 'State-Level Executive Analytics Computation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 02: Cross-department RTS performance rankings
  // -------------------------------------------------------------------------
  try {
    const analytics = await adminService.getStateAnalytics();
    const depts = analytics.departmentRankings;
    const hasDepartments = depts.length >= 3;
    const mpcb = depts.find((d) => d.departmentCode === 'MPCB');
    const validMetrics =
      mpcb !== undefined &&
      mpcb.totalApplications >= 0 &&
      mpcb.slaComplianceRate >= 0 &&
      mpcb.averageProcessingDays > 0;

    recordTest(
      'PHASE7-02',
      'Cross-Department RTS Performance Rankings & SLAs',
      hasDepartments && validMetrics,
      `Ranked ${depts.length} departments. MPCB: Total=${mpcb?.totalApplications}, SLA=${mpcb?.slaComplianceRate}%, AvgDays=${mpcb?.averageProcessingDays}`
    );
  } catch (err: any) {
    recordTest('PHASE7-02', 'Cross-Department RTS Performance Rankings & SLAs', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 03: District industrial Capex heatmap generation
  // -------------------------------------------------------------------------
  try {
    const analytics = await adminService.getStateAnalytics();
    const heatmap = analytics.districtHeatmap;
    const hasDistricts = heatmap.length >= 3;
    const pune = heatmap.find((d) => d.district.toLowerCase().includes('pune'));
    const isValid = hasDistricts && pune !== undefined && pune.investmentAmountCr > 0;

    recordTest(
      'PHASE7-03',
      'District Industrial Capex Heatmap Generation',
      isValid,
      `Aggregated ${heatmap.length} districts. Pune: Applications=${pune?.applicationsCount}, Capex=₹${pune?.investmentAmountCr} Cr, Score=${pune?.complianceScore}`
    );
  } catch (err: any) {
    recordTest('PHASE7-03', 'District Industrial Capex Heatmap Generation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 04: Dynamic creation of statutory master rule with predicate evaluation
  // -------------------------------------------------------------------------
  let createdRuleId = '';
  try {
    const newRule = await adminService.createRule(adminId, {
      approvalCode: 'MPCB_CTE',
      ruleCode: 'RULE_HAZMAT_WATER_DISCHARGE',
      ruleName: 'Statutory Effluent Discharge Threshold (Over 50 KLD)',
      priority: 65,
      conditionsJson: {
        field: 'waterRequirementKld',
        operator: 'GREATER_THAN',
        value: 50,
      },
      explanationTpl: 'Effluent load exceeds 50 KLD requiring formal MPCB ZLD effluent treatment plant clearance.',
    });

    createdRuleId = newRule.id;
    const rules = await adminService.getAllRules();
    const found = rules.find((r) => r.ruleCode === 'RULE_HAZMAT_WATER_DISCHARGE');

    recordTest(
      'PHASE7-04',
      'Dynamic Statutory Master Rule Creation with JSON Predicates',
      Boolean(found && found.priority === 65),
      `Created rule: ${newRule.ruleCode} (${newRule.id}) with priority 65 for ${newRule.approvalCode}`
    );
  } catch (err: any) {
    recordTest('PHASE7-04', 'Dynamic Statutory Master Rule Creation with JSON Predicates', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 05: Statutory rule creation validation failure
  // -------------------------------------------------------------------------
  try {
    await adminService.createRule(adminId, {
      approvalCode: '',
      ruleCode: '',
      ruleName: 'Invalid Incomplete Rule',
      priority: 10,
      conditionsJson: null as any,
      explanationTpl: '',
    });
    recordTest('PHASE7-05', 'Rule Creation Schema Validation', false, 'Allowed creation with blank code');
  } catch (err: any) {
    recordTest(
      'PHASE7-05',
      'Rule Creation Schema Validation (Rejection on Blank Fields)',
      true,
      `Rejected correctly: "${err.message}"`
    );
  }

  // -------------------------------------------------------------------------
  // Scenario 06: Regulatory audit trail recording and retrieval
  // -------------------------------------------------------------------------
  try {
    const logs = await adminService.getAuditLogs();
    const hasLogs = logs.length > 0;
    const ruleLog = logs.find((l) => l.action === 'CREATE_RULE' || l.entityName === 'MasterRule');
    const hasIP = ruleLog ? Boolean(ruleLog.ipAddress) : true;

    recordTest(
      'PHASE7-06',
      'Regulatory Audit Trail Recording & IP Capture',
      hasLogs && hasIP,
      `Total audit events: ${logs.length}. Latest action: ${logs[0]?.action} on ${logs[0]?.entityName} by IP: ${logs[0]?.ipAddress}`
    );
  } catch (err: any) {
    recordTest('PHASE7-06', 'Regulatory Audit Trail Recording & IP Capture', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 07: Regulatory audit trail PII masking
  // -------------------------------------------------------------------------
  try {
    // Audit a mock event with personal identifiable details
    await adminService.logAuditEvent({
      userId: citizenAId,
      userRole: 'CITIZEN',
      action: 'PROFILE_ACCESSED',
      entityName: 'BusinessProfile',
      entityId: 'prof-p7-chem-eng',
      details: {
        applicantEmail: 'rajesh.patil@omkara-eng.co.in',
        applicantPhone: '+91 98230 45678',
        aadhaarNumber: '9876-5432-1098',
      },
      ipAddress: '103.21.144.92',
    });

    const logs = await adminService.getAuditLogs({ entityName: 'BusinessProfile' });
    const profileLog = logs.find((l) => l.action === 'PROFILE_ACCESSED');
    const details = profileLog?.details || {};

    const emailMasked = typeof details.applicantEmail === 'string' && details.applicantEmail.includes('*');
    const phoneMasked = typeof details.applicantPhone === 'string' && details.applicantPhone.includes('*');

    recordTest(
      'PHASE7-07',
      'Regulatory Audit Trail PII Masking (Email, Phone, Identifiers)',
      emailMasked && phoneMasked,
      `Masked PII: email="${details.applicantEmail}", phone="${details.applicantPhone}"`
    );
  } catch (err: any) {
    recordTest('PHASE7-07', 'Regulatory Audit Trail PII Masking', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 08: Regulatory audit log filtering by action
  // -------------------------------------------------------------------------
  try {
    const filteredLogs = await adminService.getAuditLogs({ action: 'CREATE_RULE' });
    const allMatch = filteredLogs.every((l) => l.action === 'CREATE_RULE');

    recordTest(
      'PHASE7-08',
      'Regulatory Audit Log Search & Multi-Field Filtering',
      allMatch && filteredLogs.length > 0,
      `Filtered ${filteredLogs.length} events strictly matching action=CREATE_RULE.`
    );
  } catch (err: any) {
    recordTest('PHASE7-08', 'Regulatory Audit Log Search & Multi-Field Filtering', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 09: User governance - account status toggle & audit event
  // -------------------------------------------------------------------------
  try {
    const users = await adminService.getUsers();
    const targetUser = users[0];
    const initialStatus = targetUser.isActive;

    const updated = await adminService.toggleUserStatus(targetUser.id, !initialStatus, adminId);
    const reverted = await adminService.toggleUserStatus(targetUser.id, initialStatus, adminId);

    recordTest(
      'PHASE7-09',
      'User Governance & Account Active/Suspend Lifecycle Controls',
      updated.isActive === !initialStatus && reverted.isActive === initialStatus,
      `Toggled user ${targetUser.email}: active=${initialStatus} -> ${updated.isActive} -> restored to ${reverted.isActive}`
    );
  } catch (err: any) {
    recordTest('PHASE7-09', 'User Governance & Account Active/Suspend Lifecycle Controls', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 10: Citizen RTS 2015 statutory appeal filing (Section 18)
  // -------------------------------------------------------------------------
  let filedAppealId = '';
  try {
    const appeal = await appealService.fileAppeal(citizenAId, {
      applicationId: 'app-p7-tenant-a',
      departmentCode: 'MPCB',
      appellateAuthority: 'FIRST_APPELLATE',
      groundForAppeal: 'SLA_BREACH',
      applicantStatement: 'MPCB Consent to Establish delayed beyond 45 days statutory guarantee without recorded justification.',
    });

    filedAppealId = appeal.id;
    const isNumberValid = appeal.appealNumber.startsWith('MH-RTS-APP-');
    const isStatusPending = appeal.status === 'PENDING';

    recordTest(
      'PHASE7-10',
      'Citizen RTS 2015 Statutory Appeal Filing (Section 18)',
      isNumberValid && isStatusPending,
      `Filed Appeal Docket: ${appeal.appealNumber}, Status=${appeal.status}, Authority="${appeal.appellateAuthorityTitle}"`
    );
  } catch (err: any) {
    recordTest('PHASE7-10', 'Citizen RTS 2015 Statutory Appeal Filing (Section 18)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 11: Multi-tenant boundary isolation for RTS appeals
  // -------------------------------------------------------------------------
  try {
    // Citizen A should see their appeal
    const citizenAAppeals = await appealService.getAppeals({ userId: citizenAId, role: 'CITIZEN' });
    const citizenBAppeals = await appealService.getAppeals({ userId: citizenBId, role: 'CITIZEN' });

    const citizenAOwnsIt = citizenAAppeals.some((a) => a.id === filedAppealId);
    const citizenBBlocked = !citizenBAppeals.some((a) => a.id === filedAppealId);

    // Cross-tenant direct access attempt
    let directBreachPrevented = false;
    try {
      await appealService.getAppealById(filedAppealId, { userId: citizenBId, role: 'CITIZEN' });
    } catch {
      directBreachPrevented = true;
    }

    recordTest(
      'PHASE7-11',
      'Multi-Tenant Boundary Isolation for Statutory Grievances',
      citizenAOwnsIt && citizenBBlocked && directBreachPrevented,
      `Tenant A sees appeal (${citizenAAppeals.length}), Tenant B sees (${citizenBAppeals.length}). Cross-tenant direct query rejected.`
    );
  } catch (err: any) {
    recordTest('PHASE7-11', 'Multi-Tenant Boundary Isolation for Statutory Grievances', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 12: Statutory appeal filing validation failure
  // -------------------------------------------------------------------------
  try {
    await appealService.fileAppeal(citizenAId, {
      applicationId: '',
      departmentCode: '',
      appellateAuthority: 'FIRST_APPELLATE',
      groundForAppeal: 'OTHER',
      applicantStatement: '   ',
    });
    recordTest('PHASE7-12', 'Statutory Appeal Filing Validation', false, 'Allowed filing with blank statement and application ID');
  } catch (err: any) {
    recordTest(
      'PHASE7-12',
      'Statutory Appeal Filing Validation (Rejection on Blank Grounds)',
      true,
      `Validation rejected invalid appeal: "${err.message}"`
    );
  }

  // -------------------------------------------------------------------------
  // Scenario 13: Appellate authority disposal order (DIRECTED_CLEARANCE)
  // -------------------------------------------------------------------------
  try {
    const decided = await appealService.decideAppeal(
      officerId,
      'Joint Director of Industries (Pune Region)',
      filedAppealId,
      'DIRECTED_CLEARANCE',
      'Prima facie examination reveals all statutory environmental norms satisfied. MPCB directed to issue CTE within 48 hours pursuant to RTS Act 2015 Section 19.'
    );

    // Check if the underlying approval was automatically updated
    const app = db.applications.find((a) => a.id === 'app-p7-tenant-a');
    const mpcbApproval = app?.approvals.find((a) => a.approvalCode === 'MPCB_CTE');

    const isOrderRecorded = decided.status === 'DIRECTED_CLEARANCE' && Boolean(decided.decidedAt);
    const isApprovalCleared = mpcbApproval?.status === 'APPROVED';

    recordTest(
      'PHASE7-13',
      'Appellate Disposal Order (DIRECTED_CLEARANCE & Auto-Grant)',
      isOrderRecorded && isApprovalCleared,
      `Order: status=${decided.status}, DecidedBy="${decided.decidedBy}", MPCB Approval auto-transitioned to ${mpcbApproval?.status}`
    );
  } catch (err: any) {
    recordTest('PHASE7-13', 'Appellate Disposal Order (DIRECTED_CLEARANCE & Auto-Grant)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 14: Appellate authority disposal order (DISMISSED with legal reasons)
  // -------------------------------------------------------------------------
  try {
    // File second appeal to test dismissal
    const appeal2 = await appealService.fileAppeal(citizenAId, {
      applicationId: 'app-p7-tenant-a',
      departmentCode: 'DISH',
      appellateAuthority: 'FIRST_APPELLATE',
      groundForAppeal: 'REJECTION_WITHOUT_REASON',
      applicantStatement: 'DISH factory license rejected despite submission of all certified safety plans.',
    });

    const dismissed = await appealService.decideAppeal(
      officerId,
      'Joint Director of Industries (Pune Region)',
      appeal2.id,
      'DISMISSED',
      'Applicant failed to submit mandatory hazardous chemical storage pressure vessel certificate. Rejection upheld under Section 18(2).'
    );

    const isDismissed = dismissed.status === 'DISMISSED';
    const hasRemarks = dismissed.officerRemarks?.includes('Section 18(2)');

    recordTest(
      'PHASE7-14',
      'Appellate Disposal Order (DISMISSED with Recorded Statutory Reasons)',
      isDismissed && Boolean(hasRemarks),
      `Docket ${dismissed.appealNumber} status=${dismissed.status}, Reasons recorded: "${dismissed.officerRemarks?.substring(0, 75)}..."`
    );
  } catch (err: any) {
    recordTest('PHASE7-14', 'Appellate Disposal Order (DISMISSED with Recorded Statutory Reasons)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Final Test Suite Summary
  // -------------------------------------------------------------------------
  console.log('====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(` PHASE 7 TEST SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} failed)`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase7Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
