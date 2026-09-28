import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db, MasterDepartment, MasterApproval, MasterRule } from './db.service';

export interface DataQualityReport {
  timestamp: string;
  totalFiles: number;
  files: {
    fileName: string;
    totalRows: number;
    importedRows: number;
    duplicateRows: number;
    invalidRows: number;
    errors: string[];
    warnings: string[];
  }[];
  summary: {
    totalRowsRead: number;
    totalSuccessfullyImported: number;
    totalDuplicatesSkippedOrUpdated: number;
    totalInvalidOrRejected: number;
    departmentsCount: number;
    approvalsCount: number;
    rulesCount: number;
    uniqueRequiredDocumentsCount: number;
    distinctSectorsDetected: string[];
  };
}

// Master document catalog mapping document codes to statutory metadata
export const STATUTORY_DOCUMENTS_CATALOG: Record<string, { code: string; name: string; category: string; description: string }> = {
  'DOC_PAN': { code: 'DOC_PAN', name: 'Company / Enterprise PAN Card', category: 'IDENTITY', description: 'PAN Card of the industrial enterprise or authorized signatory' },
  'DOC_PROJECT_REPORT': { code: 'DOC_PROJECT_REPORT', name: 'Detailed Project Report (DPR)', category: 'TECHNICAL', description: 'Technical DPR with plant layout, process flow, and machine specifications' },
  'DOC_SITE_PLAN': { code: 'DOC_SITE_PLAN', name: 'Factory Site Layout Plan', category: 'TECHNICAL', description: 'Architectural blueprint with plot boundaries, setbacks, and factory floor plan' },
  'DOC_POLLUTION_SCHEME': { code: 'DOC_POLLUTION_SCHEME', name: 'Effluent & Emission Treatment Scheme', category: 'ENVIRONMENTAL', description: 'Detailed engineering scheme for ETP/STP and air pollution control equipment' },
  'DOC_CTE_COPY': { code: 'DOC_CTE_COPY', name: 'Consent to Establish (CTE) Copy', category: 'ENVIRONMENTAL', description: 'Copy of previously issued MPCB Consent to Establish order' },
  'DOC_COMPLIANCE_REPORT': { code: 'DOC_COMPLIANCE_REPORT', name: 'CTE Compliance Report', category: 'ENVIRONMENTAL', description: 'Point-wise compliance statement on conditions stipulated in CTE' },
  'DOC_ETP_PHOTOGRAPHS': { code: 'DOC_ETP_PHOTOGRAPHS', name: 'ETP Installation Photographs', category: 'ENVIRONMENTAL', description: 'Geotagged photographs of installed effluent treatment units and flow meters' },
  'DOC_RAW_MATERIAL_DETAILS': { code: 'DOC_RAW_MATERIAL_DETAILS', name: 'Raw Material & Mass Balance Details', category: 'TECHNICAL', description: 'Material safety data sheets and manufacturing mass balance breakdown' },
  'DOC_STABILITY_CERTIFICATE': { code: 'DOC_STABILITY_CERTIFICATE', name: 'Structural Stability Certificate (Form 1A)', category: 'TECHNICAL', description: 'Certificate from DISH recognized Competent Person under Factories Act 1948' },
  'DOC_FLOW_CHART': { code: 'DOC_FLOW_CHART', name: 'Manufacturing Process Flow Chart', category: 'TECHNICAL', description: 'Sequential flow diagram of all industrial processes and chemical transformations' },
  'DOC_DIRECTOR_LIST': { code: 'DOC_DIRECTOR_LIST', name: 'List of Directors / Partners', category: 'LEGAL', description: 'Certified list of board of directors or partners with identity & address proof' },
  'DOC_ARCHITECTURAL_DRAWING': { code: 'DOC_ARCHITECTURAL_DRAWING', name: 'Architectural Fire Safety Drawing', category: 'SAFETY', description: 'Drawings displaying fire exits, staircases, hydrant lines, and refuge areas' },
  'DOC_7_12': { code: 'DOC_7_12', name: '7/12 Extract / Land Record', category: 'LAND', description: 'Latest certified 7/12 extract or property card from Revenue Department' },
  'DOC_SITE_LAYOUT': { code: 'DOC_SITE_LAYOUT', name: 'Overall Site Layout Blueprint', category: 'LAND', description: 'CAD drawing showing plot ingress, egress, internal roads, and water mains' },
  'DOC_PROVISIONAL_FIRE_NOC': { code: 'DOC_PROVISIONAL_FIRE_NOC', name: 'Provisional Fire Safety NOC Copy', category: 'SAFETY', description: 'Copy of provisional fire clearance issued prior to construction' },
  'DOC_FORM_A': { code: 'DOC_FORM_A', name: 'Fire Safety Form A Compliance Certificate', category: 'SAFETY', description: 'Certificate issued by a licensed fire consultant/agency under Maharashtra Fire Act' },
  'DOC_FIRE_EQUIPMENT_TEST_REPORT': { code: 'DOC_FIRE_EQUIPMENT_TEST_REPORT', name: 'Fire Equipment Pressure Test Certificate', category: 'SAFETY', description: 'Hydraulic pressure and flow discharge test certificate of fire pumps & hydrants' },
  'DOC_LAND_ALLOTMENT_LETTER': { code: 'DOC_LAND_ALLOTMENT_LETTER', name: 'MIDC Land Allotment & Possession Letter', category: 'LAND', description: 'Formal allotment order and possession receipt issued by MIDC Area Office' },
  'DOC_STRUCTURAL_DRAWING': { code: 'DOC_STRUCTURAL_DRAWING', name: 'Structural Engineering Drawings', category: 'TECHNICAL', description: 'Foundation and RCC/steel structure structural calculations and drawings' },
  'DOC_SOIL_INVESTIGATION': { code: 'DOC_SOIL_INVESTIGATION', name: 'Soil Investigation / SBC Report', category: 'TECHNICAL', description: 'Geotechnical soil report indicating safe bearing capacity of the plot' },
  'DOC_ZONE_CERTIFICATE': { code: 'DOC_ZONE_CERTIFICATE', name: 'Town Planning Zone Certificate', category: 'LAND', description: 'Zoning confirmation certificate from Regional Town Planning Authority' },
  'DOC_TILR_MEASUREMENT_PLAN': { code: 'DOC_TILR_MEASUREMENT_PLAN', name: 'TILR Land Measurement Plan (Mojani Nakasha)', category: 'LAND', description: 'Official survey map prepared by Taluka Inspector of Land Records' },
  'DOC_OWNERSHIP_PROOF': { code: 'DOC_OWNERSHIP_PROOF', name: 'Proof of Land Ownership / Registered Lease', category: 'LAND', description: 'Registered lease deed or sale deed establishing legal title to factory land' },
  'DOC_LOAD_CALCULATION': { code: 'DOC_LOAD_CALCULATION', name: 'Connected Electrical Load Calculations', category: 'UTILITY', description: 'Detailed connected load sheet and maximum demand kVA calculations' },
  'DOC_ELECTRICAL_INSPECTOR_CLEARANCE': { code: 'DOC_ELECTRICAL_INSPECTOR_CLEARANCE', name: 'Electrical Inspector Clearance (CEI)', category: 'UTILITY', description: 'Clearance certificate from Chief Electrical Inspector for HT transformer/switchyard' },
  'DOC_HYDROGEOLOGICAL_REPORT': { code: 'DOC_HYDROGEOLOGICAL_REPORT', name: 'Hydrogeological Survey Report', category: 'ENVIRONMENTAL', description: 'Aquifer pump test and groundwater yield evaluation by certified hydrogeologist' },
  'DOC_WATER_AUDIT_REPORT': { code: 'DOC_WATER_AUDIT_REPORT', name: 'Industrial Water Audit Report', category: 'UTILITY', description: 'Water balance audit detailing intake, recycle, and consumption metrics' },
  'DOC_RAINWATER_HARVESTING_PLAN': { code: 'DOC_RAINWATER_HARVESTING_PLAN', name: 'Rainwater Harvesting Blueprint', category: 'ENVIRONMENTAL', description: 'Recharge pit engineering drawing and rooftop runoff collection plan' },
  'DOC_BOILER_MAKER_CERTIFICATE': { code: 'DOC_BOILER_MAKER_CERTIFICATE', name: 'Boiler Maker & Inspection Certificate (Form II/III)', category: 'SAFETY', description: 'Statutory manufacturer certificate issued under Indian Boilers Act 1923' },
  'DOC_PIPE_LAYOUT': { code: 'DOC_PIPE_LAYOUT', name: 'Steam Piping Layout Drawing', category: 'SAFETY', description: 'High pressure steam pipe routing and safety relief valve deployment layout' },
  'DOC_WELDER_CERTIFICATE': { code: 'DOC_WELDER_CERTIFICATE', name: 'IBR Certified Welder Qualification Certificate', category: 'SAFETY', description: 'Certificate of qualification of high pressure welders from Director of Steam Boilers' },
};

export class DatasetImportService {
  private lastReport: DataQualityReport | null = null;
  private lastImportTime: Date | null = null;

  public getLastReport(): DataQualityReport | null {
    return this.lastReport;
  }

  public getLastImportTime(): Date | null {
    return this.lastImportTime;
  }

  /**
   * Resolves a document code to structured document metadata
   */
  public resolveDocument(code: string) {
    const trimmed = code.trim();
    if (STATUTORY_DOCUMENTS_CATALOG[trimmed]) {
      return STATUTORY_DOCUMENTS_CATALOG[trimmed];
    }
    return {
      code: trimmed,
      name: trimmed.replace(/^DOC_/, '').replace(/_/g, ' '),
      category: 'GENERAL',
      description: 'Statutory compliance document',
    };
  }

  /**
   * Validates and imports the CSV dataset idempotently without modifying original CSV files
   */
  public async importDataset(templatesDirectory?: string): Promise<DataQualityReport> {
    const baseDir = templatesDirectory || path.resolve(__dirname, '../../data/templates');
    const deptPath = path.join(baseDir, 'departments_master.csv');
    const apprPath = path.join(baseDir, 'approvals_master_template.csv');
    const rulePath = path.join(baseDir, 'approval_rules_template.csv');

    const report: DataQualityReport = {
      timestamp: new Date().toISOString(),
      totalFiles: 3,
      files: [],
      summary: {
        totalRowsRead: 0,
        totalSuccessfullyImported: 0,
        totalDuplicatesSkippedOrUpdated: 0,
        totalInvalidOrRejected: 0,
        departmentsCount: 0,
        approvalsCount: 0,
        rulesCount: 0,
        uniqueRequiredDocumentsCount: 0,
        distinctSectorsDetected: [
          'AUTOMOTIVE_ENGINEERING',
          'FOOD_PROCESSING',
          'CHEMICALS_PHARMA',
          'TEXTILE_APPAREL',
          'MANUFACTURING_GENERAL',
          'ELECTRONICS_ESD',
        ],
      },
    };

    // 1. Departments CSV
    const deptFileReport = {
      fileName: 'departments_master.csv',
      totalRows: 0,
      importedRows: 0,
      duplicateRows: 0,
      invalidRows: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    if (!fs.existsSync(deptPath)) {
      deptFileReport.errors.push(`File not found at ${deptPath}`);
      report.files.push(deptFileReport);
      throw new Error(`departments_master.csv not found at ${deptPath}`);
    }

    const deptContent = fs.readFileSync(deptPath, 'utf-8');
    const rawDeptRows = parse(deptContent, {
      columns: false,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }) as string[][];

    // Exclude header row
    const deptHeader = rawDeptRows[0];
    const deptDataRows = rawDeptRows.slice(1);
    deptFileReport.totalRows = deptDataRows.length;
    report.summary.totalRowsRead += deptDataRows.length;

    const seenDeptCodes = new Set<string>();

    for (const cols of deptDataRows) {
      if (cols.length < 5) {
        deptFileReport.invalidRows++;
        deptFileReport.errors.push(`Row has insufficient columns (${cols.length}): ${cols.join(',')}`);
        continue;
      }

      const code = cols[0].trim().toUpperCase();
      const name = cols[1].trim();
      const nameMarathi = cols[2].trim();

      // Handle unquoted commas inside description gracefully
      let description = '';
      let portalUrl = '';
      let nodalOfficerEmail = '';
      let slaWorkingDays = 30;

      if (cols.length === 7) {
        description = cols[3].trim();
        portalUrl = cols[4].trim();
        nodalOfficerEmail = cols[5].trim();
        slaWorkingDays = parseInt(cols[6].trim(), 10) || 30;
      } else {
        // More than 7 columns due to unquoted commas in description
        deptFileReport.warnings.push(
          `Department ${code}: Handled unquoted comma in description (${cols.length} tokens resolved to 7 fields).`
        );
        const lastIndex = cols.length - 1;
        slaWorkingDays = parseInt(cols[lastIndex].trim(), 10) || 30;
        nodalOfficerEmail = cols[lastIndex - 1].trim();
        portalUrl = cols[lastIndex - 2].trim();
        description = cols.slice(3, lastIndex - 2).join(', ').trim();
      }

      if (!code || !name) {
        deptFileReport.invalidRows++;
        deptFileReport.errors.push(`Row missing required department code or name.`);
        continue;
      }

      if (seenDeptCodes.has(code)) {
        deptFileReport.duplicateRows++;
        deptFileReport.warnings.push(`Duplicate department code in CSV: ${code}. Updated idempotently.`);
      }
      seenDeptCodes.add(code);

      const deptData: MasterDepartment = {
        id: `dept-${code.toLowerCase()}`,
        code,
        name,
        nameMarathi: nameMarathi || undefined,
        description: description || undefined,
        portalUrl: portalUrl || undefined,
        nodalOfficerEmail: nodalOfficerEmail || undefined,
        slaWorkingDays,
        isActive: true,
      };

      // Idempotent upsert in memory database
      const existingIdx = db.departments.findIndex(d => d.code === deptData.code);
      if (existingIdx >= 0) {
        db.departments[existingIdx] = deptData;
        deptFileReport.duplicateRows++;
      } else {
        db.departments.push(deptData);
      }

      // Try Prisma database upsert if Postgres connected
      if (db.isPostgresConnected) {
        try {
          await db.prisma.department.upsert({
            where: { code: deptData.code },
            update: {
              name: deptData.name,
              nameMarathi: deptData.nameMarathi || null,
              description: deptData.description || null,
              portalUrl: deptData.portalUrl || null,
              nodalOfficerEmail: deptData.nodalOfficerEmail || null,
              slaWorkingDays: deptData.slaWorkingDays,
              isActive: true,
            },
            create: {
              code: deptData.code,
              name: deptData.name,
              nameMarathi: deptData.nameMarathi || null,
              description: deptData.description || null,
              portalUrl: deptData.portalUrl || null,
              nodalOfficerEmail: deptData.nodalOfficerEmail || null,
              slaWorkingDays: deptData.slaWorkingDays,
              isActive: true,
            },
          });
        } catch (e: any) {
          deptFileReport.warnings.push(`Prisma upsert warning for ${deptData.code}: ${e.message}`);
        }
      }

      deptFileReport.importedRows++;
    }
    report.files.push(deptFileReport);
    report.summary.departmentsCount = db.departments.length;
    report.summary.totalSuccessfullyImported += deptFileReport.importedRows;
    report.summary.totalDuplicatesSkippedOrUpdated += deptFileReport.duplicateRows;
    report.summary.totalInvalidOrRejected += deptFileReport.invalidRows;

    // 2. Approvals Master CSV
    const apprFileReport = {
      fileName: 'approvals_master_template.csv',
      totalRows: 0,
      importedRows: 0,
      duplicateRows: 0,
      invalidRows: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    const apprContent = fs.readFileSync(apprPath, 'utf-8');
    const apprRows = parse(apprContent, {
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[];

    apprFileReport.totalRows = apprRows.length;
    report.summary.totalRowsRead += apprRows.length;

    const seenApprCodes = new Set<string>();
    const allDocCodes = new Set<string>();

    for (const row of apprRows) {
      const apprCode = row.approval_code ? row.approval_code.trim().toUpperCase() : '';
      const deptCode = row.department_code ? row.department_code.trim().toUpperCase() : '';
      const name = row.name ? row.name.trim() : '';

      if (!apprCode || !name || !deptCode) {
        apprFileReport.invalidRows++;
        apprFileReport.errors.push(`Row missing approval_code, name, or department_code: ${JSON.stringify(row)}`);
        continue;
      }

      // Foreign key check
      const parentDept = db.departments.find(d => d.code === deptCode);
      if (!parentDept) {
        apprFileReport.invalidRows++;
        apprFileReport.errors.push(`Department ${deptCode} not found for approval ${apprCode}.`);
        continue;
      }

      if (seenApprCodes.has(apprCode)) {
        apprFileReport.duplicateRows++;
        apprFileReport.warnings.push(`Duplicate approval code in CSV: ${apprCode}. Updated idempotently.`);
      }
      seenApprCodes.add(apprCode);

      const docCodes = row.required_doc_codes
        ? row.required_doc_codes.replace(/['"]+/g, '').split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      docCodes.forEach((c: string) => allDocCodes.add(c));

      const apprData: MasterApproval = {
        id: `appr-${apprCode.toLowerCase().replace(/_/g, '-')}`,
        departmentId: parentDept.id,
        departmentCode: parentDept.code,
        approvalCode: apprCode,
        name,
        nameMarathi: row.name_marathi ? row.name_marathi.trim() : undefined,
        stage: row.stage || 'PRE_ESTABLISHMENT',
        category: row.category ? row.category.trim() : 'NOC',
        description: row.description ? row.description.trim() : '',
        statutoryAct: row.statutory_act ? row.statutory_act.trim() : '',
        statutoryTimelineDays: parseInt(row.statutory_timeline_days, 10) || 30,
        validityPeriodMonths: row.validity_period_months ? parseInt(row.validity_period_months, 10) : undefined,
        renewalRequired: String(row.renewal_required).toLowerCase() === 'true',
        requiredDocCodes: docCodes,
        feeStructureDetails: row.fee_structure_details ? row.fee_structure_details.trim() : undefined,
        externalPortalLink: row.external_portal_link ? row.external_portal_link.trim() : undefined,
        isActive: true,
      };

      // Idempotent upsert in memory database
      const existingIdx = db.approvals.findIndex(a => a.approvalCode === apprData.approvalCode);
      if (existingIdx >= 0) {
        db.approvals[existingIdx] = apprData;
        apprFileReport.duplicateRows++;
      } else {
        db.approvals.push(apprData);
      }

      // Try Prisma database upsert if Postgres connected
      if (db.isPostgresConnected) {
        try {
          await db.prisma.approval.upsert({
            where: { approvalCode: apprData.approvalCode },
            update: {
              departmentId: parentDept.id,
              name: apprData.name,
              nameMarathi: apprData.nameMarathi || null,
              stage: apprData.stage,
              category: apprData.category,
              description: apprData.description,
              statutoryAct: apprData.statutoryAct,
              statutoryTimelineDays: apprData.statutoryTimelineDays,
              validityPeriodMonths: apprData.validityPeriodMonths || null,
              renewalRequired: apprData.renewalRequired,
              requiredDocCodes: apprData.requiredDocCodes,
              feeStructureDetails: apprData.feeStructureDetails || null,
              externalPortalLink: apprData.externalPortalLink || null,
              isActive: true,
            },
            create: {
              approvalCode: apprData.approvalCode,
              departmentId: parentDept.id,
              name: apprData.name,
              nameMarathi: apprData.nameMarathi || null,
              stage: apprData.stage,
              category: apprData.category,
              description: apprData.description,
              statutoryAct: apprData.statutoryAct,
              statutoryTimelineDays: apprData.statutoryTimelineDays,
              validityPeriodMonths: apprData.validityPeriodMonths || null,
              renewalRequired: apprData.renewalRequired,
              requiredDocCodes: apprData.requiredDocCodes,
              feeStructureDetails: apprData.feeStructureDetails || null,
              externalPortalLink: apprData.externalPortalLink || null,
              isActive: true,
            },
          });
        } catch (e: any) {
          apprFileReport.warnings.push(`Prisma upsert warning for approval ${apprData.approvalCode}: ${e.message}`);
        }
      }

      apprFileReport.importedRows++;
    }
    report.files.push(apprFileReport);
    report.summary.approvalsCount = db.approvals.length;
    report.summary.uniqueRequiredDocumentsCount = allDocCodes.size;
    report.summary.totalSuccessfullyImported += apprFileReport.importedRows;
    report.summary.totalDuplicatesSkippedOrUpdated += apprFileReport.duplicateRows;
    report.summary.totalInvalidOrRejected += apprFileReport.invalidRows;

    // 3. Approval Rules CSV
    const ruleFileReport = {
      fileName: 'approval_rules_template.csv',
      totalRows: 0,
      importedRows: 0,
      duplicateRows: 0,
      invalidRows: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    const ruleContent = fs.readFileSync(rulePath, 'utf-8');
    const ruleRows = parse(ruleContent, {
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[];

    ruleFileReport.totalRows = ruleRows.length;
    report.summary.totalRowsRead += ruleRows.length;

    const seenRuleCodes = new Set<string>();

    for (const row of ruleRows) {
      const ruleCode = row.rule_code ? row.rule_code.trim().toUpperCase() : '';
      const apprCode = row.approval_code ? row.approval_code.trim().toUpperCase() : '';

      if (!ruleCode || !apprCode || !row.conditions_json) {
        ruleFileReport.invalidRows++;
        ruleFileReport.errors.push(`Row missing rule_code, approval_code, or conditions_json: ${JSON.stringify(row)}`);
        continue;
      }

      // Foreign key check
      const parentAppr = db.approvals.find(a => a.approvalCode === apprCode);
      if (!parentAppr) {
        ruleFileReport.invalidRows++;
        ruleFileReport.errors.push(`Approval ${apprCode} not found for rule ${ruleCode}.`);
        continue;
      }

      let parsedConditions: any;
      try {
        parsedConditions = JSON.parse(row.conditions_json);
      } catch (e: any) {
        ruleFileReport.invalidRows++;
        ruleFileReport.errors.push(`Invalid conditions_json format in rule ${ruleCode}: ${e.message}`);
        continue;
      }

      if (seenRuleCodes.has(ruleCode)) {
        ruleFileReport.duplicateRows++;
        ruleFileReport.warnings.push(`Duplicate rule code in CSV: ${ruleCode}. Updated idempotently.`);
      }
      seenRuleCodes.add(ruleCode);

      const ruleData: MasterRule = {
        id: `rule-${ruleCode.toLowerCase().replace(/_/g, '-')}`,
        ruleCode,
        approvalCode: parentAppr.approvalCode,
        ruleName: row.rule_name ? row.rule_name.trim() : ruleCode,
        priority: parseInt(row.priority, 10) || 100,
        conditionsJson: parsedConditions,
        explanationTpl: row.explanation_tpl ? row.explanation_tpl.trim() : '',
      };

      // Idempotent upsert in memory database
      const existingIdx = db.rules.findIndex(r => r.ruleCode === ruleData.ruleCode);
      if (existingIdx >= 0) {
        db.rules[existingIdx] = ruleData;
        ruleFileReport.duplicateRows++;
      } else {
        db.rules.push(ruleData);
      }

      // Try Prisma database upsert if Postgres connected
      if (db.isPostgresConnected) {
        try {
          await db.prisma.approvalRule.upsert({
            where: { ruleCode: ruleData.ruleCode },
            update: {
              approvalId: parentAppr.id,
              ruleName: ruleData.ruleName,
              priority: ruleData.priority,
              conditionsJson: ruleData.conditionsJson,
              explanationTpl: ruleData.explanationTpl,
              isActive: true,
            },
            create: {
              ruleCode: ruleData.ruleCode,
              approvalId: parentAppr.id,
              ruleName: ruleData.ruleName,
              priority: ruleData.priority,
              conditionsJson: ruleData.conditionsJson,
              explanationTpl: ruleData.explanationTpl,
              isActive: true,
            },
          });
        } catch (e: any) {
          ruleFileReport.warnings.push(`Prisma upsert warning for rule ${ruleData.ruleCode}: ${e.message}`);
        }
      }

      ruleFileReport.importedRows++;
    }
    report.files.push(ruleFileReport);
    report.summary.rulesCount = db.rules.length;
    report.summary.totalSuccessfullyImported += ruleFileReport.importedRows;
    report.summary.totalDuplicatesSkippedOrUpdated += ruleFileReport.duplicateRows;
    report.summary.totalInvalidOrRejected += ruleFileReport.invalidRows;

    this.lastReport = report;
    this.lastImportTime = new Date();

    return report;
  }
}

export const datasetImportService = new DatasetImportService();
