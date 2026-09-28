/**
 * SIH26130 - AI Service Types
 * 
 * Defines request and response types for AI-assisted statutory explanations,
 * document analysis, and verification checks.
 */

export interface ConditionSummary {
  field: string;
  operator: string;
  expectedValue: any;
  actualValue: any;
  passed: boolean;
}

export interface ApprovalExplanationRequest {
  businessProfile: {
    businessName?: string;
    industrySector?: string;
    businessActivity?: string;
    district?: string;
    taluka?: string;
    isMidcArea?: boolean;
    midcEstateName?: string;
    pollutionCategory?: string;
    employeeCount?: number;
    powerRequirementKva?: number;
    waterRequirementKld?: number;
    waterSource?: string;
    hasBoiler?: boolean;
    boilerCapacityTph?: number;
    hasDgSet?: boolean;
    investmentPlantMachinery?: number;
    [key: string]: any;
  };
  approval: {
    approvalCode: string;
    name: string;
    nameMarathi?: string;
    departmentCode: string;
    departmentName: string;
    stage?: string;
    category?: string;
    statutoryAct?: string;
    statutoryTimelineDays?: number;
    requiredDocuments?: string[];
    feeStructureDetails?: string;
    [key: string]: any;
  };
  matchingConditions?: ConditionSummary[];
}

export interface ApprovalExplanationResponse {
  approvalCode: string;
  approvalName: string;
  departmentName: string;
  explanation: string;
  statutoryBasis: string;
  matchedCriteriaHighlights: string[];
  provider: 'gemini' | 'rule_fallback';
  isPreliminary: boolean;
  disclaimer: string;
}

export type DocumentVerificationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PRELIMINARY_VERIFIED'
  | 'NEEDS_REVIEW'
  | 'REJECTED';

export interface VerificationCheckItem {
  checkName: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
}

export interface DocumentAnalysisResult {
  detectedDocumentType: string;
  documentTypeCode: string;
  confidenceScore: number;
  extractedFields: Record<string, string>;
  verificationStatus: DocumentVerificationStatus;
  checks: VerificationCheckItem[];
  missingElements: string[];
  reviewNotes: string[];
  disclaimer: string;
}
