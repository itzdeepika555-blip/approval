import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting SIH26130 PostgreSQL Master Seeding ---');

  // 1. Departments Master (Government of Maharashtra)
  const departments = [
    {
      code: 'MPCB',
      name: 'Maharashtra Pollution Control Board',
      nameMarathi: 'महाराष्ट्र प्रदूषण नियंत्रण मंडळ',
      description: 'Statutory pollution consents (CTE/CTO) under Water and Air Acts',
      portalUrl: 'https://ecmpcb.in',
      nodalOfficerEmail: 'mpcb.support@maharashtra.gov.in',
      slaWorkingDays: 45,
    },
    {
      code: 'MIDC',
      name: 'Maharashtra Industrial Development Corporation',
      nameMarathi: 'महाराष्ट्र औद्योगिक विकास महामंडळ',
      description: 'Land allotment, building plan approvals and water connection in industrial estates',
      portalUrl: 'https://midcindia.org',
      nodalOfficerEmail: 'support@midcindia.org',
      slaWorkingDays: 30,
    },
    {
      code: 'DISH',
      name: 'Directorate of Industrial Safety and Health',
      nameMarathi: 'औद्योगिक सुरक्षा व आरोग्य संचालनालय',
      description: 'Factory registration and licensing under Factories Act 1948',
      portalUrl: 'https://dish.maharashtra.gov.in',
      nodalOfficerEmail: 'dish.helpdesk@maharashtra.gov.in',
      slaWorkingDays: 30,
    },
    {
      code: 'FIRE',
      name: 'Maharashtra Fire Services & Emergency Services',
      nameMarathi: 'महाराष्ट्र अग्निशमन सेवा',
      description: 'Provisional and Final Fire NOC for industrial buildings',
      portalUrl: 'https://nfs.mahafireservice.gov.in',
      nodalOfficerEmail: 'fire.noc@maharashtra.gov.in',
      slaWorkingDays: 21,
    },
    {
      code: 'MSEDCL',
      name: 'Maharashtra State Electricity Distribution Co. Ltd.',
      nameMarathi: 'महाराष्ट्र राज्य विद्युत वितरण कंपनी',
      description: 'HT/LT industrial power connection and load sanction',
      portalUrl: 'https://www.mahadiscom.in',
      nodalOfficerEmail: 'customercare@mahadiscom.in',
      slaWorkingDays: 15,
    },
    {
      code: 'REVENUE',
      name: 'Revenue and Forest Department',
      nameMarathi: 'महसूल व वन विभाग',
      description: 'Non-Agricultural (NA) Land Permission, 7/12 extract certification',
      portalUrl: 'https://mahabhumi.gov.in',
      nodalOfficerEmail: 'revenue.support@maharashtra.gov.in',
      slaWorkingDays: 45,
    },
    {
      code: 'LABOUR',
      name: 'Labour Department Government of Maharashtra',
      nameMarathi: 'कामगार विभाग महाराष्ट्र शासन',
      description: 'Shop & Establishment registration, Contract Labour license',
      portalUrl: 'https://mahakamgar.maharashtra.gov.in',
      nodalOfficerEmail: 'labour.commissioner@maharashtra.gov.in',
      slaWorkingDays: 15,
    },
    {
      code: 'CGWA',
      name: 'Central Ground Water Authority / MWRRA',
      nameMarathi: 'महाराष्ट्र जलसंपत्ती नियमन प्राधिकरण',
      description: 'NOC for industrial ground water extraction',
      portalUrl: 'https://mwrra.org',
      nodalOfficerEmail: 'groundwater.noc@maharashtra.gov.in',
      slaWorkingDays: 60,
    },
    {
      code: 'BOILER',
      name: 'Directorate of Steam Boilers Maharashtra',
      nameMarathi: 'बाष्पके संचालनालय',
      description: 'Registration and inspection of industrial steam boilers',
      portalUrl: 'https://boilers.maharashtra.gov.in',
      nodalOfficerEmail: 'boiler.inspector@maharashtra.gov.in',
      slaWorkingDays: 30,
    },
  ];

  const deptMap: Record<string, string> = {};

  for (const dept of departments) {
    const saved = await prisma.department.upsert({
      where: { code: dept.code },
      update: {
        name: dept.name,
        nameMarathi: dept.nameMarathi,
        description: dept.description,
        portalUrl: dept.portalUrl,
        nodalOfficerEmail: dept.nodalOfficerEmail,
        slaWorkingDays: dept.slaWorkingDays,
        isActive: true,
      },
      create: {
        code: dept.code,
        name: dept.name,
        nameMarathi: dept.nameMarathi,
        description: dept.description,
        portalUrl: dept.portalUrl,
        nodalOfficerEmail: dept.nodalOfficerEmail,
        slaWorkingDays: dept.slaWorkingDays,
        isActive: true,
      },
    });
    deptMap[dept.code] = saved.id;
  }
  console.log(`[Seed] Seeded ${departments.length} statutory departments.`);

  // 2. Approvals Master
  const approvals = [
    {
      approvalCode: 'MPCB_CTE',
      departmentCode: 'MPCB',
      name: 'Consent to Establish (CTE)',
      nameMarathi: 'स्थापनेसाठी संमती',
      stage: 'PRE_ESTABLISHMENT' as const,
      category: 'NOC',
      description: 'Statutory consent before constructing or installing plant and machinery',
      statutoryAct: 'Water Act 1974, Air Act 1981',
      statutoryTimelineDays: 45,
      validityPeriodMonths: 60,
      renewalRequired: false,
      requiredDocCodes: ['DOC_PAN', 'DOC_PROJECT_REPORT', 'DOC_SITE_PLAN', 'DOC_POLLUTION_SCHEME'],
      feeStructureDetails: 'Tiered based on capital investment (Rs. 5,000 to Rs. 5,00,000)',
      externalPortalLink: 'https://ecmpcb.in',
    },
    {
      approvalCode: 'MPCB_CTO',
      departmentCode: 'MPCB',
      name: 'Consent to Operate (CTO)',
      nameMarathi: 'चालू करण्यासाठी संमती',
      stage: 'PRE_OPERATION' as const,
      category: 'LICENCE',
      description: 'Mandatory consent to commence commercial production',
      statutoryAct: 'Water Act 1974, Air Act 1981',
      statutoryTimelineDays: 45,
      validityPeriodMonths: 36,
      renewalRequired: true,
      requiredDocCodes: ['DOC_CTE_COPY', 'DOC_COMPLIANCE_REPORT', 'DOC_ETP_PHOTOGRAPHS', 'DOC_RAW_MATERIAL_DETAILS'],
      feeStructureDetails: 'Tiered based on capital investment',
      externalPortalLink: 'https://ecmpcb.in',
    },
    {
      approvalCode: 'DISH_FACT_LIC',
      departmentCode: 'DISH',
      name: 'Factory Registration and License',
      nameMarathi: 'कारखाना नोंदणी व परवाना',
      stage: 'PRE_OPERATION' as const,
      category: 'LICENCE',
      description: 'Registration and license to operate industrial factory premises',
      statutoryAct: 'Factories Act 1948 Section 6',
      statutoryTimelineDays: 30,
      validityPeriodMonths: 12,
      renewalRequired: true,
      requiredDocCodes: ['DOC_SITE_PLAN', 'DOC_STABILITY_CERTIFICATE', 'DOC_FLOW_CHART', 'DOC_DIRECTOR_LIST'],
      feeStructureDetails: 'Based on number of workers and installed BHP',
      externalPortalLink: 'https://dish.maharashtra.gov.in',
    },
    {
      approvalCode: 'FIRE_PROVISIONAL_NOC',
      departmentCode: 'FIRE',
      name: 'Provisional Fire Safety NOC',
      nameMarathi: 'तात्पुरता अग्निशामक ना हरकत दाखला',
      stage: 'PRE_ESTABLISHMENT' as const,
      category: 'NOC',
      description: 'Preliminary clearance of building architectural plans from fire safety angle',
      statutoryAct: 'Maharashtra Fire Prevention and Life Safety Measures Act 2006',
      statutoryTimelineDays: 21,
      validityPeriodMonths: 12,
      renewalRequired: false,
      requiredDocCodes: ['DOC_ARCHITECTURAL_DRAWING', 'DOC_7_12', 'DOC_SITE_LAYOUT'],
      feeStructureDetails: 'Based on built-up area (Rs. 10/sqm)',
      externalPortalLink: 'https://nfs.mahafireservice.gov.in',
    },
    {
      approvalCode: 'FIRE_FINAL_NOC',
      departmentCode: 'FIRE',
      name: 'Final Fire Safety NOC',
      nameMarathi: 'अंतिम अग्निशामक ना हरकत दाखला',
      stage: 'PRE_OPERATION' as const,
      category: 'NOC',
      description: 'Final inspection and compliance certificate for fire safety installations',
      statutoryAct: 'Maharashtra Fire Prevention and Life Safety Measures Act 2006',
      statutoryTimelineDays: 21,
      validityPeriodMonths: 12,
      renewalRequired: true,
      requiredDocCodes: ['DOC_PROVISIONAL_FIRE_NOC', 'DOC_FORM_A', 'DOC_FIRE_EQUIPMENT_TEST_REPORT'],
      feeStructureDetails: 'Nil after initial compliance scrutiny',
      externalPortalLink: 'https://nfs.mahafireservice.gov.in',
    },
    {
      approvalCode: 'MIDC_BLDG_PLAN',
      departmentCode: 'MIDC',
      name: 'Building Plan Approval & Commencement Certificate',
      nameMarathi: 'इमारत आराखडा मंजुरी आणि प्रारंभ प्रमाणपत्र',
      stage: 'PRE_ESTABLISHMENT' as const,
      category: 'PERMISSION',
      description: 'Sanction of factory building blueprints within MIDC industrial area',
      statutoryAct: 'MIDC Development Control Regulations',
      statutoryTimelineDays: 30,
      validityPeriodMonths: 36,
      renewalRequired: false,
      requiredDocCodes: ['DOC_LAND_ALLOTMENT_LETTER', 'DOC_STRUCTURAL_DRAWING', 'DOC_SOIL_INVESTIGATION'],
      feeStructureDetails: 'As per MIDC schedule of rates',
      externalPortalLink: 'https://midcindia.org',
    },
    {
      approvalCode: 'REVENUE_NA_PERM',
      departmentCode: 'REVENUE',
      name: 'Non-Agricultural (NA) Land Conversion',
      nameMarathi: 'अकृषिक (NA) जमीन परवानगी',
      stage: 'PRE_ESTABLISHMENT' as const,
      category: 'PERMISSION',
      description: 'Permission to convert agricultural land parcel into industrial usage',
      statutoryAct: 'Maharashtra Land Revenue Code 1966',
      statutoryTimelineDays: 45,
      validityPeriodMonths: null,
      renewalRequired: false,
      requiredDocCodes: ['DOC_7_12', 'DOC_ZONE_CERTIFICATE', 'DOC_TILR_MEASUREMENT_PLAN'],
      feeStructureDetails: 'Conversion tax as per collector rate',
      externalPortalLink: 'https://mahabhumi.gov.in',
    },
    {
      approvalCode: 'MSEDCL_HT_CONNECTION',
      departmentCode: 'MSEDCL',
      name: 'High Tension (HT) Industrial Power Sanction',
      nameMarathi: 'उच्च दाब औद्योगिक वीज जोडणी',
      stage: 'PRE_OPERATION' as const,
      category: 'PERMISSION',
      description: 'Load sanction and grid connectivity for high voltage industrial supply',
      statutoryAct: 'Electricity Act 2003',
      statutoryTimelineDays: 15,
      validityPeriodMonths: null,
      renewalRequired: false,
      requiredDocCodes: ['DOC_OWNERSHIP_PROOF', 'DOC_LOAD_CALCULATION', 'DOC_ELECTRICAL_INSPECTOR_CLEARANCE'],
      feeStructureDetails: 'Security deposit + Service line charges',
      externalPortalLink: 'https://www.mahadiscom.in',
    },
    {
      approvalCode: 'CGWA_GW_NOC',
      departmentCode: 'CGWA',
      name: 'Groundwater Abstraction NOC',
      nameMarathi: 'भूजल उपसा ना हरकत प्रमाणपत्र',
      stage: 'PRE_ESTABLISHMENT' as const,
      category: 'NOC',
      description: 'Permission for extraction of groundwater for industrial consumption',
      statutoryAct: 'MWRRA / CGWA Guidelines 2020',
      statutoryTimelineDays: 60,
      validityPeriodMonths: 24,
      renewalRequired: true,
      requiredDocCodes: ['DOC_HYDROGEOLOGICAL_REPORT', 'DOC_WATER_AUDIT_REPORT', 'DOC_RAINWATER_HARVESTING_PLAN'],
      feeStructureDetails: 'Regulatory fee based on daily KLD drawal',
      externalPortalLink: 'https://mwrra.org',
    },
    {
      approvalCode: 'BOILER_REG',
      departmentCode: 'BOILER',
      name: 'Boiler Registration & Inspection',
      nameMarathi: 'बाष्पक नोंदणी व तपासणी',
      stage: 'PRE_OPERATION' as const,
      category: 'REGISTRATION',
      description: 'Statutory registration and inspection certificate for steam boiler',
      statutoryAct: 'Indian Boilers Act 1923',
      statutoryTimelineDays: 30,
      validityPeriodMonths: 12,
      renewalRequired: true,
      requiredDocCodes: ['DOC_BOILER_MAKER_CERTIFICATE', 'DOC_PIPE_LAYOUT', 'DOC_WELDER_CERTIFICATE'],
      feeStructureDetails: 'Based on heating surface area in sq meters',
      externalPortalLink: 'https://boilers.maharashtra.gov.in',
    },
  ];

  const approvalMap: Record<string, string> = {};

  for (const appr of approvals) {
    const departmentId = deptMap[appr.departmentCode];
    if (!departmentId) continue;

    const saved = await prisma.approval.upsert({
      where: { approvalCode: appr.approvalCode },
      update: {
        departmentId,
        name: appr.name,
        nameMarathi: appr.nameMarathi,
        stage: appr.stage,
        category: appr.category,
        description: appr.description,
        statutoryAct: appr.statutoryAct,
        statutoryTimelineDays: appr.statutoryTimelineDays,
        validityPeriodMonths: appr.validityPeriodMonths,
        renewalRequired: appr.renewalRequired,
        requiredDocCodes: appr.requiredDocCodes,
        feeStructureDetails: appr.feeStructureDetails,
        externalPortalLink: appr.externalPortalLink,
        isActive: true,
      },
      create: {
        approvalCode: appr.approvalCode,
        departmentId,
        name: appr.name,
        nameMarathi: appr.nameMarathi,
        stage: appr.stage,
        category: appr.category,
        description: appr.description,
        statutoryAct: appr.statutoryAct,
        statutoryTimelineDays: appr.statutoryTimelineDays,
        validityPeriodMonths: appr.validityPeriodMonths,
        renewalRequired: appr.renewalRequired,
        requiredDocCodes: appr.requiredDocCodes,
        feeStructureDetails: appr.feeStructureDetails,
        externalPortalLink: appr.externalPortalLink,
        isActive: true,
      },
    });
    approvalMap[appr.approvalCode] = saved.id;
  }
  console.log(`[Seed] Seeded ${approvals.length} statutory approvals.`);

  // 3. Approval Rules Master
  const rules = [
    {
      ruleCode: 'RULE_MPCB_CTE',
      approvalCode: 'MPCB_CTE',
      ruleName: 'Mandatory CTE for Polluting Sectors',
      priority: 10,
      conditionsJson: { field: 'pollutionCategory', operator: 'in', value: ['RED', 'ORANGE', 'GREEN'] },
      explanationTpl: 'Your industrial unit is classified under the {pollutionCategory} category by MPCB, mandating a Consent to Establish prior to any physical construction or machine installation under Section 25 of the Water Act 1974.',
    },
    {
      ruleCode: 'RULE_MPCB_CTO',
      approvalCode: 'MPCB_CTO',
      ruleName: 'Mandatory CTO Prior to Commercial Production',
      priority: 10,
      conditionsJson: { field: 'pollutionCategory', operator: 'in', value: ['RED', 'ORANGE', 'GREEN'] },
      explanationTpl: 'With your plant classified under {pollutionCategory} category, commercial manufacturing cannot commence without an operational environmental license (CTO).',
    },
    {
      ruleCode: 'RULE_DISH_FACTORY',
      approvalCode: 'DISH_FACT_LIC',
      ruleName: 'Factories Act Threshold Rule',
      priority: 20,
      conditionsJson: { and: [{ field: 'employeeCount', operator: '>=', value: 10 }, { field: 'powerRequirementKva', operator: '>', value: 0 }] },
      explanationTpl: 'Your enterprise employs {employeeCount} workers and utilizes electric power, fulfilling the statutory definition of a factory under Section 2(m)(i) of the Factories Act, 1948.',
    },
    {
      ruleCode: 'RULE_FIRE_NOC_AREA',
      approvalCode: 'FIRE_PROVISIONAL_NOC',
      ruleName: 'Fire Safety Clearance by Area/Sector',
      priority: 30,
      conditionsJson: { or: [{ field: 'builtUpAreaSqm', operator: '>=', value: 500 }, { field: 'pollutionCategory', operator: 'in', value: ['RED', 'ORANGE'] }] },
      explanationTpl: 'Your proposed built-up area of {builtUpAreaSqm} sq.m and {pollutionCategory} risk category mandates prior architectural review and Fire NOC under the Maharashtra Fire Prevention Act.',
    },
    {
      ruleCode: 'RULE_MIDC_PLAN',
      approvalCode: 'MIDC_BLDG_PLAN',
      ruleName: 'MIDC Industrial Estate Building Clearance',
      priority: 15,
      conditionsJson: { field: 'isMidcArea', operator: '==', value: true },
      explanationTpl: 'Since your industrial plot is located within an MIDC industrial estate ({midcEstateName}), building blueprint approval and commencement certificate must be obtained directly from MIDC Special Planning Authority (SPA).',
    },
    {
      ruleCode: 'RULE_REVENUE_NA',
      approvalCode: 'REVENUE_NA_PERM',
      ruleName: 'Non-Agricultural Conversion for Non-MIDC Private Land',
      priority: 15,
      conditionsJson: { field: 'isMidcArea', operator: '==', value: false },
      explanationTpl: 'Your proposed setup is on private land outside MIDC territory, requiring statutory land use conversion to Non-Agricultural (Industrial) under Section 44 of Maharashtra Land Revenue Code 1966.',
    },
    {
      ruleCode: 'RULE_MSEDCL_HT',
      approvalCode: 'MSEDCL_HT_CONNECTION',
      ruleName: 'High Voltage Load Sanction',
      priority: 25,
      conditionsJson: { field: 'powerRequirementKva', operator: '>=', value: 100 },
      explanationTpl: 'Your sanctioned power demand is {powerRequirementKva} kVA (>= 100 kVA), requiring a High Tension (HT 11kV/22kV/33kV) connection agreement with MSEDCL.',
    },
    {
      ruleCode: 'RULE_CGWA_GW',
      approvalCode: 'CGWA_GW_NOC',
      ruleName: 'Industrial Groundwater Abstraction Clearance',
      priority: 20,
      conditionsJson: { and: [{ field: 'waterSource', operator: '==', value: 'GROUNDWATER' }, { field: 'waterRequirementKld', operator: '>', value: 10 }] },
      explanationTpl: 'Drawing {waterRequirementKld} KLD of groundwater for commercial or industrial operations requires mandatory abstraction NOC from MWRRA / Central Ground Water Authority.',
    },
    {
      ruleCode: 'RULE_BOILER_REG',
      approvalCode: 'BOILER_REG',
      ruleName: 'Steam Boiler Safety Certification',
      priority: 20,
      conditionsJson: { field: 'hasBoiler', operator: '==', value: true },
      explanationTpl: 'Your facility utilizes an industrial steam boiler (capacity {boilerCapacityTph} TPH), requiring inspection, hydraulic testing, and statutory registration under the Indian Boilers Act, 1923.',
    },
  ];

  for (const rule of rules) {
    const approvalId = approvalMap[rule.approvalCode];
    if (!approvalId) continue;

    await prisma.approvalRule.upsert({
      where: { ruleCode: rule.ruleCode },
      update: {
        approvalId,
        ruleName: rule.ruleName,
        priority: rule.priority,
        conditionsJson: rule.conditionsJson,
        explanationTpl: rule.explanationTpl,
        isActive: true,
      },
      create: {
        ruleCode: rule.ruleCode,
        approvalId,
        ruleName: rule.ruleName,
        priority: rule.priority,
        conditionsJson: rule.conditionsJson,
        explanationTpl: rule.explanationTpl,
        isActive: true,
      },
    });
  }
  console.log(`[Seed] Seeded ${rules.length} statutory approval evaluation rules.`);

  // 4. Schemes & Incentives Master
  const schemes = [
    {
      schemeCode: 'PSI_2019',
      schemeName: 'Package Scheme of Incentives (PSI 2019)',
      eligibleSectors: ['Automobile', 'Engineering', 'Textiles', 'Electronics', 'Chemicals', 'Food Processing'],
      eligibleDistricts: ['Pune', 'Aurangabad', 'Nagpur', 'Nashik', 'Solapur', 'Kolhapur'],
      minInvestment: 2500000,
      maxInvestment: 500000000,
      subsidyPercentage: 40.0,
      benefitsDescription: 'Comprehensive financial support for MSMEs and Large units investing in developing industrial zones of Maharashtra (Zones B, C, D, D+). Capital subsidy up to 40%-80% of Eligible Capital Investment.',
      eligibilityCriteriaJson: { minInvestment: 2500000, zones: ['B', 'C', 'D', 'D+'] },
      policyReference: 'Maharashtra Industrial Policy 2019',
      applicationUrl: 'https://mahaindustries.gov.in',
    },
    {
      schemeCode: 'AMBEDKAR_SCHEME',
      schemeName: 'Dr. Babasaheb Ambedkar Special Scheme for SC/ST Entrepreneurs',
      eligibleSectors: ['Manufacturing', 'Service Enterprises', 'IT'],
      eligibleDistricts: ['All Districts of Maharashtra'],
      minInvestment: 1000000,
      maxInvestment: 20000000,
      subsidyPercentage: 30.0,
      benefitsDescription: 'Enhanced capital subsidy, margin money assistance, and concessional electricity tariffs for SC/ST owned enterprises.',
      eligibilityCriteriaJson: { scStOwnershipPct: 51 },
      policyReference: 'Social Justice & Industry Department Resolution 2021',
      applicationUrl: 'https://mahaindustries.gov.in',
    },
    {
      schemeCode: 'CMEGP',
      schemeName: 'Chief Minister Employment Generation Programme (CMEGP)',
      eligibleSectors: ['Manufacturing', 'Service Enterprises', 'Agro-processing'],
      eligibleDistricts: ['All 36 Districts of Maharashtra'],
      minInvestment: 500000,
      maxInvestment: 5000000,
      subsidyPercentage: 25.0,
      benefitsDescription: 'Financial assistance and project loan subsidy to promote manufacturing and service sector startups across all 36 districts.',
      eligibilityCriteriaJson: { ageMin: 18, ageMax: 45 },
      policyReference: 'Directorate of Industries & KVIC',
      applicationUrl: 'https://maha-cmegp.gov.in',
    },
    {
      schemeCode: 'GREEN_ENERGY_SUBSIDY',
      schemeName: 'Green Energy & Effluent Treatment Subsidy',
      eligibleSectors: ['Units installing Zero Liquid Discharge (ZLD) ETP or Rooftop Solar'],
      eligibleDistricts: ['All Districts of Maharashtra'],
      minInvestment: 1000000,
      maxInvestment: 10000000,
      subsidyPercentage: 50.0,
      benefitsDescription: 'Special subsidy for setting up Zero Liquid Discharge (ZLD) plants, solar rooftops, and energy conservation equipment.',
      eligibilityCriteriaJson: { requiresMpcbConsent: true },
      policyReference: 'Environment & Climate Change Dept / MPCB Guidelines',
      applicationUrl: 'https://ecmpcb.in',
    },
  ];

  for (const sch of schemes) {
    await prisma.scheme.upsert({
      where: { schemeCode: sch.schemeCode },
      update: {
        schemeName: sch.schemeName,
        eligibleSectors: sch.eligibleSectors,
        eligibleDistricts: sch.eligibleDistricts,
        minInvestment: sch.minInvestment,
        maxInvestment: sch.maxInvestment,
        subsidyPercentage: sch.subsidyPercentage,
        benefitsDescription: sch.benefitsDescription,
        eligibilityCriteriaJson: sch.eligibilityCriteriaJson,
        policyReference: sch.policyReference,
        applicationUrl: sch.applicationUrl,
        isActive: true,
      },
      create: {
        schemeCode: sch.schemeCode,
        schemeName: sch.schemeName,
        eligibleSectors: sch.eligibleSectors,
        eligibleDistricts: sch.eligibleDistricts,
        minInvestment: sch.minInvestment,
        maxInvestment: sch.maxInvestment,
        subsidyPercentage: sch.subsidyPercentage,
        benefitsDescription: sch.benefitsDescription,
        eligibilityCriteriaJson: sch.eligibilityCriteriaJson,
        policyReference: sch.policyReference,
        applicationUrl: sch.applicationUrl,
        isActive: true,
      },
    });
  }
  console.log(`[Seed] Seeded ${schemes.length} statutory incentive schemes.`);

  // 5. Official Staff Accounts (Officer and Admin for verification/governance)
  const salt = await bcrypt.genSalt(10);
  const mpcbDeptId = deptMap['MPCB'];

  // Officer Account
  const officerEmail = 'officer@mpcb.gov.in';
  await prisma.user.upsert({
    where: { email: officerEmail },
    update: {
      fullName: 'Dr. Rahul Deshmukh',
      phone: '9822054321',
      role: 'OFFICER',
      isActive: true,
      departmentId: mpcbDeptId || null,
      designation: 'Sub-Regional Scrutiny Officer',
    },
    create: {
      email: officerEmail,
      passwordHash: await bcrypt.hash('Officer@1234', salt),
      fullName: 'Dr. Rahul Deshmukh',
      phone: '9822054321',
      role: 'OFFICER',
      isActive: true,
      departmentId: mpcbDeptId || null,
      designation: 'Sub-Regional Scrutiny Officer',
    },
  });
  console.log('[Seed] Seeded Officer account: officer@mpcb.gov.in');

  // Admin Account
  const adminEmail = 'admin@maha.gov.in';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'Pooja Patil',
      phone: '9822099999',
      role: 'ADMIN',
      isActive: true,
      designation: 'Director of Industry Operations',
    },
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash('Admin@1234', salt),
      fullName: 'Pooja Patil',
      phone: '9822099999',
      role: 'ADMIN',
      isActive: true,
      designation: 'Director of Industry Operations',
    },
  });
  console.log('[Seed] Seeded Admin account: admin@maha.gov.in');

  console.log('--- Master Seeding Complete. Zero mock citizen/application data created! ---');
}

main()
  .catch((e) => {
    console.error('Master seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
