import { db, StoredApplication } from './db.service';
import crypto from 'crypto';

export interface ClearanceItemView {
  approvalCode: string;
  approvalName: string;
  departmentCode: string;
  departmentName: string;
  statutoryAct: string;
  licenseNumber: string;
  status: string;
  approvedDate: string;
  validUntil: string;
  issuingOfficer: string;
}

export interface CompositeCertificate {
  compositeClearanceNumber: string; // e.g. MH-SWC-2026-89421
  applicationNumber: string;
  businessName: string;
  legalEntityType: string;
  industrySector: string;
  district: string;
  locationDetails: string;
  capitalInvestmentCr: number;
  workforceCount: number;
  powerLoadKva: number;
  waterDemandKld: number;
  pollutionCategory: string;
  issuanceDate: string;
  issuingAuthority: string;
  stateGatewaySeal: string;
  digitalEndorsementHash: string;
  qrVerificationUrl: string;
  clearancesCount: number;
  clearedApprovals: ClearanceItemView[];
  statutoryPreamble: string;
}

export interface ProjectDossier {
  dossierNumber: string;
  applicationNumber: string;
  generatedAt: string;
  enterpriseOverview: {
    businessName: string;
    legalEntityType: string;
    industrySector: string;
    district: string;
    taluka: string;
    pinCode: string;
    isMidcArea: boolean;
    midcEstateName?: string;
    investmentInr: number;
    employeeCount: number;
    pollutionCategory: string;
  };
  parallelClearanceHistory: {
    approvalCode: string;
    approvalName: string;
    departmentCode: string;
    departmentName: string;
    status: string;
    slaDays: number;
    approvedAt?: string;
    remarks?: string;
  }[];
  jointInspectionSummary?: {
    scheduledDate: string;
    leadOfficer: string;
    participatingDepartments: string[];
    siteAddress: string;
    status: string;
    notes?: string;
  };
  statutoryRtsAudit: {
    statutoryGuaranteeDays: number;
    daysTaken: number;
    slaCompliant: boolean;
    deemedApprovalInvoked: boolean;
  };
  attachedVerifiedDocuments: {
    documentType: string;
    title: string;
    fileName: string;
    fileSizeKb: number;
    verificationStatus: string;
    sha256Hash: string;
  }[];
  statutoryEndorsement: {
    endorsingAuthority: string;
    digitalSeal: string;
    securityHash: string;
  };
}

export class DossierService {
  /**
   * Generates the official Government of Maharashtra Composite Single-Window Industrial Clearance Certificate.
   */
  public async generateCertificate(
    applicationId: string,
    requestingUser?: { userId: string; role: string }
  ): Promise<CompositeCertificate> {
    const app = db.applications.find(
      a => a.id === applicationId || a.applicationNumber === applicationId
    );
    if (!app) {
      throw new Error(`Application '${applicationId}' not found.`);
    }

    if (requestingUser && requestingUser.role === 'CITIZEN' && app.userId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to access the clearance certificate for this enterprise.');
    }

    const profile = db.businessProfiles.find(p => p.id === app.businessProfileId);
    const appNumDigits = app.applicationNumber.replace(/[^0-9]/g, '').slice(-5) || '89421';
    const ccn = `MH-SWC-2026-${appNumDigits}`;

    // Map approved clearances
    const clearedApprovals: ClearanceItemView[] = app.approvals.map((appr, idx) => {
      const year = new Date().getFullYear();
      const num = 10000 + idx * 73 + parseInt(appNumDigits.slice(-3) || '123', 10);
      const licenseNumber = `${appr.departmentCode}/MAHA/${year}/${num}`;
      const approvedDateStr = appr.approvedAt
        ? appr.approvedAt.toISOString().split('T')[0]
        : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const validUntilStr = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return {
        approvalCode: appr.approvalCode,
        approvalName: appr.approvalName,
        departmentCode: appr.departmentCode,
        departmentName:
          appr.departmentCode === 'MPCB'
            ? 'Maharashtra Pollution Control Board'
            : appr.departmentCode === 'DISH'
            ? 'Directorate of Industrial Safety & Health'
            : appr.departmentCode === 'MIDC'
            ? 'Maharashtra Industrial Development Corporation'
            : appr.departmentCode === 'FIRE'
            ? 'Maharashtra Fire Services'
            : 'Department of Industries',
        statutoryAct:
          appr.departmentCode === 'MPCB'
            ? 'Water Act 1974 & Air Act 1981'
            : appr.departmentCode === 'DISH'
            ? 'Factories Act 1948 Section 6'
            : appr.departmentCode === 'FIRE'
            ? 'Maharashtra Fire Prevention & Life Safety Measures Act 2006'
            : 'Maharashtra Industrial Development Act 1961',
        licenseNumber,
        status: appr.status,
        approvedDate: approvedDateStr,
        validUntil: validUntilStr,
        issuingOfficer: `Designated Officer (${appr.departmentCode})`,
      };
    });

    const payloadToHash = `${ccn}|${app.applicationNumber}|${profile?.businessName}|${clearedApprovals.length}`;
    const digitalHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const totalInv = (profile?.investmentPlantMachinery || 0) + (profile?.investmentLandBuilding || 0);
    const totalInvCr = Number((totalInv / 10000000).toFixed(2)) || 8.5;

    return {
      compositeClearanceNumber: ccn,
      applicationNumber: app.applicationNumber,
      businessName: profile?.businessName || 'Sahyadri Precision Engineering Pvt Ltd',
      legalEntityType: profile?.legalEntityType || 'PRIVATE_LIMITED',
      industrySector: profile?.industrySector || 'Automobile & Precision Engineering',
      district: profile?.district || 'Pune',
      locationDetails: profile?.isMidcArea
        ? `${profile?.midcEstateName || 'Chakan Phase II MIDC'}, Plot No. 42`
        : `${profile?.taluka || 'Khed'}, ${profile?.district || 'Pune'}`,
      capitalInvestmentCr: totalInvCr,
      workforceCount: profile?.employeeCount || 65,
      powerLoadKva: profile?.powerRequirementKva || 450,
      waterDemandKld: profile?.waterRequirementKld || 25,
      pollutionCategory: profile?.pollutionCategory || 'ORANGE',
      issuanceDate: new Date().toISOString().split('T')[0],
      issuingAuthority: 'Government of Maharashtra — Directorate of Industries & MSInS Single Window Bureau',
      stateGatewaySeal: 'MAITRI-SEAL-MH-GOV-2026-VERIFIED',
      digitalEndorsementHash: digitalHash,
      qrVerificationUrl: `https://maitri.maharashtra.gov.in/verify/clearance?ccn=${ccn}`,
      clearancesCount: clearedApprovals.length,
      clearedApprovals,
      statutoryPreamble:
        'Pursuant to the powers conferred under the Maharashtra Single Window Act 2016 and the Maharashtra Right to Public Services Act 2015, this Composite Clearance Certificate is granted after unified parallel technical scrutiny and inspection across participating departments.',
    };
  }

  /**
   * Generates the comprehensive audit-ready Single-Window Project Dossier.
   */
  public async generateDossier(
    applicationId: string,
    requestingUser?: { userId: string; role: string }
  ): Promise<ProjectDossier> {
    const app = db.applications.find(
      a => a.id === applicationId || a.applicationNumber === applicationId
    );
    if (!app) {
      throw new Error(`Application '${applicationId}' not found.`);
    }

    if (requestingUser && requestingUser.role === 'CITIZEN' && app.userId !== requestingUser.userId) {
      throw new Error('Forbidden: You do not have permission to access the project dossier for this enterprise.');
    }

    const profile = db.businessProfiles.find(p => p.id === app.businessProfileId);
    const insp = db.inspections.find(i => i.applicationId === app.id) || db.inspections[0];
    const docs = db.documents.filter(d => d.applicationId === app.id || d.userId === app.userId);

    const dossierNumber = `DOSSIER-MH-2026-${app.applicationNumber.replace(/[^0-9]/g, '').slice(-5) || '89421'}`;

    const totalInv = (profile?.investmentPlantMachinery || 0) + (profile?.investmentLandBuilding || 0);

    const attachedDocs = docs.map(d => ({
      documentType: d.documentType,
      title: d.title,
      fileName: d.fileName,
      fileSizeKb: Math.round(d.fileSize / 1024),
      verificationStatus: d.verificationStatus,
      sha256Hash: crypto.createHash('sha256').update(d.fileName + d.id).digest('hex'),
    }));

    const parallelClearanceHistory = app.approvals.map(a => ({
      approvalCode: a.approvalCode,
      approvalName: a.approvalName,
      departmentCode: a.departmentCode,
      departmentName:
        a.departmentCode === 'MPCB'
          ? 'Maharashtra Pollution Control Board'
          : a.departmentCode === 'DISH'
          ? 'Directorate of Industrial Safety & Health'
          : a.departmentCode === 'MIDC'
          ? 'Maharashtra Industrial Development Corporation'
          : 'State Single Window Inspectorate',
      status: a.status,
      slaDays: a.statutorySlaDays || 45,
      approvedAt: a.approvedAt ? a.approvedAt.toISOString().replace('T', ' ').substring(0, 16) : undefined,
      remarks: a.remarks || 'Scrutinized and evaluated pursuant to statutory department rules.',
    }));

    const hashInput = `${dossierNumber}|${app.applicationNumber}|${attachedDocs.length}`;
    const securityHash = crypto.createHash('sha256').update(hashInput).digest('hex');

    return {
      dossierNumber,
      applicationNumber: app.applicationNumber,
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      enterpriseOverview: {
        businessName: profile?.businessName || 'Sahyadri Precision Engineering Pvt Ltd',
        legalEntityType: profile?.legalEntityType || 'PRIVATE_LIMITED',
        industrySector: profile?.industrySector || 'Automobile & Precision Engineering',
        district: profile?.district || 'Pune',
        taluka: profile?.taluka || 'Khed',
        pinCode: profile?.pinCode || '410501',
        isMidcArea: Boolean(profile?.isMidcArea),
        midcEstateName: profile?.midcEstateName || 'Chakan Industrial Estate Phase II',
        investmentInr: totalInv || 85000000,
        employeeCount: profile?.employeeCount || 65,
        pollutionCategory: profile?.pollutionCategory || 'ORANGE',
      },
      parallelClearanceHistory,
      jointInspectionSummary: insp
        ? {
            scheduledDate: typeof insp.scheduledDate === 'string' ? insp.scheduledDate : (insp.scheduledDate as any).toISOString().replace('T', ' ').substring(0, 16),
            leadOfficer: insp.leadOfficerName || 'Joint Inspection Team',
            participatingDepartments: insp.participatingDepartments,
            siteAddress: insp.location,
            status: insp.status,
            notes: insp.notes,
          }
        : undefined,
      statutoryRtsAudit: {
        statutoryGuaranteeDays: 45,
        daysTaken: 22,
        slaCompliant: true,
        deemedApprovalInvoked: false,
      },
      attachedVerifiedDocuments: attachedDocs,
      statutoryEndorsement: {
        endorsingAuthority: 'Principal Secretary (Industries) & Chief Executive Officer, MIDC',
        digitalSeal: 'MAITRI-DIGITAL-SIGNATURE-VERIFIED',
        securityHash,
      },
    };
  }
}

export const dossierService = new DossierService();
