export interface SchemeViewItem {
  id: string;
  code: string;
  name: string;
  department: string;
  category: 'CAPITAL_SUBSIDY' | 'INTEREST_SUBVENTION' | 'STAMP_DUTY_EXEMPTION' | 'POWER_TARIFF' | 'INNOVATION_GRANT';
  description: string;
  maxBenefit: string;
  benefits: string; // Frontend alias
  subsidyPercentage?: number;
  eligibilitySummary: string;
  eligibleSectors: string[];
  eligibleDistricts: string[];
  requiredDocuments: string[];
  status: 'ELIGIBLE' | 'CHECK_REQUIRED' | 'APPLIED';
  deadline?: string;
  officialPortalUrl: string;
  schemeDocumentUrl: string;
}

export interface EligibilityResult {
  eligible: boolean;
  schemeCode: string;
  schemeName: string;
  estimatedBenefit: string;
  subsidyPercentage?: number;
  breakdown: {
    capitalSubsidy: string;
    powerSubsidy: string;
    stampDutyExemption: string;
    interestSubvention: string;
  };
  remarks: string;
}

export interface ComplianceViewItem {
  id: string;
  title: string;
  approvalCode: string;
  department: string;
  statutoryAct: string;
  statutoryRule: string; // Frontend alias
  frequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'BIENNIAL';
  dueDate: string;
  nextDueDate: string; // Frontend alias
  status: 'PENDING' | 'COMPLIANT' | 'OVERDUE' | 'UPCOMING';
  penaltyClause: string;
  submissionPortal: string;
  reminderStatus: 'SENT' | 'PENDING';
}

export interface RenewalViewItem {
  id: string;
  licenceName: string;
  approvalName: string; // Frontend alias
  issuingAuthority: string;
  department: string; // Frontend alias
  licenceNumber: string;
  licenseNumber: string; // Frontend alias
  validFrom: string;
  validUntil: string;
  expiryDate: string; // Frontend alias
  status: 'VALID' | 'DUE_SOON' | 'OVERDUE' | 'RENEWAL_SUBMITTED' | 'RENEWAL_FILED';
  daysRemaining: number;
  renewalFee: string;
  renewalWindowOpen: boolean;
}

export class SchemeService {
  /**
   * Retrieves comprehensive master list of Maharashtra government industrial schemes.
   */
  public async getSchemes(): Promise<SchemeViewItem[]> {
    return [
      {
        id: 'sch-psi-2019',
        code: 'PSI_2019',
        name: 'Package Scheme of Incentives (PSI 2019/2024)',
        department: 'Directorate of Industries, Govt. of Maharashtra',
        category: 'CAPITAL_SUBSIDY',
        description: 'Comprehensive financial support for MSMEs and Large units investing in developing industrial zones of Maharashtra (Zones B, C, D, D+).',
        maxBenefit: 'Up to 40% - 80% of Fixed Capital Investment (Max ₹ 5.0 Cr for MSMEs, scaled for Large Units)',
        benefits: 'Capital subsidy up to 40%-80% of Eligible Capital Investment (ECI), 100% Stamp Duty Exemption on Land Lease, and Electricity Duty exemption for 7 years.',
        subsidyPercentage: 40,
        eligibilitySummary: 'Manufacturing MSMEs with gross fixed capital investment above Rs. 25 Lakhs in talukas categorized B, C, D, D+.',
        eligibleSectors: ['Automobile', 'Engineering', 'Textiles', 'Electronics', 'Chemicals', 'Food Processing'],
        eligibleDistricts: ['Pune (Talukas C/D)', 'Aurangabad', 'Nagpur', 'Nashik', 'Solapur', 'Kolhapur', 'All Talukas C/D/D+'],
        requiredDocuments: [
          'Udyam Registration Certificate',
          'Bank Term Loan Sanction Letter',
          'Chartered Accountant ECI Capital Expenditure Certificate',
          'MPCB CTE/CTO Certificate',
        ],
        status: 'ELIGIBLE',
        deadline: '31-Mar-2027',
        officialPortalUrl: 'https://mahaindustries.gov.in',
        schemeDocumentUrl: 'https://mahaindustries.gov.in/schemes/psi-2019-guidelines.pdf',
      },
      {
        id: 'sch-cmegp',
        code: 'CMEGP',
        name: 'Chief Minister Employment Generation Programme (CMEGP)',
        department: 'Directorate of Industries & KVIC',
        category: 'CAPITAL_SUBSIDY',
        description: 'Project loan subsidy to promote manufacturing and service sector startups across all 36 districts of Maharashtra.',
        maxBenefit: 'Margin money subsidy up to 25% (35% for Special Categories / Women) on projects up to ₹50 Lakhs.',
        benefits: 'Financial subsidy up to 25% (35% for Special Categories/Women) on project investments up to ₹50 Lakhs with bank credit linkage.',
        subsidyPercentage: 25,
        eligibilitySummary: 'Age 18-45 years, minimum 7th pass educational qualification for manufacturing projects up to ₹ 50 Lakhs.',
        eligibleSectors: ['Manufacturing', 'Service Enterprises', 'Agro-processing'],
        eligibleDistricts: ['All 36 Districts of Maharashtra'],
        requiredDocuments: [
          'Detailed Project Report (DPR)',
          'Domicile Certificate of Maharashtra',
          'Educational Qualification Proof',
          'Aadhaar & PAN Card',
        ],
        status: 'CHECK_REQUIRED',
        deadline: 'Annual Targets',
        officialPortalUrl: 'https://maha-cmegp.gov.in',
        schemeDocumentUrl: 'https://maha-cmegp.gov.in/guidelines.pdf',
      },
      {
        id: 'sch-ambedkar',
        code: 'AMBEDKAR_SCHEME',
        name: 'Dr. Babasaheb Ambedkar Special Scheme for SC/ST Industrialists',
        department: 'Social Justice & Industry Department',
        category: 'INTEREST_SUBVENTION',
        description: 'Enhanced capital subsidy, margin money assistance, and concessional electricity tariffs for SC/ST owned enterprises.',
        maxBenefit: '50% Capital Subsidy + 5% Interest Subvention for 5 years + ₹2.00/unit power discount',
        benefits: 'Special capital subsidy up to 50% of fixed capital investment, power tariff concession of ₹2.00 per unit for 5 years, and 100% interest subsidy.',
        subsidyPercentage: 50,
        eligibilitySummary: 'At least 51% shareholding by SC/ST entrepreneurs in Maharashtra with valid caste certificate.',
        eligibleSectors: ['All Manufacturing & IT Enterprises'],
        eligibleDistricts: ['All Districts of Maharashtra'],
        requiredDocuments: [
          'Caste Validity Certificate',
          'Udyam Certificate with 51%+ SC/ST Shareholding',
          'Industrial Project Report',
        ],
        status: 'CHECK_REQUIRED',
        deadline: 'Ongoing Scheme',
        officialPortalUrl: 'https://mahaindustries.gov.in',
        schemeDocumentUrl: 'https://mahaindustries.gov.in/schemes/dr-ambedkar-scheme.pdf',
      },
      {
        id: 'sch-power-tariff',
        code: 'MAHA_POWER_SUB',
        name: 'Maharashtra Industrial Power Tariff Concession Scheme',
        department: 'Energy Department, Govt. of Maharashtra',
        category: 'POWER_TARIFF',
        description: 'Concessional industrial power tariff support to reduce operational energy costs in developing industrial clusters.',
        maxBenefit: 'Tariff subsidy of ₹ 1.20 per unit consumed for 36 to 60 months.',
        benefits: 'Tariff subsidy of ₹ 1.20 per unit consumed for 3 years, reducing net HT/LT industrial electricity cost.',
        subsidyPercentage: 20,
        eligibilitySummary: 'Manufacturing MSMEs operating in Vidarbha, Marathwada, North Maharashtra, or Zone C/D talukas.',
        eligibleSectors: ['MSME Manufacturing Units', 'Continuous Process Industries'],
        eligibleDistricts: ['Vidarbha', 'Marathwada', 'North Maharashtra', 'Zone C/D Talukas'],
        requiredDocuments: [
          'MSEDCL Energy Bill with Sanctioned Load',
          'Factory License Copy',
          'Active Production Electricity Meter Certificate',
        ],
        status: 'ELIGIBLE',
        deadline: '31-Dec-2027',
        officialPortalUrl: 'https://mahadiscom.in',
        schemeDocumentUrl: 'https://mahadiscom.in/industrial-subsidy.pdf',
      },
      {
        id: 'sch-green-tech',
        code: 'GREEN_ENERGY_SUBSIDY',
        name: 'Green Industry & Water Conservation Incentive Grant',
        department: 'Environment & Climate Change Dept / MPCB',
        category: 'INNOVATION_GRANT',
        description: 'Special capital grant for setting up Zero Liquid Discharge (ZLD) plants, solar rooftops, and energy conservation equipment.',
        maxBenefit: 'Direct grant of 30% to 50% of equipment cost (Max ₹ 25 Lakhs to ₹ 1.0 Cr).',
        benefits: 'Direct grant of 30% up to ₹25 Lakhs for installation of Zero Liquid Discharge (ZLD) ETPs and rain water harvesting structures.',
        subsidyPercentage: 30,
        eligibilitySummary: 'Units with valid MPCB Consent adopting sustainable clean technologies, ZLD, or rooftop solar.',
        eligibleSectors: ['Units installing Zero Liquid Discharge (ZLD) ETP or Rooftop Solar'],
        eligibleDistricts: ['All Districts of Maharashtra'],
        requiredDocuments: [
          'MPCB Approval for ZLD System',
          'Chartered Engineer Vendor Purchase Invoice',
          'Post-Commissioning Performance Report',
        ],
        status: 'ELIGIBLE',
        deadline: '31-Dec-2026',
        officialPortalUrl: 'https://ecmpcb.in',
        schemeDocumentUrl: 'https://ecmpcb.in/green-initiatives.pdf',
      },
    ];
  }

  /**
   * Evaluates statutory eligibility and calculates estimated financial subsidies
   * under Maharashtra Package Scheme of Incentives (PSI) and allied government policies.
   */
  public async checkEligibility(schemeId: string, profile: any): Promise<EligibilityResult> {
    const schemes = await this.getSchemes();
    const scheme = schemes.find(s => s.id === schemeId || s.code === schemeId) || schemes[0];

    const plant = Number(profile.investmentPlantMachinery || profile.investmentPlant || 0);
    const land = Number(profile.investmentLandBuilding || profile.investmentLand || 0);
    const totalInvestmentInr = plant + land;
    const totalInvLakhs = totalInvestmentInr / 100000;
    const district = (profile.district || '').toLowerCase();
    const talukaCategory = (profile.talukaCategory || 'C').toUpperCase();

    // 1. Determine Taluka Zone Subsidy Percentage under PSI 2019
    let zoneSubsidyPct = 40; // Default Zone C
    if (talukaCategory === 'A' || district.includes('mumbai') || (district.includes('pune') && district.includes('city'))) {
      zoneSubsidyPct = 0; // Zone A (Mumbai/Pune Core - no capital subsidy)
    } else if (talukaCategory === 'B') {
      zoneSubsidyPct = 30;
    } else if (talukaCategory === 'C') {
      zoneSubsidyPct = 40;
    } else if (talukaCategory === 'D') {
      zoneSubsidyPct = 50;
    } else if (talukaCategory === 'D+' || district.includes('nandurbar') || district.includes('gadchiroli') || district.includes('yavatmal')) {
      zoneSubsidyPct = 60;
    }

    // 2. Specific scheme evaluation
    if (scheme.code === 'PSI_2019' || scheme.id === 'sch-psi-2019') {
      const isEligible = zoneSubsidyPct > 0 && totalInvLakhs >= 25;
      const calculatedSubsidyLakhs = ((totalInvLakhs * zoneSubsidyPct) / 100).toFixed(2);
      const cappedSubsidyLakhs = Math.min(Number(calculatedSubsidyLakhs), 500.0).toFixed(2); // Capped at 5 Cr for MSME

      return {
        eligible: isEligible,
        schemeCode: scheme.code,
        schemeName: scheme.name,
        subsidyPercentage: zoneSubsidyPct,
        estimatedBenefit: isEligible
          ? `₹ ${cappedSubsidyLakhs} Lakhs (${zoneSubsidyPct}% Capital Subsidy under Maharashtra PSI 2019 Zone ${talukaCategory})`
          : 'Zone A location does not qualify for PSI Capital Subsidy. Stamp duty exemption remains applicable.',
        breakdown: {
          capitalSubsidy: isEligible ? `₹ ${cappedSubsidyLakhs} Lakhs` : 'Nil (Zone A)',
          powerSubsidy: zoneSubsidyPct >= 40 ? '₹ 1.20 per unit consumed for 36 months' : 'Eligible for 24 months',
          stampDutyExemption: '100% exemption on Land Lease Deed & Loan Hypothecation Agreement',
          interestSubvention: '5% interest subsidy on term loan for 5 years',
        },
        remarks: isEligible
          ? `Eligible under Maharashtra Industrial Policy 2019 for new manufacturing setup in ${profile.district || 'Pune'} (Taluka Zone ${talukaCategory}).`
          : 'Located in developed Zone A taluka; capital subsidy not applicable, but eligible for electricity duty rebate.',
      };
    }

    if (scheme.code === 'AMBEDKAR_SCHEME' || scheme.id === 'sch-ambedkar') {
      const isScSt = Boolean(profile.isScStOwner || profile.socialCategory === 'SC' || profile.socialCategory === 'ST');
      const subsidyPct = 50;
      const subsidyLakhs = ((totalInvLakhs * subsidyPct) / 100).toFixed(2);
      const capped = Math.min(Number(subsidyLakhs), 750.0).toFixed(2);

      return {
        eligible: isScSt,
        schemeCode: scheme.code,
        schemeName: scheme.name,
        subsidyPercentage: subsidyPct,
        estimatedBenefit: isScSt
          ? `₹ ${capped} Lakhs (50% Special Capital Subsidy for SC/ST Industrialists)`
          : 'Requires at least 51% shareholding by SC/ST entrepreneurs with valid Caste Certificate.',
        breakdown: {
          capitalSubsidy: isScSt ? `₹ ${capped} Lakhs` : 'Not eligible without SC/ST certificate',
          powerSubsidy: '₹ 2.00 per unit tariff concession for 5 years',
          stampDutyExemption: '100% waiver on land purchase/lease',
          interestSubvention: '100% interest subvention up to ₹ 10 Lakhs/annum for 5 years',
        },
        remarks: isScSt
          ? 'Eligible for special affirmative industrial benefits under Social Justice Dept resolution.'
          : 'Unit must demonstrate majority SC/ST ownership structure to unlock this scheme.',
      };
    }

    if (scheme.code === 'CMEGP' || scheme.id === 'sch-cmegp') {
      const isEligible = totalInvLakhs <= 50; // CMEGP ceiling
      const subsidyPct = profile.isWomanEntrepreneur || profile.socialCategory ? 35 : 25;
      const eligibleInv = Math.min(totalInvLakhs, 50);
      const subsidyLakhs = ((eligibleInv * subsidyPct) / 100).toFixed(2);

      return {
        eligible: isEligible,
        schemeCode: scheme.code,
        schemeName: scheme.name,
        subsidyPercentage: subsidyPct,
        estimatedBenefit: isEligible
          ? `₹ ${subsidyLakhs} Lakhs (${subsidyPct}% Margin Money Grant under CMEGP)`
          : 'Project cost exceeds ₹50 Lakhs limit for CMEGP. Recommend Package Scheme of Incentives (PSI 2019) instead.',
        breakdown: {
          capitalSubsidy: isEligible ? `₹ ${subsidyLakhs} Lakhs Margin Money` : 'Exceeds ceiling',
          powerSubsidy: 'Not applicable under CMEGP',
          stampDutyExemption: '50% stamp duty rebate via DIC',
          interestSubvention: 'Bank loan linked margin money',
        },
        remarks: isEligible
          ? 'Eligible for Chief Minister Employment Generation Programme startup grant with bank credit linkage.'
          : 'CMEGP is designed for micro startups up to ₹50 Lakhs. Your enterprise qualifies for PSI 2019.',
      };
    }

    if (scheme.code === 'GREEN_ENERGY_SUBSIDY' || scheme.id === 'sch-green-tech') {
      const hasZldOrEfl = profile.pollutionCategory === 'RED' || profile.pollutionCategory === 'ORANGE' || profile.effluentDischargeKld > 0;
      return {
        eligible: true,
        schemeCode: scheme.code,
        schemeName: scheme.name,
        subsidyPercentage: 30,
        estimatedBenefit: '₹ 25.0 Lakhs (30% Equipment Grant for ZLD & Rooftop Solar)',
        breakdown: {
          capitalSubsidy: '30% grant on ETP / ZLD / Solar capital cost',
          powerSubsidy: 'Net-metering green power tariff credit',
          stampDutyExemption: 'Not applicable',
          interestSubvention: '3% green tech interest subsidy via IREDA / SIDBI',
        },
        remarks: hasZldOrEfl
          ? 'Highly recommended: Your pollution category requires advanced effluent treatment; this grant directly offsets capital costs.'
          : 'Eligible upon installing certified renewable energy or water conservation infrastructure.',
      };
    }

    // Default / Power Tariff Concession
    return {
      eligible: true,
      schemeCode: scheme.code,
      schemeName: scheme.name,
      subsidyPercentage: 20,
      estimatedBenefit: 'Industrial Power Tariff Concession @ ₹1.20/unit consumed',
      breakdown: {
        capitalSubsidy: 'Operational revenue expenditure subsidy',
        powerSubsidy: '₹ 1.20 per unit consumed for 36 months via MSEDCL power bill credit',
        stampDutyExemption: 'Not applicable',
        interestSubvention: 'Not applicable',
      },
      remarks: 'Eligible for 36 months from date of commercial production under Maharashtra Industrial Policy.',
    };
  }

  /**
   * Matches all available schemes against a given business profile.
   */
  public async matchAllSchemes(profile: any) {
    const schemes = await this.getSchemes();
    const results = [];
    for (const scheme of schemes) {
      const evaluation = await this.checkEligibility(scheme.id, profile);
      results.push({
        ...scheme,
        evaluation,
        status: evaluation.eligible ? ('ELIGIBLE' as const) : ('CHECK_REQUIRED' as const),
      });
    }
    return results;
  }

  /**
   * Returns list of periodic post-establishment compliance obligations.
   */
  public async getCompliances(): Promise<ComplianceViewItem[]> {
    return [
      {
        id: 'comp-1',
        title: 'Quarterly Environmental Cess & Emission Return',
        approvalCode: 'MPCB-CTE-01',
        department: 'Maharashtra Pollution Control Board',
        statutoryAct: 'Water (Prevention & Control of Pollution) Cess Act',
        statutoryRule: 'Rule 14 of Environmental (Protection) Rules 1986',
        frequency: 'QUARTERLY',
        dueDate: '2026-03-31',
        nextDueDate: '2026-03-31',
        status: 'PENDING',
        penaltyClause: '₹ 10,000 fine + 18% p.a. interest on delayed assessment fees',
        submissionPortal: 'https://ecmpcb.in',
        reminderStatus: 'SENT',
      },
      {
        id: 'comp-2',
        title: 'Annual Factory Safety Audit Report Submission',
        approvalCode: 'DISH-PLN-02',
        department: 'Directorate of Industrial Safety & Health',
        statutoryAct: 'Factories Act 1948 - Section 41B',
        statutoryRule: 'Maharashtra Factories Rules 1963 Rule 106',
        frequency: 'ANNUAL',
        dueDate: '2026-04-30',
        nextDueDate: '2026-04-30',
        status: 'PENDING',
        penaltyClause: 'Show-cause notice and statutory stop-work directive under Section 92',
        submissionPortal: 'https://dish.maharashtra.gov.in',
        reminderStatus: 'PENDING',
      },
      {
        id: 'comp-3',
        title: 'Six-Monthly Hazardous Waste Disposal Manifesto (Form 10)',
        approvalCode: 'MPCB-CTE-01',
        department: 'Maharashtra Pollution Control Board',
        statutoryAct: 'Hazardous and Other Wastes Rules 2016',
        statutoryRule: 'Hazardous Waste Management Rules 2016 Rule 20',
        frequency: 'HALF_YEARLY',
        dueDate: '2026-06-30',
        nextDueDate: '2026-06-30',
        status: 'COMPLIANT',
        penaltyClause: 'Environmental compensation fine up to ₹ 1,00,000 per violation',
        submissionPortal: 'https://ecmpcb.in',
        reminderStatus: 'SENT',
      },
    ];
  }

  /**
   * Returns list of monitored licenses and statutory renewal deadlines.
   */
  public async getRenewals(): Promise<RenewalViewItem[]> {
    return [
      {
        id: 'ren-1',
        licenceName: 'Consent to Operate (Air & Water)',
        approvalName: 'Consent to Operate (CTO) - Air & Water Acts',
        issuingAuthority: 'Maharashtra Pollution Control Board',
        department: 'Maharashtra Pollution Control Board',
        licenceNumber: 'MPCB/RO-PUNE/CONSENT-10482',
        licenseNumber: 'MPCB/RO-PUNE/CONSENT-10482',
        validFrom: '2024-03-01',
        validUntil: '2027-02-28',
        expiryDate: '2027-02-28',
        status: 'VALID',
        daysRemaining: 337,
        renewalFee: '₹ 75,000',
        renewalWindowOpen: false,
      },
      {
        id: 'ren-2',
        licenceName: 'Factory License under Factories Act 1948',
        approvalName: 'DISH Factory License',
        issuingAuthority: 'Directorate of Industrial Safety & Health',
        department: 'Directorate of Industrial Safety & Health',
        licenceNumber: 'DISH-PUN-FACT-2024-9981',
        licenseNumber: 'DISH-PUN-FACT-2024-9981',
        validFrom: '2025-01-01',
        validUntil: '2026-04-15',
        expiryDate: '2026-04-15',
        status: 'DUE_SOON',
        daysRemaining: 19,
        renewalFee: '₹ 12,500',
        renewalWindowOpen: true,
      },
      {
        id: 'ren-3',
        licenceName: 'Annual Boiler Fitness Certificate',
        approvalName: 'Annual Boiler Fitness Certificate',
        issuingAuthority: 'Directorate of Steam Boilers',
        department: 'Directorate of Steam Boilers',
        licenceNumber: 'MH-BLR-PN-9921',
        licenseNumber: 'MH-BLR-PN-9921',
        validFrom: '2025-02-10',
        validUntil: '2026-02-09',
        expiryDate: '2026-02-09',
        status: 'OVERDUE',
        daysRemaining: -45,
        renewalFee: '₹ 8,000',
        renewalWindowOpen: true,
      },
    ];
  }
}

export const schemeService = new SchemeService();
