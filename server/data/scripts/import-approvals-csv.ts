/**
 * SIH26130 - Industrial Approval CSV Ingestion Pipeline
 * 
 * Imports and validates:
 * 1. Departments Master (departments_master.csv)
 * 2. Approvals Master (approvals_master_template.csv)
 * 3. Approval Rules Master (approval_rules_template.csv)
 * 
 * Uses idempotent upserts to ensure database updates do not break existing applications.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DepartmentCsvRow {
  code: string;
  name: string;
  name_marathi?: string;
  description?: string;
  portal_url?: string;
  nodal_officer_email?: string;
  sla_working_days?: string;
}

interface ApprovalCsvRow {
  approval_code: string;
  department_code: string;
  name: string;
  name_marathi?: string;
  stage: 'PRE_ESTABLISHMENT' | 'PRE_OPERATION' | 'OPERATIONAL';
  category: string;
  description: string;
  statutory_act: string;
  statutory_timeline_days: string;
  validity_period_months?: string;
  renewal_required: string;
  required_doc_codes: string;
  fee_structure_details?: string;
  external_portal_link?: string;
}

interface RuleCsvRow {
  rule_code: string;
  approval_code: string;
  rule_name: string;
  priority: string;
  conditions_json: string;
  explanation_tpl: string;
}

export async function importDepartments(csvPath: string) {
  console.log(`[Ingestion] Importing departments from ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as DepartmentCsvRow[];

  for (const row of records) {
    await prisma.department.upsert({
      where: { code: row.code },
      update: {
        name: row.name,
        nameMarathi: row.name_marathi || null,
        description: row.description || null,
        portalUrl: row.portal_url || null,
        nodalOfficerEmail: row.nodal_officer_email || null,
        slaWorkingDays: row.sla_working_days ? parseInt(row.sla_working_days, 10) : 30,
        isActive: true,
      },
      create: {
        code: row.code,
        name: row.name,
        nameMarathi: row.name_marathi || null,
        description: row.description || null,
        portalUrl: row.portal_url || null,
        nodalOfficerEmail: row.nodal_officer_email || null,
        slaWorkingDays: row.sla_working_days ? parseInt(row.sla_working_days, 10) : 30,
        isActive: true,
      },
    });
  }
  console.log(`[Ingestion] Successfully imported ${records.length} departments.`);
}

export async function importApprovals(csvPath: string) {
  console.log(`[Ingestion] Importing approvals from ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as ApprovalCsvRow[];

  for (const row of records) {
    const department = await prisma.department.findUnique({
      where: { code: row.department_code },
    });

    if (!department) {
      console.warn(`[Ingestion Warning] Skipping approval ${row.approval_code}: Department ${row.department_code} not found.`);
      continue;
    }

    const docCodes = row.required_doc_codes
      ? row.required_doc_codes.replace(/['"]+/g, '').split(',').map(s => s.trim())
      : [];

    await prisma.approval.upsert({
      where: { approvalCode: row.approval_code },
      update: {
        departmentId: department.id,
        name: row.name,
        nameMarathi: row.name_marathi || null,
        stage: row.stage,
        category: row.category,
        description: row.description,
        statutoryAct: row.statutory_act,
        statutoryTimelineDays: parseInt(row.statutory_timeline_days, 10),
        validityPeriodMonths: row.validity_period_months ? parseInt(row.validity_period_months, 10) : null,
        renewalRequired: row.renewal_required.toLowerCase() === 'true',
        requiredDocCodes: docCodes,
        feeStructureDetails: row.fee_structure_details || null,
        externalPortalLink: row.external_portal_link || null,
        isActive: true,
      },
      create: {
        approvalCode: row.approval_code,
        departmentId: department.id,
        name: row.name,
        nameMarathi: row.name_marathi || null,
        stage: row.stage,
        category: row.category,
        description: row.description,
        statutoryAct: row.statutory_act,
        statutoryTimelineDays: parseInt(row.statutory_timeline_days, 10),
        validityPeriodMonths: row.validity_period_months ? parseInt(row.validity_period_months, 10) : null,
        renewalRequired: row.renewal_required.toLowerCase() === 'true',
        requiredDocCodes: docCodes,
        feeStructureDetails: row.fee_structure_details || null,
        externalPortalLink: row.external_portal_link || null,
        isActive: true,
      },
    });
  }
  console.log(`[Ingestion] Successfully imported ${records.length} approvals.`);
}

export async function importApprovalRules(csvPath: string) {
  console.log(`[Ingestion] Importing approval rules from ${csvPath}...`);
  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as RuleCsvRow[];

  for (const row of records) {
    const approval = await prisma.approval.findUnique({
      where: { approvalCode: row.approval_code },
    });

    if (!approval) {
      console.warn(`[Ingestion Warning] Skipping rule ${row.rule_code}: Approval ${row.approval_code} not found.`);
      continue;
    }

    let parsedConditions: any;
    try {
      parsedConditions = JSON.parse(row.conditions_json);
    } catch (e) {
      console.error(`[Ingestion Error] Invalid JSON in rule ${row.rule_code}:`, row.conditions_json);
      continue;
    }

    await prisma.approvalRule.upsert({
      where: { ruleCode: row.rule_code },
      update: {
        approvalId: approval.id,
        ruleName: row.rule_name,
        priority: parseInt(row.priority, 10) || 100,
        conditionsJson: parsedConditions,
        explanationTpl: row.explanation_tpl,
        isActive: true,
      },
      create: {
        ruleCode: row.rule_code,
        approvalId: approval.id,
        ruleName: row.rule_name,
        priority: parseInt(row.priority, 10) || 100,
        conditionsJson: parsedConditions,
        explanationTpl: row.explanation_tpl,
        isActive: true,
      },
    });
  }
  console.log(`[Ingestion] Successfully imported ${records.length} approval rules.`);
}

async function main() {
  const templatesDir = path.resolve(__dirname, '../templates');
  const deptPath = path.join(templatesDir, 'departments_master.csv');
  const appPath = path.join(templatesDir, 'approvals_master_template.csv');
  const rulePath = path.join(templatesDir, 'approval_rules_template.csv');

  console.log('--- Starting Industrial Approval CSV Ingestion ---');
  await importDepartments(deptPath);
  await importApprovals(appPath);
  await importApprovalRules(rulePath);
  console.log('--- Ingestion Complete ---');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Ingestion failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
