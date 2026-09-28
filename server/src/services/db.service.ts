import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Master data structures
export interface MasterDepartment {
  id: string;
  code: string;
  name: string;
  nameMarathi?: string;
  description?: string;
  portalUrl?: string;
  nodalOfficerEmail?: string;
  slaWorkingDays: number;
  isActive: boolean;
}

export interface MasterApproval {
  id: string;
  departmentId: string;
  departmentCode: string;
  approvalCode: string;
  name: string;
  nameMarathi?: string;
  stage: 'PRE_ESTABLISHMENT' | 'PRE_OPERATION' | 'OPERATIONAL';
  category: string;
  description: string;
  statutoryAct: string;
  statutoryTimelineDays: number;
  validityPeriodMonths?: number;
  renewalRequired: boolean;
  requiredDocCodes: string[];
  feeStructureDetails?: string;
  externalPortalLink?: string;
  isActive: boolean;
}

export interface MasterRule {
  id: string;
  approvalCode: string;
  ruleCode: string;
  ruleName: string;
  priority: number;
  conditionsJson: any;
  explanationTpl: string;
}

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  isActive: boolean;
  departmentId?: string | null;
  designation?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredBusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  legalEntityType: string;
  industrySector: string;
  nicCode?: string;
  businessActivity: string;
  district: string;
  taluka: string;
  pinCode: string;
  isMidcArea: boolean;
  midcEstateName?: string;
  surveyPlotNumber?: string;
  landAreaSqm: number;
  builtUpAreaSqm: number;
  investmentPlantMachinery: number;
  investmentLandBuilding: number;
  annualTurnover?: number;
  employeeCount: number;
  femaleEmployeeCount?: number;
  productionCapacity?: string;
  productionUnit?: string;
  powerRequirementKva: number;
  waterRequirementKld: number;
  waterSource?: string;
  pollutionCategory: 'RED' | 'ORANGE' | 'GREEN' | 'WHITE' | 'NOT_APPLICABLE';
  effluentDischargeKld?: number;
  hazardousWasteGeneration?: boolean;
  hasBoiler?: boolean;
  boilerCapacityTph?: number;
  hasDgSet?: boolean;
  dgSetCapacityKva?: number;
  gstRegistered?: boolean;
  gstin?: string;
  msmeRegistered?: boolean;
  udyamNumber?: string;
  panNumber?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredApplicationApproval {
  id: string;
  applicationId: string;
  approvalId: string;
  approvalCode: string;
  approvalName: string;
  departmentCode: string;
  status: 'NOT_STARTED' | 'APPLIED' | 'IN_PROGRESS' | 'QUERY_RAISED' | 'INSPECTION_PENDING' | 'APPROVED' | 'REJECTED';
  statutorySlaDays: number;
  targetCompletionDate?: Date;
  approvedAt?: Date;
  rejectionReason?: string;
  remarks?: string;
  appliedDate?: Date;
}

export interface StoredApplication {
  id: string;
  userId: string;
  businessProfileId: string;
  applicationNumber: string;
  stage: 'DRAFT' | 'SUBMITTED' | 'UNDER_SCRUTINY' | 'INSPECTION_SCHEDULED' | 'APPROVED' | 'REJECTED';
  overallProgress: number;
  projectStage: 'PRE_ESTABLISHMENT' | 'PRE_OPERATION' | 'OPERATIONAL';
  totalApprovalsCount: number;
  approvedCount: number;
  rejectedCount: number;
  queryPendingCount: number;
  submittedAt?: Date;
  targetCompletionDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  approvals: StoredApplicationApproval[];
}

export interface StoredDocument {
  id: string;
  userId: string;
  applicationId?: string;
  documentType: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  verificationStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'WARNING';
  ocrExtractedData?: any;
  confidenceScore?: number;
  uploadedAt: Date;
}

export interface StoredInspection {
  id: string;
  applicationId: string;
  inspectionType: 'JOINT_COMMON_INSPECTION' | 'INDIVIDUAL';
  status: 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';
  scheduledDate: string;
  timeSlot: string;
  location: string;
  participatingDepartments: string[];
  leadOfficerName?: string;
  notes?: string;
  createdAt: Date;
}

export interface StoredScheme {
  id: string;
  code: string;
  name: string;
  nameMarathi?: string;
  category: string;
  departmentCode: string;
  subsidyPercentage?: number;
  maxBenefitAmountInr?: number;
  description: string;
  eligibilitySummary: string;
  portalUrl?: string;
}

export interface StoredCompliance {
  id: string;
  userId: string;
  businessProfileId: string;
  title: string;
  statutoryAct: string;
  approvalCode?: string;
  frequency: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLIANT' | 'OVERDUE';
  penaltyClause?: string;
  submissionPortal?: string;
  submissionDocUrl?: string;
  lastSubmittedAt?: Date;
  lastSubmissionRemarks?: string;
  reminderStatus?: 'PENDING' | 'SENT';
  lastRemindedAt?: Date;
}

export interface StoredRenewal {
  id: string;
  userId: string;
  businessProfileId: string;
  licenceName: string;
  licenceNumber: string;
  issuingDepartment: string;
  approvalCode?: string;
  validUntil: string;
  status: 'VALID' | 'DUE_SOON' | 'OVERDUE' | 'RENEWAL_FILED';
  renewalFeeInr?: number;
  renewalPeriodYears?: number;
  paymentReference?: string;
  applicantRemarks?: string;
  filedAt?: Date;
  approvedAt?: Date;
  endorsementNumber?: string;
  officerRemarks?: string;
  lastRemindedAt?: Date;
}

export interface StoredNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'STATUS_UPDATE' | 'QUERY' | 'SLA_WARNING' | 'INSPECTION' | 'RENEWAL' | 'SYSTEM';
  isRead: boolean;
  linkUrl?: string;
  channel?: 'IN_APP' | 'SMS' | 'WHATSAPP' | 'EMAIL';
  recipientContact?: string;
  createdAt: Date;
}


export interface StoredAuditLog {
  id: string;
  userId?: string | null;
  userRole?: string;
  action: string;
  entityName: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface StoredQuery {
  id: string;
  applicationId: string;
  officerId: string;
  citizenId: string;
  approvalCode: string;
  subject: string;
  question: string;
  answer?: string;
  status: 'OPEN' | 'RESPONDED' | 'RESOLVED';
  createdAt: Date;
  answeredAt?: Date;
}

export interface StoredAppeal {
  id: string;
  appealNumber: string;
  applicationId: string;
  citizenId: string;
  departmentCode: string;
  appellateAuthority: 'FIRST_APPELLATE' | 'SECOND_APPELLATE';
  groundForAppeal: 'SLA_BREACH' | 'REJECTION_WITHOUT_REASON' | 'UNREASONABLE_QUERY' | 'CORRUPTION_HARASSMENT' | 'OTHER';
  applicantStatement: string;
  status: 'PENDING' | 'HEARING_SCHEDULED' | 'UPHELD' | 'DIRECTED_CLEARANCE' | 'DISMISSED';
  officerRemarks?: string;
  hearingDate?: string;
  orderDocumentUrl?: string;
  createdAt: Date;
  decidedAt?: Date;
  decidedBy?: string;
}

class DatabaseService {
  public prisma: PrismaClient;
  public isPostgresConnected: boolean = false;

  // In-memory / Fallback Data Stores with full fidelity
  public users: StoredUser[] = [];
  public businessProfiles: StoredBusinessProfile[] = [];
  public departments: MasterDepartment[] = [];
  public approvals: MasterApproval[] = [];
  public rules: MasterRule[] = [];
  public applications: StoredApplication[] = [];
  public documents: StoredDocument[] = [];
  public inspections: StoredInspection[] = [];
  public schemes: StoredScheme[] = [];
  public compliances: StoredCompliance[] = [];
  public renewals: StoredRenewal[] = [];
  public notifications: StoredNotification[] = [];
  public auditLogs: StoredAuditLog[] = [];
  public queries: StoredQuery[] = [];
  public appeals: StoredAppeal[] = [];

  constructor() {
    this.prisma = new PrismaClient();
    this.initMasterData();
    this.setupAuditLogHooks();
    this.checkConnection();
  }

  private setupAuditLogHooks() {
    const originalPush = this.auditLogs.push.bind(this.auditLogs);
    const originalUnshift = this.auditLogs.unshift.bind(this.auditLogs);

    const persistItem = async (item: StoredAuditLog) => {
      if (this.isPostgresConnected) {
        try {
          let validUserId: string | null = null;
          if (item.userId) {
            const userRec = await this.prisma.user.findUnique({
              where: { id: item.userId },
              select: { id: true, role: true },
            });
            if (userRec) {
              validUserId = userRec.id;
              if (!item.userRole) item.userRole = userRec.role;
            }
          }

          await this.prisma.auditLog.create({
            data: {
              userId: validUserId,
              userRole: item.userRole || null,
              action: item.action,
              entityName: item.entityName,
              entityId: item.entityId || null,
              ipAddress: item.ipAddress || '103.21.124.5',
              userAgent: item.userAgent || null,
              detailsJson: item.details || {},
              createdAt: item.createdAt || new Date(),
            },
          });
        } catch {
          // Prevent unhandled errors from breaking operational flows
        }
      }
    };

    this.auditLogs.push = (...items: StoredAuditLog[]) => {
      const res = originalPush(...items);
      for (const item of items) {
        persistItem(item);
      }
      return res;
    };

    this.auditLogs.unshift = (...items: StoredAuditLog[]) => {
      const res = originalUnshift(...items);
      for (const item of items) {
        persistItem(item);
      }
      return res;
    };
  }

  public async syncWithDatabase() {
    if (!this.isPostgresConnected) return;
    try {
      const depts = await this.prisma.department.findMany({ where: { isActive: true } });
      if (depts.length > 0) {
        this.departments = depts.map(d => ({
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

      const apps = await this.prisma.approval.findMany({
        where: { isActive: true },
        include: { department: true },
      });
      if (apps.length > 0) {
        this.approvals = apps.map(a => ({
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

      const rls = await this.prisma.approvalRule.findMany({
        where: { isActive: true },
        include: { approval: true },
      });
      if (rls.length > 0) {
        this.rules = rls.map(r => ({
          id: r.id,
          approvalCode: r.approval.approvalCode,
          ruleCode: r.ruleCode,
          ruleName: r.ruleName,
          priority: r.priority,
          conditionsJson: r.conditionsJson,
          explanationTpl: r.explanationTpl,
        }));
      }

      const schs = await this.prisma.scheme.findMany({
        where: { isActive: true },
        include: { department: true },
      });
      if (schs.length > 0) {
        this.schemes = schs.map(s => ({
          id: s.id,
          code: s.schemeCode,
          name: s.schemeName,
          category: 'CAPITAL_SUBSIDY',
          departmentCode: s.department?.code || 'INDUSTRY',
          subsidyPercentage: s.subsidyPercentage ? Number(s.subsidyPercentage) : undefined,
          maxBenefitAmountInr: s.maxInvestment ? Number(s.maxInvestment) : undefined,
          description: s.benefitsDescription,
          eligibilitySummary: s.benefitsDescription,
          portalUrl: s.applicationUrl || undefined,
        }));
      }
    } catch (err) {
      console.warn('[Database] Error synchronizing master data from PostgreSQL:', err);
    }
  }

  private async checkConnection() {
    try {
      await this.prisma.$connect();
      this.isPostgresConnected = true;
      console.log('✅ [Database] PostgreSQL connected successfully via Prisma Client.');
      await this.syncWithDatabase();
    } catch (err: any) {
      this.isPostgresConnected = false;
      console.warn('⚠️ [Database] PostgreSQL is currently offline at localhost:5432.');
    }
  }

  private initMasterData() {
    // 1. Departments Master (Government of Maharashtra)
    this.departments = [
      {
        id: 'dept-mpcb',
        code: 'MPCB',
        name: 'Maharashtra Pollution Control Board',
        nameMarathi: 'महाराष्ट्र प्रदूषण नियंत्रण मंडळ',
        description: 'Statutory pollution consents (CTE/CTO) under Water and Air Acts',
        portalUrl: 'https://ecmpcb.in',
        nodalOfficerEmail: 'mpcb.support@maharashtra.gov.in',
        slaWorkingDays: 45,
        isActive: true,
      },
      {
        id: 'dept-midc',
        code: 'MIDC',
        name: 'Maharashtra Industrial Development Corporation',
        nameMarathi: 'महाराष्ट्र औद्योगिक विकास महामंडळ',
        description: 'Land allotment, building plan approvals and water connection in industrial estates',
        portalUrl: 'https://midcindia.org',
        nodalOfficerEmail: 'support@midcindia.org',
        slaWorkingDays: 30,
        isActive: true,
      },
      {
        id: 'dept-dish',
        code: 'DISH',
        name: 'Directorate of Industrial Safety and Health',
        nameMarathi: 'औद्योगिक सुरक्षा व आरोग्य संचालनालय',
        description: 'Factory registration and licensing under Factories Act 1948',
        portalUrl: 'https://dish.maharashtra.gov.in',
        nodalOfficerEmail: 'dish.helpdesk@maharashtra.gov.in',
        slaWorkingDays: 30,
        isActive: true,
      },
      {
        id: 'dept-fire',
        code: 'FIRE',
        name: 'Maharashtra Fire Services & Emergency Services',
        nameMarathi: 'महाराष्ट्र अग्निशमन सेवा',
        description: 'Provisional and Final Fire NOC for industrial buildings',
        portalUrl: 'https://nfs.mahafireservice.gov.in',
        nodalOfficerEmail: 'fire.noc@maharashtra.gov.in',
        slaWorkingDays: 21,
        isActive: true,
      },
      {
        id: 'dept-msedcl',
        code: 'MSEDCL',
        name: 'Maharashtra State Electricity Distribution Co. Ltd.',
        nameMarathi: 'महाराष्ट्र राज्य विद्युत वितरण कंपनी',
        description: 'HT/LT industrial power connection and load sanction',
        portalUrl: 'https://www.mahadiscom.in',
        nodalOfficerEmail: 'customercare@mahadiscom.in',
        slaWorkingDays: 15,
        isActive: true,
      },
      {
        id: 'dept-revenue',
        code: 'REVENUE',
        name: 'Revenue and Forest Department',
        nameMarathi: 'महसूल व वन विभाग',
        description: 'Non-Agricultural (NA) Land Permission, 7/12 extract certification',
        portalUrl: 'https://mahabhumi.gov.in',
        nodalOfficerEmail: 'revenue.support@maharashtra.gov.in',
        slaWorkingDays: 45,
        isActive: true,
      },
      {
        id: 'dept-labour',
        code: 'LABOUR',
        name: 'Labour Department Government of Maharashtra',
        nameMarathi: 'कामगार विभाग महाराष्ट्र शासन',
        description: 'Shop & Establishment registration, Contract Labour license',
        portalUrl: 'https://mahakamgar.maharashtra.gov.in',
        nodalOfficerEmail: 'labour.commissioner@maharashtra.gov.in',
        slaWorkingDays: 15,
        isActive: true,
      },
      {
        id: 'dept-cgwa',
        code: 'CGWA',
        name: 'Central Ground Water Authority / MWRRA',
        nameMarathi: 'महाराष्ट्र जलसंपत्ती नियमन प्राधिकरण',
        description: 'NOC for industrial ground water extraction',
        portalUrl: 'https://mwrra.org',
        nodalOfficerEmail: 'groundwater.noc@maharashtra.gov.in',
        slaWorkingDays: 60,
        isActive: true,
      },
      {
        id: 'dept-boiler',
        code: 'BOILER',
        name: 'Directorate of Steam Boilers Maharashtra',
        nameMarathi: 'बाष्पके संचालनालय',
        description: 'Registration and inspection of industrial steam boilers',
        portalUrl: 'https://boilers.maharashtra.gov.in',
        nodalOfficerEmail: 'boiler.inspector@maharashtra.gov.in',
        slaWorkingDays: 30,
        isActive: true,
      },
    ];

    // 2. Approvals Catalog
    this.approvals = [
      {
        id: 'appr-mpcb-cte',
        departmentId: 'dept-mpcb',
        departmentCode: 'MPCB',
        approvalCode: 'MPCB_CTE',
        name: 'Consent to Establish (CTE)',
        nameMarathi: 'स्थापनेसाठी संमती',
        stage: 'PRE_ESTABLISHMENT',
        category: 'NOC',
        description: 'Statutory consent before constructing or installing plant and machinery',
        statutoryAct: 'Water Act 1974, Air Act 1981',
        statutoryTimelineDays: 45,
        validityPeriodMonths: 60,
        renewalRequired: false,
        requiredDocCodes: ['DOC_PAN', 'DOC_PROJECT_REPORT', 'DOC_SITE_PLAN', 'DOC_POLLUTION_SCHEME'],
        feeStructureDetails: 'Tiered based on capital investment (Rs. 5,000 to Rs. 5,00,000)',
        externalPortalLink: 'https://ecmpcb.in',
        isActive: true,
      },
      {
        id: 'appr-mpcb-cto',
        departmentId: 'dept-mpcb',
        departmentCode: 'MPCB',
        approvalCode: 'MPCB_CTO',
        name: 'Consent to Operate (CTO)',
        nameMarathi: 'चालू करण्यासाठी संमती',
        stage: 'PRE_OPERATION',
        category: 'LICENCE',
        description: 'Mandatory consent to commence commercial production',
        statutoryAct: 'Water Act 1974, Air Act 1981',
        statutoryTimelineDays: 45,
        validityPeriodMonths: 36,
        renewalRequired: true,
        requiredDocCodes: ['DOC_CTE_COPY', 'DOC_COMPLIANCE_REPORT', 'DOC_ETP_PHOTOGRAPHS', 'DOC_RAW_MATERIAL_DETAILS'],
        feeStructureDetails: 'Tiered based on capital investment',
        externalPortalLink: 'https://ecmpcb.in',
        isActive: true,
      },
      {
        id: 'appr-dish-fact',
        departmentId: 'dept-dish',
        departmentCode: 'DISH',
        approvalCode: 'DISH_FACT_LIC',
        name: 'Factory Registration and License',
        nameMarathi: 'कारखाना नोंदणी व परवाना',
        stage: 'PRE_OPERATION',
        category: 'LICENCE',
        description: 'Registration and license to operate industrial factory premises',
        statutoryAct: 'Factories Act 1948 Section 6',
        statutoryTimelineDays: 30,
        validityPeriodMonths: 12,
        renewalRequired: true,
        requiredDocCodes: ['DOC_SITE_PLAN', 'DOC_STABILITY_CERTIFICATE', 'DOC_FLOW_CHART', 'DOC_DIRECTOR_LIST'],
        feeStructureDetails: 'Based on number of workers and installed BHP',
        externalPortalLink: 'https://dish.maharashtra.gov.in',
        isActive: true,
      },
      {
        id: 'appr-fire-prov',
        departmentId: 'dept-fire',
        departmentCode: 'FIRE',
        approvalCode: 'FIRE_PROVISIONAL_NOC',
        name: 'Provisional Fire Safety NOC',
        nameMarathi: 'तात्पुरता अग्निशामक ना हरकत दाखला',
        stage: 'PRE_ESTABLISHMENT',
        category: 'NOC',
        description: 'Preliminary clearance of building architectural plans from fire safety angle',
        statutoryAct: 'Maharashtra Fire Prevention and Life Safety Measures Act 2006',
        statutoryTimelineDays: 21,
        validityPeriodMonths: 12,
        renewalRequired: false,
        requiredDocCodes: ['DOC_ARCHITECTURAL_DRAWING', 'DOC_7_12', 'DOC_SITE_LAYOUT'],
        feeStructureDetails: 'Based on built-up area (Rs. 10/sqm)',
        externalPortalLink: 'https://nfs.mahafireservice.gov.in',
        isActive: true,
      },
      {
        id: 'appr-fire-final',
        departmentId: 'dept-fire',
        departmentCode: 'FIRE',
        approvalCode: 'FIRE_FINAL_NOC',
        name: 'Final Fire Safety NOC',
        nameMarathi: 'अंतिम अग्निशामक ना हरकत दाखला',
        stage: 'PRE_OPERATION',
        category: 'NOC',
        description: 'Final inspection and compliance certificate for fire safety installations',
        statutoryAct: 'Maharashtra Fire Prevention and Life Safety Measures Act 2006',
        statutoryTimelineDays: 21,
        validityPeriodMonths: 12,
        renewalRequired: true,
        requiredDocCodes: ['DOC_PROVISIONAL_FIRE_NOC', 'DOC_FORM_A', 'DOC_FIRE_EQUIPMENT_TEST_REPORT'],
        feeStructureDetails: 'Nil after initial compliance scrutiny',
        externalPortalLink: 'https://nfs.mahafireservice.gov.in',
        isActive: true,
      },
      {
        id: 'appr-midc-plan',
        departmentId: 'dept-midc',
        departmentCode: 'MIDC',
        approvalCode: 'MIDC_BLDG_PLAN',
        name: 'Building Plan Approval & Commencement Certificate',
        nameMarathi: 'इमारत आराखडा मंजुरी आणि प्रारंभ प्रमाणपत्र',
        stage: 'PRE_ESTABLISHMENT',
        category: 'PERMISSION',
        description: 'Sanction of factory building blueprints within MIDC industrial area',
        statutoryAct: 'MIDC Development Control Regulations',
        statutoryTimelineDays: 30,
        validityPeriodMonths: 36,
        renewalRequired: false,
        requiredDocCodes: ['DOC_LAND_ALLOTMENT_LETTER', 'DOC_STRUCTURAL_DRAWING', 'DOC_SOIL_INVESTIGATION'],
        feeStructureDetails: 'As per MIDC schedule of rates',
        externalPortalLink: 'https://midcindia.org',
        isActive: true,
      },
      {
        id: 'appr-rev-na',
        departmentId: 'dept-revenue',
        departmentCode: 'REVENUE',
        approvalCode: 'REVENUE_NA_PERM',
        name: 'Non-Agricultural (NA) Land Conversion',
        nameMarathi: 'अकृषिक (NA) जमीन परवानगी',
        stage: 'PRE_ESTABLISHMENT',
        category: 'PERMISSION',
        description: 'Permission to convert agricultural land parcel into industrial usage',
        statutoryAct: 'Maharashtra Land Revenue Code 1966',
        statutoryTimelineDays: 45,
        validityPeriodMonths: 0,
        renewalRequired: false,
        requiredDocCodes: ['DOC_7_12', 'DOC_ZONE_CERTIFICATE', 'DOC_TILR_MEASUREMENT_PLAN'],
        feeStructureDetails: 'Conversion tax as per collector rate',
        externalPortalLink: 'https://mahabhumi.gov.in',
        isActive: true,
      },
      {
        id: 'appr-msedcl-ht',
        departmentId: 'dept-msedcl',
        departmentCode: 'MSEDCL',
        approvalCode: 'MSEDCL_HT_CONNECTION',
        name: 'High Tension (HT) Industrial Power Sanction',
        nameMarathi: 'उच्च दाब औद्योगिक वीज जोडणी',
        stage: 'PRE_OPERATION',
        category: 'PERMISSION',
        description: 'Load sanction and grid connectivity for high voltage industrial supply',
        statutoryAct: 'Electricity Act 2003',
        statutoryTimelineDays: 15,
        validityPeriodMonths: 0,
        renewalRequired: false,
        requiredDocCodes: ['DOC_OWNERSHIP_PROOF', 'DOC_LOAD_CALCULATION', 'DOC_ELECTRICAL_INSPECTOR_CLEARANCE'],
        feeStructureDetails: 'Security deposit + Service line charges',
        externalPortalLink: 'https://www.mahadiscom.in',
        isActive: true,
      },
      {
        id: 'appr-cgwa-gw',
        departmentId: 'dept-cgwa',
        departmentCode: 'CGWA',
        approvalCode: 'CGWA_GW_NOC',
        name: 'Groundwater Abstraction NOC',
        nameMarathi: 'भूजल उपसा ना हरकत प्रमाणपत्र',
        stage: 'PRE_ESTABLISHMENT',
        category: 'NOC',
        description: 'Permission for extraction of groundwater for industrial consumption',
        statutoryAct: 'MWRRA / CGWA Guidelines 2020',
        statutoryTimelineDays: 60,
        validityPeriodMonths: 24,
        renewalRequired: true,
        requiredDocCodes: ['DOC_HYDROGEOLOGICAL_REPORT', 'DOC_WATER_AUDIT_REPORT', 'DOC_RAINWATER_HARVESTING_PLAN'],
        feeStructureDetails: 'Regulatory fee based on daily KLD drawal',
        externalPortalLink: 'https://mwrra.org',
        isActive: true,
      },
      {
        id: 'appr-boiler-reg',
        departmentId: 'dept-boiler',
        departmentCode: 'BOILER',
        approvalCode: 'BOILER_REG',
        name: 'Boiler Registration & Inspection',
        nameMarathi: 'बाष्पक नोंदणी व तपासणी',
        stage: 'PRE_OPERATION',
        category: 'REGISTRATION',
        description: 'Statutory registration and inspection certificate for steam boiler',
        statutoryAct: 'Indian Boilers Act 1923',
        statutoryTimelineDays: 30,
        validityPeriodMonths: 12,
        renewalRequired: true,
        requiredDocCodes: ['DOC_BOILER_MAKER_CERTIFICATE', 'DOC_PIPE_LAYOUT', 'DOC_WELDER_CERTIFICATE'],
        feeStructureDetails: 'Based on heating surface area in sq meters',
        externalPortalLink: 'https://boilers.maharashtra.gov.in',
        isActive: true,
      },
    ];

    // 3. Approval Rules Master
    this.rules = [
      {
        id: 'rule-mpcb-cte',
        ruleCode: 'RULE_MPCB_CTE',
        approvalCode: 'MPCB_CTE',
        ruleName: 'Mandatory CTE for Polluting Sectors',
        priority: 10,
        conditionsJson: { field: 'pollutionCategory', operator: 'in', value: ['RED', 'ORANGE', 'GREEN'] },
        explanationTpl: 'Your industrial unit is classified under the {pollutionCategory} category by MPCB, mandating a Consent to Establish prior to any physical construction or machine installation under Section 25 of the Water Act 1974.',
      },
      {
        id: 'rule-mpcb-cto',
        ruleCode: 'RULE_MPCB_CTO',
        approvalCode: 'MPCB_CTO',
        ruleName: 'Mandatory CTO Prior to Commercial Production',
        priority: 10,
        conditionsJson: { field: 'pollutionCategory', operator: 'in', value: ['RED', 'ORANGE', 'GREEN'] },
        explanationTpl: 'With your plant classified under {pollutionCategory} category, commercial manufacturing cannot commence without an operational environmental license (CTO).',
      },
      {
        id: 'rule-dish-fact',
        ruleCode: 'RULE_DISH_FACTORY',
        approvalCode: 'DISH_FACT_LIC',
        ruleName: 'Factories Act Threshold Rule',
        priority: 20,
        conditionsJson: { and: [{ field: 'employeeCount', operator: '>=', value: 10 }, { field: 'powerRequirementKva', operator: '>', value: 0 }] },
        explanationTpl: 'Your enterprise employs {employeeCount} workers and utilizes electric power, fulfilling the statutory definition of a factory under Section 2(m)(i) of the Factories Act, 1948.',
      },
      {
        id: 'rule-fire-noc',
        ruleCode: 'RULE_FIRE_NOC_AREA',
        approvalCode: 'FIRE_PROVISIONAL_NOC',
        ruleName: 'Fire Safety Clearance by Area/Sector',
        priority: 30,
        conditionsJson: { or: [{ field: 'builtUpAreaSqm', operator: '>=', value: 500 }, { field: 'pollutionCategory', operator: 'in', value: ['RED', 'ORANGE'] }] },
        explanationTpl: 'Your proposed built-up area of {builtUpAreaSqm} sq.m and {pollutionCategory} risk category mandates prior architectural review and Fire NOC under the Maharashtra Fire Prevention Act.',
      },
      {
        id: 'rule-midc-plan',
        ruleCode: 'RULE_MIDC_PLAN',
        approvalCode: 'MIDC_BLDG_PLAN',
        ruleName: 'MIDC Industrial Estate Building Clearance',
        priority: 15,
        conditionsJson: { field: 'isMidcArea', operator: '==', value: true },
        explanationTpl: 'Since your industrial plot is located within an MIDC industrial estate ({midcEstateName}), building blueprint approval and commencement certificate must be obtained directly from MIDC Special Planning Authority (SPA).',
      },
      {
        id: 'rule-rev-na',
        ruleCode: 'RULE_REVENUE_NA',
        approvalCode: 'REVENUE_NA_PERM',
        ruleName: 'Non-Agricultural Conversion for Non-MIDC Private Land',
        priority: 15,
        conditionsJson: { field: 'isMidcArea', operator: '==', value: false },
        explanationTpl: 'Your proposed setup is on private land outside MIDC territory, requiring statutory land use conversion to Non-Agricultural (Industrial) under Section 44 of Maharashtra Land Revenue Code 1966.',
      },
      {
        id: 'rule-msedcl-ht',
        ruleCode: 'RULE_MSEDCL_HT',
        approvalCode: 'MSEDCL_HT_CONNECTION',
        ruleName: 'High Voltage Load Sanction',
        priority: 25,
        conditionsJson: { field: 'powerRequirementKva', operator: '>=', value: 100 },
        explanationTpl: 'Your sanctioned power demand is {powerRequirementKva} kVA (>= 100 kVA), requiring a High Tension (HT 11kV/22kV/33kV) connection agreement with MSEDCL.',
      },
      {
        id: 'rule-cgwa-gw',
        ruleCode: 'RULE_CGWA_GW',
        approvalCode: 'CGWA_GW_NOC',
        ruleName: 'Industrial Groundwater Abstraction Clearance',
        priority: 20,
        conditionsJson: { and: [{ field: 'waterSource', operator: '==', value: 'GROUNDWATER' }, { field: 'waterRequirementKld', operator: '>', value: 10 }] },
        explanationTpl: 'Drawing {waterRequirementKld} KLD of groundwater for commercial or industrial operations requires mandatory abstraction NOC from MWRRA / Central Ground Water Authority.',
      },
      {
        id: 'rule-boiler-reg',
        ruleCode: 'RULE_BOILER_REG',
        approvalCode: 'BOILER_REG',
        ruleName: 'Steam Boiler Safety Certification',
        priority: 20,
        conditionsJson: { field: 'hasBoiler', operator: '==', value: true },
        explanationTpl: 'Your facility utilizes an industrial steam boiler (capacity {boilerCapacityTph} TPH), requiring inspection, hydraulic testing, and statutory registration under the Indian Boilers Act, 1923.',
      },
    ];

    // 4. Schemes & Incentives Master
    this.schemes = [
      {
        id: 'scheme-psi-2019',
        code: 'PSI_2019',
        name: 'Package Scheme of Incentives (PSI 2019)',
        nameMarathi: 'प्रोत्साहन पॅकेज योजना २०१९',
        category: 'CAPITAL_SUBSIDY',
        departmentCode: 'INDUSTRY',
        subsidyPercentage: 40,
        maxBenefitAmountInr: 50000000,
        description: 'Comprehensive financial support for MSMEs and Large units investing in developing industrial zones of Maharashtra (Zones B, C, D, D+).',
        eligibilitySummary: 'Eligible for manufacturing MSMEs with gross fixed capital investment above Rs. 25 Lakhs.',
        portalUrl: 'https://mahaindustries.gov.in',
      },
      {
        id: 'scheme-dr-ambedkar',
        code: 'AMBEDKAR_SCHEME',
        name: 'Dr. Babasaheb Ambedkar Special Scheme for SC/ST Entrepreneurs',
        nameMarathi: 'डॉ. बाबासाहेब आंबेडकर विशेष योजना',
        category: 'MARGIN_MONEY',
        departmentCode: 'INDUSTRY',
        subsidyPercentage: 30,
        maxBenefitAmountInr: 2000000,
        description: 'Enhanced capital subsidy, margin money assistance, and concessional electricity tariffs for SC/ST owned enterprises.',
        eligibilitySummary: 'At least 51% shareholding by SC/ST entrepreneurs in Maharashtra.',
        portalUrl: 'https://mahaindustries.gov.in',
      },
      {
        id: 'scheme-cmegp',
        code: 'CMEGP',
        name: 'Chief Minister Employment Generation Programme (CMEGP)',
        nameMarathi: 'मुख्यमंत्री रोजगार निर्मिती कार्यक्रम',
        category: 'SUBSIDIZED_LOAN',
        departmentCode: 'LABOUR',
        subsidyPercentage: 25,
        maxBenefitAmountInr: 5000000,
        description: 'Financial assistance and project loan subsidy to promote manufacturing and service sector startups across all 36 districts.',
        eligibilitySummary: 'Age 18-45 years, educational qualification 7th pass minimum for projects over 10L.',
        portalUrl: 'https://maha-cmegp.gov.in',
      },
      {
        id: 'scheme-green-tech',
        code: 'GREEN_ENERGY_SUBSIDY',
        name: 'Green Energy & Effluent Treatment Subsidy',
        nameMarathi: 'हरित ऊर्जा व सांडपाणी प्रक्रिया अनुदान',
        category: 'ENVIRONMENT',
        departmentCode: 'MPCB',
        subsidyPercentage: 50,
        maxBenefitAmountInr: 10000000,
        description: 'Special subsidy for setting up Zero Liquid Discharge (ZLD) plants, solar rooftops, and energy conservation equipment.',
        eligibilitySummary: 'Units with valid MPCB Consent adopting sustainable clean technologies.',
        portalUrl: 'https://ecmpcb.in',
      },
    ];
  }
}

export const db = new DatabaseService();
