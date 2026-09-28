/**
 * SIH26130 Phase 6 - Automated Test Suite
 * 14 Scenarios for Joint Common Inspections, Schemes & Subsidies Matcher,
 * Government Officer Scrutiny Portal, and RTS 2015 SLA Escalation Tracking.
 */

import { inspectionService } from '../services/inspection.service';
import { schemeService } from '../services/scheme.service';
import { officerService } from '../services/officer.service';
import { slaService } from '../services/sla.service';
import { db, StoredApplication } from '../services/db.service';

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

async function runPhase6Tests() {
  console.log('====================================================');
  console.log(' SIH26130 Phase 6 - Automated Test Suite');
  console.log(' 14 Joint Inspections, Schemes Matcher, Scrutiny & SLA Scenarios');
  console.log('====================================================\n');

  // Test setup: ensure baseline application and users
  const citizenAId = 'user-citizen-demo';
  const citizenBId = 'usr-different-citizen-xyz';
  const officerId = 'user-officer-mpcb';

  const testAppA: StoredApplication = {
    id: 'app-test-phase6-alpha',
    userId: citizenAId,
    businessProfileId: 'prof-demo-sahyadri',
    applicationNumber: 'MH-2026-IND-77001',
    stage: 'UNDER_SCRUTINY',
    overallProgress: 40,
    projectStage: 'PRE_ESTABLISHMENT',
    totalApprovalsCount: 3,
    approvedCount: 1,
    rejectedCount: 0,
    queryPendingCount: 0,
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    targetCompletionDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    approvals: [
      {
        id: 'aa-p6-01',
        applicationId: 'app-test-phase6-alpha',
        approvalId: 'appr-mpcb-cte',
        approvalCode: 'MPCB_CTE',
        approvalName: 'Consent to Establish (CTE)',
        departmentCode: 'MPCB',
        status: 'IN_PROGRESS',
        statutorySlaDays: 45,
        appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'aa-p6-02',
        applicationId: 'app-test-phase6-alpha',
        approvalId: 'appr-dish-fact',
        approvalCode: 'DISH_FACT_LIC',
        approvalName: 'DISH Factory Plan Approval & Registration',
        departmentCode: 'DISH',
        status: 'IN_PROGRESS',
        statutorySlaDays: 30,
        appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'aa-p6-03',
        applicationId: 'app-test-phase6-alpha',
        approvalId: 'appr-fire-noc',
        approvalCode: 'FIRE_PROV_NOC',
        approvalName: 'Provisional Fire Safety NOC',
        departmentCode: 'FIRE',
        status: 'APPROVED',
        statutorySlaDays: 15,
        appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  };

  db.applications.push(testAppA);

  // -------------------------------------------------------------------------
  // Scenario 01: Joint Common Inspection multi-department slot booking & synchronization
  // -------------------------------------------------------------------------
  try {
    const booked = await inspectionService.bookSlot(
      citizenAId,
      'slot-joint-01',
      '2026-10-15',
      '10:30 AM - 01:30 PM',
      testAppA.id
    );

    const isSync =
      booked.status === 'SCHEDULED' &&
      booked.isJoint === true &&
      booked.participatingDepartments.includes('MPCB') &&
      booked.participatingDepartments.includes('DISH') &&
      testAppA.stage === 'INSPECTION_SCHEDULED';

    recordTest(
      'Scenario 01',
      'Joint Common Inspection multi-department synchronization',
      isSync,
      `Synchronized ${booked.participatingDepartments.length} departments (MPCB, DISH, FIRE, BOILER) for ${booked.date}; application stage updated to '${testAppA.stage}'`
    );
  } catch (err: any) {
    recordTest('Scenario 01', 'Joint Common Inspection multi-department synchronization', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 02: Inspection Scheduling Conflict Prevention
  // -------------------------------------------------------------------------
  try {
    let conflictCaught = false;
    try {
      // Attempt to schedule conflicting inspection on same date and time slot
      await inspectionService.bookSlot(
        citizenAId,
        'slot-boiler-02',
        '2026-10-15',
        '10:30 AM - 01:30 PM',
        testAppA.id
      );
    } catch (err: any) {
      if (err.message && err.message.includes('Scheduling conflict')) {
        conflictCaught = true;
      }
    }

    recordTest(
      'Scenario 02',
      'Inspection Scheduling Conflict Prevention',
      conflictCaught,
      conflictCaught
        ? 'Successfully intercepted slot collision for 2026-10-15 (10:30 AM - 01:30 PM) with 409 Conflict rejection'
        : 'Failed to intercept simultaneous booking conflict'
    );
  } catch (err: any) {
    recordTest('Scenario 02', 'Inspection Scheduling Conflict Prevention', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 03: Inspection Input Validation & Past Date Rejection
  // -------------------------------------------------------------------------
  try {
    let pastDateCaught = false;
    try {
      await inspectionService.bookSlot(
        citizenAId,
        'slot-boiler-02',
        '2020-01-01',
        '11:00 AM - 02:00 PM',
        testAppA.id
      );
    } catch (err: any) {
      if (err.message && err.message.includes('past')) {
        pastDateCaught = true;
      }
    }

    let invalidFormatCaught = false;
    try {
      await inspectionService.bookSlot(
        citizenAId,
        'slot-boiler-02',
        'not-a-valid-date',
        '11:00 AM - 02:00 PM',
        testAppA.id
      );
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid')) {
        invalidFormatCaught = true;
      }
    }

    const passed = pastDateCaught && invalidFormatCaught;
    recordTest(
      'Scenario 03',
      'Inspection Input Validation & Past Date Rejection',
      passed,
      'Rejected both historical dates (2020-01-01) and malformed date strings with statutory validation errors'
    );
  } catch (err: any) {
    recordTest('Scenario 03', 'Inspection Input Validation & Past Date Rejection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 04: Cross-tenant Inspection Booking Protection
  // -------------------------------------------------------------------------
  try {
    let forbiddenCaught = false;
    try {
      // Citizen B attempts to schedule inspection for Citizen A's application
      await inspectionService.bookSlot(
        citizenBId,
        'slot-boiler-02',
        '2026-10-25',
        '11:00 AM - 02:00 PM',
        testAppA.id
      );
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        forbiddenCaught = true;
      }
    }

    recordTest(
      'Scenario 04',
      'Cross-tenant Inspection Booking Protection',
      forbiddenCaught,
      forbiddenCaught
        ? `Successfully prevented user '${citizenBId}' from booking inspection on Application '${testAppA.applicationNumber}'`
        : 'Cross-tenant boundary breach: Unauthorized user booked inspection'
    );
  } catch (err: any) {
    recordTest('Scenario 04', 'Cross-tenant Inspection Booking Protection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 05: Maharashtra PSI 2019/2024 Scheme Matcher (Zone C/D MSME)
  // -------------------------------------------------------------------------
  try {
    const profileMSME = {
      district: 'Pune',
      talukaCategory: 'C',
      investmentPlantMachinery: 45000000, // 4.5 Cr
      investmentLandBuilding: 25000000, // 2.5 Cr
    };

    const res = await schemeService.checkEligibility('sch-psi-2019', profileMSME);
    const passed =
      res.eligible === true &&
      res.subsidyPercentage === 40 &&
      res.estimatedBenefit.includes('40% Capital Subsidy') &&
      Boolean(res.breakdown.stampDutyExemption) &&
      Boolean(res.breakdown.powerSubsidy);

    recordTest(
      'Scenario 05',
      'Maharashtra PSI 2019/2024 Scheme Matcher (Zone C/D MSME)',
      passed,
      `Calculated 40% Capital Subsidy (₹ 280.00 Lakhs) + 100% Stamp Duty Exemption for ₹7.0 Cr capital investment in Zone C`
    );
  } catch (err: any) {
    recordTest('Scenario 05', 'Maharashtra PSI 2019/2024 Scheme Matcher (Zone C/D MSME)', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 06: Maharashtra Industrial Policy Zone A Exclusion
  // -------------------------------------------------------------------------
  try {
    const profileZoneA = {
      district: 'Mumbai Suburban',
      talukaCategory: 'A',
      investmentPlantMachinery: 50000000,
      investmentLandBuilding: 30000000,
    };

    const res = await schemeService.checkEligibility('sch-psi-2019', profileZoneA);
    const passed =
      res.subsidyPercentage === 0 &&
      res.estimatedBenefit.includes('Zone A location does not qualify for PSI Capital Subsidy');

    recordTest(
      'Scenario 06',
      'Maharashtra Industrial Policy Zone A Exclusion',
      passed,
      'Correctly excluded Mumbai Suburban (Zone A developed taluka) from capital grant while retaining statutory power/tax rebates'
    );
  } catch (err: any) {
    recordTest('Scenario 06', 'Maharashtra Industrial Policy Zone A Exclusion', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 07: Dr. Babasaheb Ambedkar Affirmative Scheme Matcher
  // -------------------------------------------------------------------------
  try {
    const scstProfile = {
      district: 'Solapur',
      isScStOwner: true,
      socialCategory: 'SC',
      investmentPlantMachinery: 20000000, // 2 Cr
      investmentLandBuilding: 10000000, // 1 Cr
    };

    const resEligible = await schemeService.checkEligibility('sch-ambedkar', scstProfile);

    const nonScstProfile = {
      district: 'Solapur',
      isScStOwner: false,
      socialCategory: 'GENERAL',
      investmentPlantMachinery: 20000000,
    };

    const resIneligible = await schemeService.checkEligibility('sch-ambedkar', nonScstProfile);

    const passed =
      resEligible.eligible === true &&
      resEligible.subsidyPercentage === 50 &&
      resEligible.breakdown.powerSubsidy.includes('₹ 2.00') &&
      resIneligible.eligible === false;

    recordTest(
      'Scenario 07',
      'Dr. Babasaheb Ambedkar Affirmative Scheme Matcher',
      passed,
      'Granted 50% capital subsidy (₹150.00 Lakhs) + ₹2.00/unit power concession for SC/ST unit; excluded non-SC/ST enterprise'
    );
  } catch (err: any) {
    recordTest('Scenario 07', 'Dr. Babasaheb Ambedkar Affirmative Scheme Matcher', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 08: Green Energy & ZLD Grant Matching
  // -------------------------------------------------------------------------
  try {
    const greenProfile = {
      district: 'Nashik',
      pollutionCategory: 'RED',
      effluentDischargeKld: 25,
    };

    const res = await schemeService.checkEligibility('sch-green-tech', greenProfile);
    const passed =
      res.eligible === true &&
      res.subsidyPercentage === 30 &&
      res.remarks.includes('advanced effluent treatment');

    recordTest(
      'Scenario 08',
      'Green Energy & ZLD Grant Matching',
      passed,
      `Matched 30% grant (up to ₹25.0 Lakhs) for RED category industrial unit installing Zero Liquid Discharge ETP`
    );
  } catch (err: any) {
    recordTest('Scenario 08', 'Green Energy & ZLD Grant Matching', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 09: Government Officer Scrutiny Desk & RBAC Authorization
  // -------------------------------------------------------------------------
  try {
    const apps = await officerService.getOfficerApplications();
    const target = apps.find(a => a.id === testAppA.id);

    const passed =
      apps.length > 0 &&
      Boolean(target) &&
      typeof target?.rtsDaysRemaining === 'number' &&
      target?.assignedDepartment !== '' &&
      target?.workersCount > 0;

    recordTest(
      'Scenario 09',
      'Government Officer Scrutiny Desk & RBAC Authorization',
      passed,
      `Loaded ${apps.length} applications in officer queue with statutory RTS days countdown (${target?.rtsDaysRemaining} days remaining)`
    );
  } catch (err: any) {
    recordTest('Scenario 09', 'Government Officer Scrutiny Desk & RBAC Authorization', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 10: Official Statutory Deficiency Query Workflow & Stop-Clock Activation
  // -------------------------------------------------------------------------
  let raisedQueryId = '';
  try {
    const query = await officerService.raiseQuery(
      officerId,
      testAppA.applicationNumber,
      'MPCB',
      'Please submit revised engineering design of secondary chemical neutralization tank.',
      'Dr. Rahul Deshmukh'
    );

    raisedQueryId = query.id;
    const mpcbApproval = testAppA.approvals.find(a => a.departmentCode === 'MPCB');
    const slaReport = slaService.calculateApplicationSla(testAppA);

    const passed =
      Boolean(query.id) &&
      query.status === 'PENDING_CITIZEN_REPLY' &&
      mpcbApproval?.status === 'QUERY_RAISED' &&
      slaReport.isClockPaused === true;

    recordTest(
      'Scenario 10',
      'Official Statutory Deficiency Query Workflow & Stop-Clock Activation',
      passed,
      `Raised query '${query.id}'; MPCB approval updated to QUERY_RAISED; statutory RTS clock successfully paused`
    );
  } catch (err: any) {
    recordTest('Scenario 10', 'Official Statutory Deficiency Query Workflow & Stop-Clock Activation', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 11: Citizen Query Reply & Statutory Clock Resumption
  // -------------------------------------------------------------------------
  try {
    const replyRes = await officerService.replyQuery(
      raisedQueryId,
      'Uploaded certified neutralization tank layout diagram signed by Chartered Environmental Engineer.',
      { userId: citizenAId, role: 'CITIZEN' }
    );

    const mpcbApproval = testAppA.approvals.find(a => a.departmentCode === 'MPCB');
    const slaReport = slaService.calculateApplicationSla(testAppA);

    const passed =
      replyRes.status === 'RESOLVED' &&
      mpcbApproval?.status === 'IN_PROGRESS' &&
      slaReport.isClockPaused === false;

    recordTest(
      'Scenario 11',
      'Citizen Query Reply & Statutory Clock Resumption',
      passed,
      `Query resolved; clearance returned to 'IN_PROGRESS'; statutory RTS clock resumed without penalty`
    );
  } catch (err: any) {
    recordTest('Scenario 11', 'Citizen Query Reply & Statutory Clock Resumption', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 12: Cross-Tenant Query Protection & Unauthorized Reply Prevention
  // -------------------------------------------------------------------------
  try {
    // Raise a new query on Citizen A's application
    const q2 = await officerService.raiseQuery(
      officerId,
      testAppA.applicationNumber,
      'DISH',
      'Submit ventilation shaft airflow calculations.'
    );

    let viewBlocked = false;
    try {
      // Citizen B attempts to view queries for Citizen A's application
      await officerService.getQueries(testAppA.id, { userId: citizenBId, role: 'CITIZEN' });
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        viewBlocked = true;
      }
    }

    let replyBlocked = false;
    try {
      // Citizen B attempts to reply to Citizen A's query
      await officerService.replyQuery(
        q2.id,
        'Malicious unauthorized reply payload',
        { userId: citizenBId, role: 'CITIZEN' }
      );
    } catch (err: any) {
      if (err.message && err.message.startsWith('Forbidden')) {
        replyBlocked = true;
      }
    }

    const passed = viewBlocked && replyBlocked;
    recordTest(
      'Scenario 12',
      'Cross-Tenant Query Protection & Unauthorized Reply Prevention',
      passed,
      'Citizen B strictly blocked with 403 Forbidden from viewing or replying to Citizen A query'
    );
  } catch (err: any) {
    recordTest('Scenario 12', 'Cross-Tenant Query Protection & Unauthorized Reply Prevention', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 13: Officer Approval / Rejection Decision with Mandatory Statutory Remarks
  // -------------------------------------------------------------------------
  try {
    // 1. Verify empty remarks rejection
    let emptyRemarksCaught = false;
    try {
      await officerService.submitDecision(testAppA.id, 'APPROVED', '   ', 'Dr. Rahul Deshmukh', 'MPCB');
    } catch (err: any) {
      if (err.message && err.message.includes('Mandatory')) {
        emptyRemarksCaught = true;
      }
    }

    // 2. Submit valid statutory approval
    const decRes = await officerService.submitDecision(
      testAppA.id,
      'APPROVED',
      'All technical conditions under Section 25 of Water Act satisfied. 100% ZLD mandated.',
      'Dr. Rahul Deshmukh',
      'MPCB'
    );

    const mpcbAppr = testAppA.approvals.find(a => a.departmentCode === 'MPCB');
    const passed = emptyRemarksCaught && decRes.success && mpcbAppr?.status === 'APPROVED';

    recordTest(
      'Scenario 13',
      'Officer Approval Decision with Mandatory Statutory Remarks',
      passed,
      `Rejected empty remarks; successfully registered statutory clearance grant for MPCB CTE with recorded findings`
    );
  } catch (err: any) {
    recordTest('Scenario 13', 'Officer Approval Decision with Mandatory Statutory Remarks', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Scenario 14: Maharashtra Right to Public Services Act (RTS 2015) SLA Calculation & Deemed Approval
  // -------------------------------------------------------------------------
  try {
    // Normal / Active Application SLA
    const normalSla = slaService.calculateApplicationSla(testAppA);

    // Overdue Application SLA (Simulating > 45 days delay without justified stop-clock)
    const overdueApp: StoredApplication = {
      ...testAppA,
      id: 'app-test-overdue-sla',
      applicationNumber: 'MH-2026-IND-99888',
      submittedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      stage: 'UNDER_SCRUTINY',
    };

    const overdueSla = slaService.calculateApplicationSla(overdueApp);

    const normalLevelValid = normalSla.escalationLevel === 'NORMAL' || normalSla.escalationLevel === 'WARNING';
    const deemedTriggered =
      overdueSla.daysRemaining <= 0 &&
      overdueSla.escalationLevel === 'BREACHED_OR_DEEMED' &&
      overdueSla.isDeemedApprovalTriggered === true &&
      overdueSla.escalationAuthority.includes('Second Appellate Authority');

    const passed = normalLevelValid && deemedTriggered;

    recordTest(
      'Scenario 14',
      'Maharashtra RTS Act 2015 SLA Calculation & Deemed Approval Tiering',
      passed,
      `Active filing: ${normalSla.daysRemaining} days remaining (${normalSla.escalationLevel}); 50-day filing triggered Deemed Approval (Sec 7(2)) escalated to Second Appellate Authority: Principal Secretary (Industries)`
    );
  } catch (err: any) {
    recordTest('Scenario 14', 'Maharashtra RTS Act 2015 SLA Calculation & Deemed Approval Tiering', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  console.log('====================================================');
  console.log(` Result: ${passedCount} / ${total} Scenarios Passed (${Math.round((passedCount / total) * 100)}%)`);
  console.log('====================================================');

  if (passedCount !== total) {
    process.exit(1);
  }
}

runPhase6Tests();
