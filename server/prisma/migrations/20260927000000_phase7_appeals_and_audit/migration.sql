-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LegalEntityType" AS ENUM ('PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'ONE_PERSON_COMPANY', 'TRUST_SOCIETY', 'COOPERATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "PollutionCategory" AS ENUM ('RED', 'ORANGE', 'GREEN', 'WHITE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ApplicationStage" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_SCRUTINY', 'INSPECTION_SCHEDULED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStage" AS ENUM ('PRE_ESTABLISHMENT', 'PRE_OPERATION', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_STARTED', 'APPLIED', 'IN_PROGRESS', 'QUERY_RAISED', 'INSPECTION_PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'WARNING');

-- CreateEnum
CREATE TYPE "VerificationByType" AS ENUM ('AI_AUTO', 'OFFICER_MANUAL');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('JOINT_COMMON_INSPECTION', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('OPEN', 'RESPONDED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ComplianceFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'UPCOMING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('VALID', 'DUE_SOON', 'OVERDUE', 'RENEWAL_FILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STATUS_UPDATE', 'QUERY', 'SLA_WARNING', 'INSPECTION', 'RENEWAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AppellateAuthority" AS ENUM ('FIRST_APPELLATE', 'SECOND_APPELLATE');

-- CreateEnum
CREATE TYPE "AppealGround" AS ENUM ('SLA_BREACH', 'REJECTION_WITHOUT_REASON', 'UNREASONABLE_QUERY', 'CORRUPTION_HARASSMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'HEARING_SCHEDULED', 'UPHELD', 'DIRECTED_CLEARANCE', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "department_id" TEXT,
    "designation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "legal_entity_type" "LegalEntityType" NOT NULL DEFAULT 'PRIVATE_LIMITED',
    "industry_sector" TEXT NOT NULL,
    "nic_code" TEXT,
    "business_activity" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "taluka" TEXT NOT NULL,
    "pin_code" TEXT NOT NULL,
    "is_midc_area" BOOLEAN NOT NULL DEFAULT false,
    "midc_estate_name" TEXT,
    "survey_plot_number" TEXT,
    "land_area_sqm" DECIMAL(12,2) NOT NULL,
    "built_up_area_sqm" DECIMAL(12,2) NOT NULL,
    "investment_plant_machinery" DECIMAL(14,2) NOT NULL,
    "investment_land_building" DECIMAL(14,2) NOT NULL,
    "annual_turnover" DECIMAL(14,2),
    "employee_count" INTEGER NOT NULL,
    "female_employee_count" INTEGER DEFAULT 0,
    "production_capacity" TEXT,
    "production_unit" TEXT,
    "power_requirement_kva" DECIMAL(10,2) NOT NULL,
    "water_requirement_kld" DECIMAL(10,2) NOT NULL,
    "water_source" TEXT,
    "pollution_category" "PollutionCategory" NOT NULL DEFAULT 'GREEN',
    "effluent_discharge_kld" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "hazardous_waste_generation" BOOLEAN NOT NULL DEFAULT false,
    "has_boiler" BOOLEAN NOT NULL DEFAULT false,
    "boiler_capacity_tph" DECIMAL(8,2),
    "has_dg_set" BOOLEAN NOT NULL DEFAULT false,
    "dg_set_capacity_kva" DECIMAL(10,2),
    "gst_registered" BOOLEAN NOT NULL DEFAULT false,
    "gstin" TEXT,
    "msme_registered" BOOLEAN NOT NULL DEFAULT false,
    "udyam_number" TEXT,
    "pan_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_profile_id" TEXT NOT NULL,
    "application_number" TEXT NOT NULL,
    "stage" "ApplicationStage" NOT NULL DEFAULT 'DRAFT',
    "overall_progress" INTEGER NOT NULL DEFAULT 0,
    "project_stage" "ApprovalStage" NOT NULL DEFAULT 'PRE_ESTABLISHMENT',
    "total_approvals_count" INTEGER NOT NULL DEFAULT 0,
    "approved_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_count" INTEGER NOT NULL DEFAULT 0,
    "query_pending_count" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "target_completion_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_marathi" TEXT,
    "description" TEXT,
    "portal_url" TEXT,
    "nodal_officer_email" TEXT,
    "nodal_officer_phone" TEXT,
    "sla_working_days" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "approval_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_marathi" TEXT,
    "stage" "ApprovalStage" NOT NULL DEFAULT 'PRE_ESTABLISHMENT',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "statutory_act" TEXT NOT NULL,
    "statutory_timeline_days" INTEGER NOT NULL,
    "fee_structure_details" TEXT,
    "validity_period_months" INTEGER,
    "renewal_required" BOOLEAN NOT NULL DEFAULT false,
    "required_doc_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "external_portal_link" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_rules" (
    "id" TEXT NOT NULL,
    "approval_id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "description" TEXT,
    "conditions_json" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "explanation_tpl" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_approvals" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "approval_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "trigger_reason" TEXT NOT NULL,
    "sla_deadline" TIMESTAMP(3),
    "applied_at" TIMESTAMP(3),
    "approved_date" TIMESTAMP(3),
    "certificate_url" TEXT,
    "certificate_number" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "application_id" TEXT,
    "document_type_code" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "is_wallet_item" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_verifications" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "verified_by_type" "VerificationByType" NOT NULL DEFAULT 'AI_AUTO',
    "officer_id" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "confidence_score" DECIMAL(5,2),
    "ai_extracted_data" JSONB,
    "verification_notes" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_departments" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "assigned_officer_id" TEXT,
    "overall_status" "ApprovalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "scrutiny_notes" TEXT,
    "sla_due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "department_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inspection_type" "InspectionType" NOT NULL DEFAULT 'JOINT_COMMON_INSPECTION',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "lead_officer_id" TEXT,
    "site_address" TEXT NOT NULL,
    "findings_report_url" TEXT,
    "checklist_response" JSONB,
    "officer_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" TEXT NOT NULL,
    "department_id" TEXT,
    "scheme_code" TEXT NOT NULL,
    "scheme_name" TEXT NOT NULL,
    "eligible_sectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligible_districts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_investment" DECIMAL(14,2),
    "max_investment" DECIMAL(14,2),
    "subsidy_percentage" DECIMAL(5,2),
    "benefits_description" TEXT NOT NULL,
    "eligibility_criteria_json" JSONB NOT NULL,
    "policy_reference" TEXT NOT NULL,
    "application_url" TEXT,
    "validity_end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_records" (
    "id" TEXT NOT NULL,
    "business_profile_id" TEXT NOT NULL,
    "approval_id" TEXT,
    "compliance_title" TEXT NOT NULL,
    "frequency" "ComplianceFrequency" NOT NULL DEFAULT 'ANNUAL',
    "next_due_date" TIMESTAMP(3) NOT NULL,
    "last_submitted_date" TIMESTAMP(3),
    "status" "ComplianceStatus" NOT NULL DEFAULT 'UPCOMING',
    "statutory_rule" TEXT,
    "penalty_terms" TEXT,
    "evidence_doc_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewals" (
    "id" TEXT NOT NULL,
    "application_approval_id" TEXT NOT NULL,
    "business_profile_id" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "renewal_window_days" INTEGER NOT NULL DEFAULT 60,
    "renewal_status" "RenewalStatus" NOT NULL DEFAULT 'VALID',
    "reminder_sent_at" TIMESTAMP(3),
    "renewal_filed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'STATUS_UPDATE',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link_url" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queries" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "application_approval_id" TEXT,
    "department_id" TEXT NOT NULL,
    "officer_id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "query_subject" TEXT NOT NULL,
    "query_description" TEXT NOT NULL,
    "officer_attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "citizen_response" TEXT,
    "citizen_attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "QueryStatus" NOT NULL DEFAULT 'OPEN',
    "raised_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "entity_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeals" (
    "id" TEXT NOT NULL,
    "appeal_number" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "department_code" TEXT NOT NULL,
    "appellate_authority" "AppellateAuthority" NOT NULL DEFAULT 'FIRST_APPELLATE',
    "ground_for_appeal" "AppealGround" NOT NULL DEFAULT 'SLA_BREACH',
    "applicant_statement" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'PENDING',
    "officer_remarks" TEXT,
    "hearing_date" TIMESTAMP(3),
    "order_document_url" TEXT,
    "decided_at" TIMESTAMP(3),
    "decided_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "business_profiles_user_id_idx" ON "business_profiles"("user_id");

-- CreateIndex
CREATE INDEX "business_profiles_district_idx" ON "business_profiles"("district");

-- CreateIndex
CREATE INDEX "business_profiles_industry_sector_idx" ON "business_profiles"("industry_sector");

-- CreateIndex
CREATE UNIQUE INDEX "applications_application_number_key" ON "applications"("application_number");

-- CreateIndex
CREATE INDEX "applications_user_id_idx" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "applications_application_number_idx" ON "applications"("application_number");

-- CreateIndex
CREATE INDEX "applications_stage_idx" ON "applications"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_code_idx" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_approval_code_key" ON "approvals"("approval_code");

-- CreateIndex
CREATE INDEX "approvals_approval_code_idx" ON "approvals"("approval_code");

-- CreateIndex
CREATE INDEX "approvals_department_id_idx" ON "approvals"("department_id");

-- CreateIndex
CREATE INDEX "approvals_stage_idx" ON "approvals"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "approval_rules_rule_code_key" ON "approval_rules"("rule_code");

-- CreateIndex
CREATE INDEX "approval_rules_approval_id_idx" ON "approval_rules"("approval_id");

-- CreateIndex
CREATE INDEX "approval_rules_rule_code_idx" ON "approval_rules"("rule_code");

-- CreateIndex
CREATE INDEX "application_approvals_application_id_idx" ON "application_approvals"("application_id");

-- CreateIndex
CREATE INDEX "application_approvals_department_id_idx" ON "application_approvals"("department_id");

-- CreateIndex
CREATE INDEX "application_approvals_status_idx" ON "application_approvals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "application_approvals_application_id_approval_id_key" ON "application_approvals"("application_id", "approval_id");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "documents_application_id_idx" ON "documents"("application_id");

-- CreateIndex
CREATE INDEX "documents_document_type_code_idx" ON "documents"("document_type_code");

-- CreateIndex
CREATE INDEX "documents_is_wallet_item_idx" ON "documents"("is_wallet_item");

-- CreateIndex
CREATE INDEX "document_verifications_document_id_idx" ON "document_verifications"("document_id");

-- CreateIndex
CREATE INDEX "document_verifications_verification_status_idx" ON "document_verifications"("verification_status");

-- CreateIndex
CREATE INDEX "application_departments_application_id_idx" ON "application_departments"("application_id");

-- CreateIndex
CREATE INDEX "application_departments_department_id_idx" ON "application_departments"("department_id");

-- CreateIndex
CREATE INDEX "application_departments_overall_status_idx" ON "application_departments"("overall_status");

-- CreateIndex
CREATE UNIQUE INDEX "application_departments_application_id_department_id_key" ON "application_departments"("application_id", "department_id");

-- CreateIndex
CREATE INDEX "inspections_application_id_idx" ON "inspections"("application_id");

-- CreateIndex
CREATE INDEX "inspections_status_idx" ON "inspections"("status");

-- CreateIndex
CREATE INDEX "inspections_scheduled_date_idx" ON "inspections"("scheduled_date");

-- CreateIndex
CREATE UNIQUE INDEX "schemes_scheme_code_key" ON "schemes"("scheme_code");

-- CreateIndex
CREATE INDEX "schemes_scheme_code_idx" ON "schemes"("scheme_code");

-- CreateIndex
CREATE INDEX "schemes_is_active_idx" ON "schemes"("is_active");

-- CreateIndex
CREATE INDEX "compliance_records_business_profile_id_idx" ON "compliance_records"("business_profile_id");

-- CreateIndex
CREATE INDEX "compliance_records_next_due_date_idx" ON "compliance_records"("next_due_date");

-- CreateIndex
CREATE INDEX "compliance_records_status_idx" ON "compliance_records"("status");

-- CreateIndex
CREATE INDEX "renewals_application_approval_id_idx" ON "renewals"("application_approval_id");

-- CreateIndex
CREATE INDEX "renewals_business_profile_id_idx" ON "renewals"("business_profile_id");

-- CreateIndex
CREATE INDEX "renewals_expiry_date_idx" ON "renewals"("expiry_date");

-- CreateIndex
CREATE INDEX "renewals_renewal_status_idx" ON "renewals"("renewal_status");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "queries_application_id_idx" ON "queries"("application_id");

-- CreateIndex
CREATE INDEX "queries_department_id_idx" ON "queries"("department_id");

-- CreateIndex
CREATE INDEX "queries_officer_id_idx" ON "queries"("officer_id");

-- CreateIndex
CREATE INDEX "queries_citizen_id_idx" ON "queries"("citizen_id");

-- CreateIndex
CREATE INDEX "queries_status_idx" ON "queries"("status");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_name_idx" ON "audit_logs"("entity_name");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "appeals_appeal_number_key" ON "appeals"("appeal_number");

-- CreateIndex
CREATE INDEX "appeals_application_id_idx" ON "appeals"("application_id");

-- CreateIndex
CREATE INDEX "appeals_citizen_id_idx" ON "appeals"("citizen_id");

-- CreateIndex
CREATE INDEX "appeals_department_code_idx" ON "appeals"("department_code");

-- CreateIndex
CREATE INDEX "appeals_status_idx" ON "appeals"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_approvals" ADD CONSTRAINT "application_approvals_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_approvals" ADD CONSTRAINT "application_approvals_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "approvals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_approvals" ADD CONSTRAINT "application_approvals_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_verifications" ADD CONSTRAINT "document_verifications_officer_id_fkey" FOREIGN KEY ("officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_departments" ADD CONSTRAINT "application_departments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_departments" ADD CONSTRAINT "application_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_departments" ADD CONSTRAINT "application_departments_assigned_officer_id_fkey" FOREIGN KEY ("assigned_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_lead_officer_id_fkey" FOREIGN KEY ("lead_officer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewals" ADD CONSTRAINT "renewals_application_approval_id_fkey" FOREIGN KEY ("application_approval_id") REFERENCES "application_approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewals" ADD CONSTRAINT "renewals_business_profile_id_fkey" FOREIGN KEY ("business_profile_id") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_application_approval_id_fkey" FOREIGN KEY ("application_approval_id") REFERENCES "application_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_officer_id_fkey" FOREIGN KEY ("officer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queries" ADD CONSTRAINT "queries_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

