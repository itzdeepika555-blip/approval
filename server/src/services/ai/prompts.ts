import { ApprovalExplanationRequest } from './types';

export const AI_STATUTORY_DISCLAIMER =
  'Potentially applicable based on the configured criteria under Maharashtra industrial regulations. This is an AI-assisted preliminary explanation; statutory applicability is determined by designated departmental authorities under the Maharashtra Right to Public Services Act 2015.';

export const DOCUMENT_VERIFICATION_DISCLAIMER =
  'Preliminary Automated Document Verification: Pre-submission analysis assistant only. Final verification is conducted by designated departmental scrutinizing officers.';

/**
 * Builds prompt for user-friendly approval explanation based strictly on structured facts
 */
export function buildApprovalExplanationPrompt(req: ApprovalExplanationRequest): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = `You are a specialized industrial compliance assistant for the Government of Maharashtra's Single Window Portal (Maitri / Industry Navigator).

CRITICAL SAFETY & FACTUAL INTEGRITY RULES:
1. You must ONLY explain the clearance based on the structured facts provided in the input.
2. DO NOT invent new departments, legal acts, timelines, penalty clauses, or fees not present in the input.
3. NEVER state that a government approval is officially or legally required with certainty. Always use cautious regulatory phrasing such as "Potentially applicable based on the provided criteria".
4. If essential profile data is missing, clearly mention what additional information is required.
5. Provide a clear, polite, and professional explanation in 2 to 3 sentences suitable for an entrepreneur.`;

  const userPrompt = `Generate a concise explanation for why the following approval is potentially applicable:

[ENTERPRISE PROFILE]
- Enterprise Name: ${req.businessProfile.businessName || 'Industrial Enterprise'}
- Sector: ${req.businessProfile.industrySector || 'Not Specified'}
- Activity: ${req.businessProfile.businessActivity || 'Not Specified'}
- District: ${req.businessProfile.district || 'Not Specified'}
- Location: ${req.businessProfile.isMidcArea ? `MIDC Industrial Area (${req.businessProfile.midcEstateName || 'Estate'})` : 'Private Land (Non-MIDC)'}
- Pollution Category: ${req.businessProfile.pollutionCategory || 'GREEN'}
- Workers: ${req.businessProfile.employeeCount ?? 'Not Specified'}
- Power Demand: ${req.businessProfile.powerRequirementKva ? `${req.businessProfile.powerRequirementKva} kVA` : 'Not Specified'}
- Steam Boiler: ${req.businessProfile.hasBoiler ? `Yes (${req.businessProfile.boilerCapacityTph || 1} TPH)` : 'No'}

[STATUTORY APPROVAL]
- Code: ${req.approval.approvalCode}
- Name: ${req.approval.name} (${req.approval.nameMarathi || ''})
- Department: ${req.approval.departmentName}
- Governing Act: ${req.approval.statutoryAct || 'Maharashtra Industrial Regulations'}
- RTS Statutory SLA: ${req.approval.statutoryTimelineDays || 30} Days

[MATCHED STATUTORY CONDITIONS]
${(req.matchingConditions || []).map(c => `- ${c.field} (${c.actualValue}) ${c.operator} ${JSON.stringify(c.expectedValue)}`).join('\n')}

Format your response as a JSON object with:
{
  "explanation": "Clear, user-friendly 2-3 sentence explanation",
  "matchedCriteriaHighlights": ["Bullet point 1", "Bullet point 2"]
}`;

  return { systemInstruction, userPrompt };
}

/**
 * Builds prompt for document verification and OCR field extraction
 */
export function buildDocumentAnalysisPrompt(
  extractedText: string,
  expectedDocCode: string,
  profileContext?: any
): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = `You are an automated document pre-verification engine for industrial clearances in Maharashtra.

RULES:
1. Examine the provided OCR text and classify the document.
2. Extract key fields: Document Number (PAN, GSTIN, Registration No), Issued Entity Name, Issue Date, Expiry Date.
3. Compare extracted fields against the expected applicant profile context.
4. Flag any anomalies (blurriness, missing statutory stamp, expired dates, name mismatches).
5. Never state "Officially Verified". Always output status as PRELIMINARY_VERIFIED, NEEDS_REVIEW, or REJECTED.`;

  const userPrompt = `Analyze the following extracted document text:

[EXPECTED DOCUMENT CODE]: ${expectedDocCode}
[APPLICANT CONTEXT]:
- Expected Entity Name: ${profileContext?.businessName || 'Applicant Enterprise'}
- Expected PAN: ${profileContext?.panNumber || 'Not Specified'}
- Expected GSTIN: ${profileContext?.gstin || 'Not Specified'}

[OCR EXTRACTED TEXT]:
${extractedText.substring(0, 3000)}

Respond in valid JSON format:
{
  "detectedDocumentType": "e.g. Permanent Account Number (PAN) Card",
  "confidenceScore": 85,
  "extractedFields": {
    "DocumentNumber": "...",
    "EntityName": "...",
    "IssueDate": "...",
    "ValidTill": "..."
  },
  "verificationStatus": "PRELIMINARY_VERIFIED" or "NEEDS_REVIEW" or "REJECTED",
  "checks": [
    {"checkName": "Document Type Match", "status": "PASS", "message": "..."},
    {"checkName": "Entity Name Cross-Check", "status": "PASS", "message": "..."},
    {"checkName": "Validity Period", "status": "PASS", "message": "..."}
  ],
  "reviewNotes": ["Note on any ambiguity or recommendation"]
}`;

  return { systemInstruction, userPrompt };
}
