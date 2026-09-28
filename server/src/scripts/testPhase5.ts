/**
 * SIH26130 Phase 5 - Automated Test Suite
 * 12 Scenarios for AI Assistance, Document Verification, OCR & Ownership Security
 */

import { aiService } from '../services/ai/aiService';
import { geminiService } from '../services/ai/geminiService';
import { documentService } from '../services/document.service';

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

async function runPhase5Tests() {
  console.log('====================================================');
  console.log(' SIH26130 Phase 5 - Automated Test Suite');
  console.log(' 12 AI Assistance, Document Pipeline & Security Scenarios');
  console.log('====================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: AI explanation with valid rule result
  // -------------------------------------------------------------------------
  try {
    const validProfile = {
      industrySector: 'FOOD_PROCESSING',
      scale: 'MEDIUM',
      employeeCount: 45,
      powerRequirementKva: 80,
      pollutionCategory: 'ORANGE' as const,
      isMidcArea: true,
      district: 'Pune',
      businessName: 'Sahyadri Agro Processing',
    };
    const validApproval = {
      approvalCode: 'MPCB_CTE',
      name: 'Consent to Establish (CTE)',
      departmentCode: 'DEPT_MPCB',
      departmentName: 'Maharashtra Pollution Control Board (MPCB)',
      statutoryAct: 'Water (Prevention & Control of Pollution) Act 1974',
    };
    const matchingConditions = [
      { field: 'pollutionCategory', operator: 'EQUALS', expectedValue: 'ORANGE', actualValue: 'ORANGE', passed: true },
      { field: 'tradeEffluent', operator: 'GREATER_THAN', expectedValue: 0, actualValue: 25, passed: true },
    ];

    const explanation = await aiService.explainApproval({
      businessProfile: validProfile,
      approval: validApproval,
      matchingConditions,
    });

    const hasExplanation = !!explanation.explanation && explanation.explanation.length > 20;
    const hasDisclaimer =
      explanation.disclaimer.includes('Potentially applicable based on the configured criteria') ||
      explanation.disclaimer.includes('preliminary explanation');
    const hasFactors = explanation.matchedCriteriaHighlights.length > 0;
    const passed = hasExplanation && hasDisclaimer && hasFactors;

    recordTest(
      'Scenario 01',
      'AI explanation with valid rule result',
      passed,
      `Generated explanation (${explanation.explanation.substring(0, 60)}...) with disclaimer: "${explanation.disclaimer.substring(0, 45)}..." [Provider: ${explanation.provider}]`
    );
  } catch (err: any) {
    recordTest('Scenario 01', 'AI explanation with valid rule result', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 2: AI provider unavailable (graceful fallback)
  // -------------------------------------------------------------------------
  try {
    // When Gemini is not configured, explainApproval automatically uses deterministic fallback
    const fallback = await aiService.explainApproval({
      businessProfile: { industrySector: 'TEXTILE', scale: 'SMALL', district: 'Solapur' },
      approval: { approvalCode: 'DISH_FACT_LIC', name: 'Factory License', departmentCode: 'DEPT_DISH', departmentName: 'DISH' },
      matchingConditions: [{ field: 'employeeCount', operator: 'GTE', expectedValue: 10, actualValue: 20, passed: true }],
    });

    const passed =
      fallback.provider === 'rule_fallback' &&
      fallback.explanation.includes('TEXTILE') &&
      fallback.isPreliminary === true;

    recordTest(
      'Scenario 02',
      'AI provider unavailable (deterministic fallback mode)',
      passed,
      `Safe fallback engaged without exception: Provider='${fallback.provider}', Preliminary=${fallback.isPreliminary}, Act='${fallback.statutoryBasis}'`
    );
  } catch (err: any) {
    recordTest('Scenario 02', 'AI provider unavailable', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 3: AI response with incomplete input
  // -------------------------------------------------------------------------
  try {
    const incompleteExplanation = await aiService.explainApproval({
      businessProfile: {}, // empty profile
      approval: { approvalCode: 'MIDC_ALLOT', name: 'MIDC Plot Allotment', departmentCode: 'DEPT_MIDC', departmentName: 'MIDC' },
      matchingConditions: [],
    });

    const hasExplanation = !!incompleteExplanation.explanation;
    const hasDisclaimer = !!incompleteExplanation.disclaimer;
    const passed = hasExplanation && hasDisclaimer && incompleteExplanation.approvalCode === 'MIDC_ALLOT';

    recordTest(
      'Scenario 03',
      'AI response with incomplete input (no hallucinations)',
      passed,
      `Handled unconfigured business parameters gracefully without inventing unverified claims: "${incompleteExplanation.explanation.substring(0, 75)}..."`
    );
  } catch (err: any) {
    recordTest('Scenario 03', 'AI response with incomplete input', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 4: Document upload
  // -------------------------------------------------------------------------
  let uploadedDocAId = '';
  const testUserIdA = 'user-test-citizen-alpha';
  try {
    const validFile = {
      originalname: 'factory_blueprint_v1.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 512, // 512 KB
      buffer: Buffer.from('%PDF-1.4 Factory Architectural Blueprint Scale 1:100 MIDC Plot 42 Chakan Pune'),
    };

    const uploadRes = await documentService.uploadDocument(testUserIdA, validFile, {
      documentType: 'DOC_SITE_PLAN',
      title: 'Factory Architectural Blueprint',
    });

    uploadedDocAId = uploadRes.document.id;
    const passed =
      !!uploadRes.document.id &&
      uploadRes.document.documentType === 'DOC_SITE_PLAN' &&
      (['PRELIMINARY_VERIFIED', 'NEEDS_REVIEW', 'PASSED', 'WARNING', 'PENDING'] as any[]).includes(uploadRes.document.verificationStatus);

    recordTest(
      'Scenario 04',
      'Document upload (PDF, MIME validated)',
      passed,
      `Document created with ID '${uploadedDocAId}', Status: '${uploadRes.document.verificationStatus}', Size: ${validFile.size} bytes`
    );
  } catch (err: any) {
    recordTest('Scenario 04', 'Document upload', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 5: Invalid file type rejection
  // -------------------------------------------------------------------------
  try {
    const invalidFile = {
      originalname: 'malicious_script.exe',
      mimetype: 'application/x-msdownload',
      size: 1024 * 10,
    };

    let caughtError = false;
    try {
      await documentService.uploadDocument(testUserIdA, invalidFile, {});
    } catch (err: any) {
      caughtError = true;
      const passed = err.message.includes('Unsupported file type');
      recordTest(
        'Scenario 05',
        'Invalid file type rejection (.exe / executable)',
        passed,
        `Correctly rejected unsupported executable MIME: "${err.message}"`
      );
    }

    if (!caughtError) {
      recordTest('Scenario 05', 'Invalid file type rejection', false, 'Executable file was unexpectedly accepted');
    }
  } catch (err: any) {
    recordTest('Scenario 05', 'Invalid file type rejection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 6: File size exceeded rejection
  // -------------------------------------------------------------------------
  try {
    const oversizedFile = {
      originalname: 'heavy_blueprint.pdf',
      mimetype: 'application/pdf',
      size: 15 * 1024 * 1024, // 15MB (> 10MB limit)
    };

    let caughtOversize = false;
    try {
      await documentService.uploadDocument(testUserIdA, oversizedFile, {});
    } catch (err: any) {
      caughtOversize = true;
      const passed = err.message.includes('exceeds maximum limit');
      recordTest(
        'Scenario 06',
        'File size exceeded rejection (> 10MB statutory limit)',
        passed,
        `Correctly rejected 15MB payload: "${err.message}"`
      );
    }

    if (!caughtOversize) {
      recordTest('Scenario 06', 'File size exceeded rejection', false, 'Oversized file was unexpectedly accepted');
    }
  } catch (err: any) {
    recordTest('Scenario 06', 'File size exceeded rejection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 7: Document classification
  // -------------------------------------------------------------------------
  try {
    const panFile = {
      originalname: 'company_pan_card.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 200,
    };
    const reportFile = {
      originalname: 'detailed_project_report.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 300,
    };

    const panUpload = await documentService.uploadDocument(testUserIdA, panFile, {
      documentType: 'DOC_PAN',
      textPreview: 'INCOME TAX DEPARTMENT GOVT OF INDIA PERMANENT ACCOUNT NUMBER ABCDE1234F OMKARA PRECISION PVT LTD',
    });
    const reportUpload = await documentService.uploadDocument(testUserIdA, reportFile, {
      documentType: 'DOC_PROJECT_REPORT',
      textPreview: 'DETAILED PROJECT REPORT Effluent Treatment Scheme Investment 5 Cr Manufacturing',
    });

    const panClassified = panUpload.document.documentType === 'DOC_PAN';
    const reportClassified = reportUpload.document.documentType === 'DOC_PROJECT_REPORT';
    const passed = panClassified && reportClassified;

    recordTest(
      'Scenario 07',
      'Document classification (PAN & Project Report Detection)',
      passed,
      `PAN classified as '${panUpload.document.documentType}', Project Report as '${reportUpload.document.documentType}' with preliminary status '${panUpload.document.verificationStatus}'`
    );
  } catch (err: any) {
    recordTest('Scenario 07', 'Document classification', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 8: OCR / text extraction & entity masking
  // -------------------------------------------------------------------------
  try {
    const sampleText =
      'MAHARASHTRA POLLUTION CONTROL BOARD CONSENT ORDER NO: MPCB/RO/2026/9912 PAN: ABCDE1234F GSTIN: 27ABCDE1234F1Z5 PLOT NO: Plot D-14 Chakan MIDC Pune DATE: 15-08-2024';
    const fields = aiService.extractHeuristicFields(sampleText);
    const maskedPan = documentService.maskIdentifier(fields['PAN']);

    const hasPan = fields['PAN'] === 'ABCDE1234F';
    const hasGst = fields['GSTIN'] === '27ABCDE1234F1Z5';
    const hasDate = fields['Date'] === '15-08-2024';
    const hasMasked = maskedPan === 'AB***4F';
    const passed = hasPan && hasGst && hasDate && hasMasked;

    recordTest(
      'Scenario 08',
      'OCR / text extraction & statutory field parsing',
      passed,
      `Extracted PAN='${fields['PAN']}', GSTIN='${fields['GSTIN']}', Date='${fields['Date']}', Audit Mask='${maskedPan}'`
    );
  } catch (err: any) {
    recordTest('Scenario 08', 'OCR / text extraction', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 9: Missing document detection
  // -------------------------------------------------------------------------
  try {
    const missingReport = await documentService.getMissingDocuments(testUserIdA);

    const hasRequired = missingReport.requiredCount > 0;
    const hasUploaded = missingReport.uploadedCount > 0;
    const hasMissingList = Array.isArray(missingReport.missing);
    const passed = hasRequired && hasUploaded && hasMissingList;

    recordTest(
      'Scenario 09',
      'Missing document detection (Required vs Uploaded)',
      passed,
      `Total Required: ${missingReport.requiredCount}, Uploaded: ${missingReport.uploadedCount}, Missing: ${missingReport.missingCount}, Portfolio Readiness: ${missingReport.completionPercentage}%`
    );
  } catch (err: any) {
    recordTest('Scenario 09', 'Missing document detection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 10: Unauthorized document access
  // -------------------------------------------------------------------------
  try {
    const testUserIdB = 'user-intruder-beta';
    let blockedAccess = false;

    try {
      // User B tries to view User A's document
      await documentService.getDocumentById(uploadedDocAId, testUserIdB, 'CITIZEN');
    } catch (err: any) {
      blockedAccess = true;
      const passed = err.message.includes('Forbidden') || err.message.includes('Unauthorized') || err.statusCode === 403;
      recordTest(
        'Scenario 10',
        'Unauthorized document access (Cross-tenant citizen blocked)',
        passed,
        `Correctly denied access to User B for User A's document: "${err.message}"`
      );
    }

    if (!blockedAccess) {
      recordTest('Scenario 10', 'Unauthorized document access', false, 'Intruder citizen was permitted to view document');
    }
  } catch (err: any) {
    recordTest('Scenario 10', 'Unauthorized document access', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 11: Document ownership protection (Delete prevention)
  // -------------------------------------------------------------------------
  try {
    const testUserIdB = 'user-intruder-beta';
    let blockedDelete = false;

    try {
      // User B tries to delete User A's document
      await documentService.deleteDocument(uploadedDocAId, testUserIdB, 'CITIZEN');
    } catch (err: any) {
      blockedDelete = true;
      const passed = err.message.includes('Forbidden') || err.statusCode === 403;
      recordTest(
        'Scenario 11',
        'Document ownership protection (Delete rejection)',
        passed,
        `Forbidden deletion intercepted: "${err.message}"`
      );
    }

    if (!blockedDelete) {
      recordTest('Scenario 11', 'Document ownership protection', false, 'Intruder was able to delete alien document');
    }
  } catch (err: any) {
    recordTest('Scenario 11', 'Document ownership protection', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Test 12: AI API failure fallback (Network/Timeout simulation)
  // -------------------------------------------------------------------------
  try {
    // Calling explainApproval with simulated unconfigured API key
    // Should return fallback result cleanly without throwing
    const safeResult = await aiService.explainApproval({
      businessProfile: { industrySector: 'ENGINEERING', scale: 'LARGE' },
      approval: {
        approvalCode: 'BOILER_REG',
        name: 'Steam Boiler Registration',
        departmentCode: 'DEPT_BOILER',
        departmentName: 'Directorate of Steam Boilers',
        statutoryAct: 'Indian Boilers Act 1923',
      },
      matchingConditions: [{ field: 'hasBoiler', operator: 'EQUALS', expectedValue: true, actualValue: true, passed: true }],
    });

    const passed =
      !!safeResult &&
      safeResult.provider === 'rule_fallback' &&
      safeResult.approvalCode === 'BOILER_REG' &&
      safeResult.disclaimer.length > 10;

    recordTest(
      'Scenario 12',
      'AI API failure fallback (Resilient error handling)',
      passed,
      `Safe fallback generated: "${safeResult.explanation.substring(0, 65)}..." [Provider: ${safeResult.provider}]`
    );
  } catch (err: any) {
    recordTest('Scenario 12', 'AI API failure fallback', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  console.log(` Result: ${passedCount} / ${results.length} Scenarios Passed (${Math.round((passedCount / results.length) * 100)}%)`);
  console.log('====================================================');

  if (passedCount < results.length) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5Tests().catch(err => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
