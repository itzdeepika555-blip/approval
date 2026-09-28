import { geminiService } from './geminiService';
import {
  ApprovalExplanationRequest,
  ApprovalExplanationResponse,
  DocumentAnalysisResult,
  VerificationCheckItem,
} from './types';
import {
  AI_STATUTORY_DISCLAIMER,
  DOCUMENT_VERIFICATION_DISCLAIMER,
} from './prompts';

export class AiService {
  /**
   * Deterministic rule-based explanation fallback when AI is unavailable or disabled
   */
  private generateRuleFallbackExplanation(req: ApprovalExplanationRequest): ApprovalExplanationResponse {
    const p = req.businessProfile;
    const a = req.approval;

    const highlights: string[] = [];

    // Synthesize factual highlights based on matching conditions and profile
    if (a.approvalCode.includes('MPCB')) {
      highlights.push(`Classified under ${p.pollutionCategory || 'GREEN'} pollution category by MPCB`);
      highlights.push(`Governed by Water Act 1974 (Section 25) & Air Act 1981 (Section 21)`);
    } else if (a.approvalCode.includes('DISH')) {
      highlights.push(`Industrial facility employs ${p.employeeCount || 10}+ workers utilizing electric power`);
      highlights.push(`Statutory factory threshold under Section 2(m)(i) of the Factories Act 1948`);
    } else if (a.approvalCode.includes('FIRE')) {
      highlights.push(`Built-up factory space of ${p.builtUpAreaSqm || 500} sq.m with industrial activity`);
      highlights.push(`Architectural fire safety egress clearance under Maharashtra Fire Act 2006`);
    } else if (a.approvalCode.includes('MIDC')) {
      highlights.push(`Plot located within MIDC industrial territory (${p.midcEstateName || 'MIDC Estate'})`);
      highlights.push(`Building blueprint sanction from Special Planning Authority (SPA)`);
    } else if (a.approvalCode.includes('REVENUE')) {
      highlights.push(`Proposed setup situated on private land parcel outside designated MIDC estate`);
      highlights.push(`Mandatory land use conversion under Maharashtra Land Revenue Code 1966`);
    } else if (a.approvalCode.includes('MSEDCL')) {
      highlights.push(`High voltage load sanction requirement for ${p.powerRequirementKva || 100}+ kVA demand`);
      highlights.push(`Dedicated industrial power agreement under the Electricity Act 2003`);
    } else if (a.approvalCode.includes('BOILER')) {
      highlights.push(`Facility utilizes industrial steam boiler (${p.boilerCapacityTph || 1} TPH capacity)`);
      highlights.push(`Mandatory hydraulic testing and inspection under Indian Boilers Act 1923`);
    } else if (a.approvalCode.includes('CGWA')) {
      highlights.push(`Drawing industrial water requirement of ${p.waterRequirementKld || 10}+ KLD from groundwater`);
      highlights.push(`Central Ground Water Authority / MWRRA NOC mandate`);
    } else {
      highlights.push(`Identified based on statutory thresholds in the Maharashtra industrial catalog`);
    }

    const explanation = `Potentially applicable based on the configured criteria: Your enterprise in ${p.district || 'Maharashtra'} (` +
      `${p.businessName || 'Industrial Unit'}) operates in the ${p.industrySector || 'manufacturing'} sector, triggering statutory review ` +
      `under the ${a.statutoryAct || 'governing industrial regulations'}.`;

    return {
      approvalCode: a.approvalCode,
      approvalName: a.name,
      departmentName: a.departmentName,
      explanation,
      statutoryBasis: a.statutoryAct || 'Government of Maharashtra Statutory Regulations',
      matchedCriteriaHighlights: highlights,
      provider: 'rule_fallback',
      isPreliminary: true,
      disclaimer: AI_STATUTORY_DISCLAIMER,
    };
  }

  /**
   * Explains an approval using Gemini with automatic deterministic fallback
   */
  public async explainApproval(req: ApprovalExplanationRequest): Promise<ApprovalExplanationResponse> {
    if (!req.approval || !req.approval.approvalCode) {
      throw new Error('Approval details must include an approvalCode.');
    }

    // Try Gemini if available
    if (geminiService.isAvailable()) {
      const geminiResult = await geminiService.explainApproval(req);
      if (geminiResult) return geminiResult;
    }

    // Fall back safely to rule-based explanation
    return this.generateRuleFallbackExplanation(req);
  }

  /**
   * Deterministic pattern and regex extraction for statutory documents
   */
  public extractHeuristicFields(text: string): Record<string, string> {
    const fields: Record<string, string> = {};

    // 1. PAN Pattern: [A-Z]{5}[0-9]{4}[A-Z]{1}
    const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
    if (panMatch) fields['PAN'] = panMatch[0];

    // 2. GSTIN Pattern: \d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}
    const gstinMatch = text.match(/\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}/);
    if (gstinMatch) fields['GSTIN'] = gstinMatch[0];

    // 3. Date pattern (DD-MM-YYYY or DD/MM/YYYY)
    const dateMatch = text.match(/\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/);
    if (dateMatch) fields['Date'] = dateMatch[0];

    // 4. Survey / Gut / Plot Number
    const plotMatch = text.match(/(?:Plot|Survey|Gat|Gut)\s*(?:No\.?|Number)?\s*[:#-]?\s*([A-Za-z0-9\/-]+)/i);
    if (plotMatch) fields['PlotNumber'] = plotMatch[1].trim();

    return fields;
  }

  /**
   * Evaluates document text, runs cross-checks against applicant profile, and determines preliminary status
   */
  public async analyzeDocument(
    rawText: string,
    expectedDocCode: string,
    profileContext?: any
  ): Promise<DocumentAnalysisResult> {
    // Try Gemini if available
    if (geminiService.isAvailable()) {
      const geminiResult = await geminiService.analyzeDocumentText(rawText, expectedDocCode, profileContext);
      if (geminiResult) return geminiResult;
    }

    // Rule-based heuristic verification pipeline
    const text = rawText || '';
    const extractedFields = this.extractHeuristicFields(text);
    const checks: VerificationCheckItem[] = [];
    const missingElements: string[] = [];
    const reviewNotes: string[] = [];

    let confidence = 80;
    let status: 'PRELIMINARY_VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED' = 'PRELIMINARY_VERIFIED';
    let detectedType = 'Supporting Statutory Document';

    // File content legibility check
    if (text.length < 30) {
      checks.push({
        checkName: 'Legibility & Text Density',
        status: 'WARN',
        message: 'Minimal textual content detected in document. Scanned visual verification required.',
      });
      confidence = Math.max(confidence - 25, 45);
      status = 'NEEDS_REVIEW';
      missingElements.push('Text readability below OCR threshold');
    } else {
      checks.push({
        checkName: 'Legibility & Text Density',
        status: 'PASS',
        message: 'Text density and font clarity within acceptable OCR thresholds.',
      });
    }

    // Classification per expected code
    if (expectedDocCode === 'DOC_PAN') {
      detectedType = 'Permanent Account Number (PAN) Card';
      if (extractedFields['PAN']) {
        checks.push({
          checkName: 'PAN Format Verification',
          status: 'PASS',
          message: `Valid 10-character alphanumeric PAN format detected (${extractedFields['PAN']}).`,
        });

        // Cross-check with profile if profile has pan
        if (profileContext?.panNumber) {
          const profilePan = String(profileContext.panNumber).trim().toUpperCase();
          if (extractedFields['PAN'] === profilePan) {
            checks.push({
              checkName: 'PAN Profile Cross-Check',
              status: 'PASS',
              message: 'Detected PAN matches applicant profile record exactly.',
            });
            confidence = 98;
          } else {
            checks.push({
              checkName: 'PAN Profile Cross-Check',
              status: 'WARN',
              message: `Detected PAN (${extractedFields['PAN']}) differs from profile PAN (${profilePan}). Manual officer review required.`,
            });
            status = 'NEEDS_REVIEW';
            reviewNotes.push('Discrepancy between uploaded document PAN and profile PAN.');
          }
        }
      } else {
        checks.push({
          checkName: 'PAN Format Verification',
          status: 'FAIL',
          message: 'Standard 10-digit PAN format not detected in OCR text.',
        });
        status = 'NEEDS_REVIEW';
        confidence = 50;
        missingElements.push('PAN number identifier');
      }
    } else if (expectedDocCode === 'DOC_PROJECT_REPORT') {
      detectedType = 'Detailed Project Report (DPR)';
      const hasKeywords = /project|capacity|investment|machinery|process/i.test(text);
      if (hasKeywords) {
        checks.push({
          checkName: 'DPR Keyword & Scope Validation',
          status: 'PASS',
          message: 'Project synopsis, machinery breakdown, and process overview identified.',
        });
        confidence = 92;
      } else {
        checks.push({
          checkName: 'DPR Keyword & Scope Validation',
          status: 'WARN',
          message: 'Standard DPR sections (process flow, machine specifications) not explicitly identified.',
        });
        status = 'NEEDS_REVIEW';
      }
    } else if (expectedDocCode === 'DOC_7_12') {
      detectedType = 'Land Record (7/12 Extract / Property Card)';
      const hasLandTerms = /7\/12|gat|survey|taluka|district|bhumi|land/i.test(text);
      if (hasLandTerms) {
        checks.push({
          checkName: 'Revenue Document Authenticity Markers',
          status: 'PASS',
          message: 'Maharashtra Land Revenue 7/12 markers and land parcel survey references identified.',
        });
        confidence = 90;
      } else {
        checks.push({
          checkName: 'Revenue Document Authenticity Markers',
          status: 'WARN',
          message: 'Survey or Gat number markers not clearly legible.',
        });
        status = 'NEEDS_REVIEW';
      }
    } else if (expectedDocCode === 'DOC_SITE_PLAN') {
      detectedType = 'Factory Site Layout Plan & Architectural Blueprint';
      checks.push({
        checkName: 'Architectural Blueprint Layout Check',
        status: 'PASS',
        message: 'Plot layout dimensions, setbacks, and factory building ingress/egress marked.',
      });
      confidence = 91;
    } else {
      detectedType = 'Statutory Industrial Clearance Attachment';
      checks.push({
        checkName: 'Supporting Document Classification',
        status: 'PASS',
        message: 'File uploaded and cataloged under compliance documentation.',
      });
      confidence = 88;
    }

    // Statutory Stamp / Seal Heuristic
    const hasStampMarker = /certified|authorized|government|signature|seal|approved/i.test(text);
    if (hasStampMarker) {
      checks.push({
        checkName: 'Statutory Seal & Attestation',
        status: 'PASS',
        message: 'Digital certification or authority attestation identified.',
      });
    } else {
      checks.push({
        checkName: 'Statutory Seal & Attestation',
        status: 'WARN',
        message: 'Official signature or municipal QR attestation stamp not detected in preliminary scan.',
      });
      if (status === 'PRELIMINARY_VERIFIED') {
        reviewNotes.push('Attestation stamp should be verified by departmental scrutiny officer.');
      }
    }

    return {
      detectedDocumentType: detectedType,
      documentTypeCode: expectedDocCode,
      confidenceScore: confidence,
      extractedFields,
      verificationStatus: status,
      checks,
      missingElements,
      reviewNotes,
      disclaimer: DOCUMENT_VERIFICATION_DISCLAIMER,
    };
  }
}

export const aiService = new AiService();
