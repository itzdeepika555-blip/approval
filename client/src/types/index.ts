export type UserRole = 'CITIZEN' | 'OFFICER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  departmentId?: string | null;
  designation?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type LegalEntityType =
  | 'PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'LLP'
  | 'PRIVATE_LIMITED'
  | 'PUBLIC_LIMITED'
  | 'OTHER';

export type PollutionCategory = 'RED' | 'ORANGE' | 'GREEN' | 'WHITE';

export interface BusinessProfileData {
  id?: string;
  businessName: string;
  businessType: LegalEntityType;
  industrySector: string;
  businessActivity: string;
  state: string; // "Maharashtra"
  district: string;
  taluka: string;
  location: string;
  isMidcArea: boolean;
  midcEstateName?: string;
  surveyPlotNumber?: string;
  investmentPlantMachinery: number;
  investmentLandBuilding: number;
  annualTurnover?: number;
  employeeCount: number;
  landAreaSqm: number;
  builtUpAreaSqm: number;
  productionCapacity: string;
  productionUnit: string;
  pollutionCategory: PollutionCategory;
  effluentDischargeKld: number;
  hazardousWasteGeneration: boolean;
  waterUsageKld: number;
  waterSource: string;
  powerRequirementKva: number;
  hasBoiler: boolean;
  boilerCapacityTph?: number;
  hasDgSet: boolean;
  dgSetCapacityKva?: number;
  gstRegistered: boolean;
  gstin?: string;
  msmeRegistered: boolean;
  udyamNumber?: string;
}

export type ApprovalStage = 'PRE_ESTABLISHMENT' | 'PRE_OPERATION' | 'OPERATIONAL';

export type ApprovalStatus =
  | 'NOT_STARTED'
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'QUERY_RAISED'
  | 'INSPECTION_PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface ApplicableApproval {
  id: string;
  approvalCode: string;
  name: string;
  nameMarathi?: string;
  departmentCode: string;
  departmentName: string;
  stage: ApprovalStage;
  category: 'NOC' | 'LICENCE' | 'REGISTRATION' | 'PERMISSION';
  statutoryAct: string;
  statutoryTimelineDays: number;
  reason: string;
  requiredDocuments: string[];
  expectedTimelineDays: number;
  validityMonths: number | null;
  renewalRequired: boolean;
  status: ApprovalStatus;
  feeEstimate?: string;
  officialPortalLink?: string;
  matchingCriteriaSummary?: string[];
}

export interface DocumentItem {
  id: string;
  code: string;
  title: string;
  category: string;
  isMandatory: boolean;
  uploaded: boolean;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  verificationStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'WARNING';
  expiryDate?: string;
  confidenceScore?: number;
  extractedData?: Record<string, string>;
  isWalletItem: boolean;
}

export interface DepartmentClearanceStatus {
  departmentCode: string;
  departmentName: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'QUERY_RAISED' | 'APPROVED' | 'REJECTED';
  officerAssigned?: string;
  slaDays: number;
  daysRemaining: number;
  updatedAt: string;
  notes?: string;
}

export interface ApplicationTimelineStep {
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  date?: string;
  slaInfo?: string;
}

export interface InspectionSlot {
  id: string;
  date: string;
  timeSlot: string;
  departments: string[];
  type: 'JOINT_COMMON_INSPECTION' | 'INDIVIDUAL';
  status: 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'AVAILABLE';
  leadOfficer?: string;
  address: string;
}

export interface SchemeItem {
  id: string;
  code: string;
  name: string;
  department: string;
  eligibleSectors: string[];
  eligibleDistricts: string[];
  subsidyPercentage?: number;
  benefits: string;
  requiredDocuments: string[];
  status: 'ELIGIBLE' | 'CHECK_REQUIRED' | 'APPLIED';
}

export interface ComplianceItem {
  id: string;
  title: string;
  approvalCode: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  nextDueDate: string;
  status: 'COMPLIANT' | 'UPCOMING' | 'OVERDUE';
  statutoryRule: string;
  reminderStatus: 'SENT' | 'PENDING';
}

export interface RenewalItem {
  id: string;
  approvalName: string;
  department: string;
  licenseNumber: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'VALID' | 'DUE_SOON' | 'OVERDUE' | 'RENEWAL_FILED';
}

export interface DepartmentQuery {
  id: string;
  applicationId: string;
  departmentCode: string;
  departmentName: string;
  officerName: string;
  queryText: string;
  createdAt: string;
  status: 'PENDING_CITIZEN_REPLY' | 'RESOLVED' | 'UNDER_REVIEW';
  citizenResponse?: string;
  citizenResponseDate?: string;
  attachmentName?: string;
}

export interface OfficerApplication {
  id: string;
  applicationNumber: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  industrySector: string;
  district: string;
  pollutionCategory: PollutionCategory;
  appliedDate: string;
  rtsDeadline: string;
  rtsDaysRemaining: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'QUERY_RAISED' | 'APPROVED' | 'REJECTED';
  assignedDepartment: string;
  clearanceName: string;
  investmentAmountCr: number;
  employeeCount: number;
  documentsCount: number;
  queriesCount: number;
  inspectionRequired: boolean;
  inspectionStatus?: 'NOT_SCHEDULED' | 'SCHEDULED' | 'COMPLETED';
}

export interface ApplicationSubmission {
  id: string;
  applicationNumber: string;
  submittedAt: string;
  businessProfile: BusinessProfileData;
  approvals: ApplicableApproval[];
  documents: DocumentItem[];
  overallStatus: 'SUBMITTED' | 'UNDER_REVIEW' | 'QUERY_RAISED' | 'APPROVED' | 'REJECTED';
  rtsMaxDays: number;
  rtsDaysElapsed: number;
  rtsDaysRemaining: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  link?: string;
}

export interface AppealItem {
  id: string;
  appealNumber: string;
  applicationId: string;
  applicationNumber: string;
  businessName: string;
  citizenName: string;
  citizenContact: string;
  departmentCode: string;
  departmentName: string;
  appellateAuthority: 'FIRST_APPELLATE' | 'SECOND_APPELLATE';
  appellateAuthorityTitle: string;
  groundForAppeal: 'SLA_BREACH' | 'REJECTION_WITHOUT_REASON' | 'UNREASONABLE_QUERY' | 'CORRUPTION_HARASSMENT' | 'OTHER';
  applicantStatement: string;
  status: 'PENDING' | 'HEARING_SCHEDULED' | 'UPHELD' | 'DIRECTED_CLEARANCE' | 'DISMISSED';
  officerRemarks?: string;
  hearingDate?: string;
  orderDocumentUrl?: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface DepartmentAnalyticsMetric {
  departmentCode: string;
  departmentName: string;
  totalApplications: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  deemedApprovalsTriggered: number;
  slaComplianceRate: number;
  averageProcessingDays: number;
  activeQueriesCount: number;
}

export interface StateAnalyticsData {
  stateSummary: {
    totalApplicationsReceived: number;
    totalIndustrialInvestmentCr: number;
    totalEmploymentGenerated: number;
    overallSlaCompliancePercentage: number;
    totalStatutoryClearancesIssued: number;
    activeEscalationsCount: number;
    totalAppealsFiled: number;
    resolvedAppealsCount: number;
  };
  departmentRankings: DepartmentAnalyticsMetric[];
  districtHeatmap: {
    district: string;
    applicationsCount: number;
    investmentAmountCr: number;
    complianceScore: number;
  }[];
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  userRole?: string;
  action: string;
  entityName: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AdminRuleItem {
  id: string;
  approvalCode: string;
  ruleCode: string;
  ruleName: string;
  priority: number;
  conditionsJson: any;
  explanationTpl: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  isActive: boolean;
  departmentId?: string | null;
  designation?: string | null;
  createdAt: string;
}

