# Phased Development Roadmap
## SIH26130: Industrial Approval, Compliance and Government Support Navigator

---

## 1. Development Phases & Milestones

```mermaid
gantt
    title SIH26130 Project Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Requirements Analysis & Architecture   :done, p1_1, 2026-09-26, 1d
    Prisma Schema & 17-Table Design        :done, p1_2, 2026-09-26, 1d
    CSV Ingestion & Rule Evaluator Engine  :done, p1_3, 2026-09-26, 1d
    API Specs & Client/Server Scaffolding  :done, p1_4, 2026-09-26, 1d

    section Phase 2: Auth & Profiles
    JWT Auth, bcrypt & User Roles          :p2_1, 2026-09-27, 2d
    Citizen Signup/Login UI & Guards       :p2_2, 2026-09-28, 2d
    Comprehensive Business Profile Forms   :p2_3, 2026-09-29, 2d

    section Phase 3: Rule Engine & Catalog
    Dynamic Assessment API Integration     :p3_1, 2026-09-30, 2d
    Applicable Approvals Interactive UI    :p3_2, 2026-10-01, 2d
    Statutory Act & RTS SLA Explanations   :p3_3, 2026-10-02, 1d

    section Phase 4: Documents & AI Assist
    Document Checklist & Upload Vault      :p4_1, 2026-10-03, 2d
    AI OCR & Verification Assistant        :p4_2, 2026-10-04, 2d
    Verified Document Digital Wallet       :p4_3, 2026-10-05, 1d

    section Phase 5: Parallel Clearance
    Application Review & Single Submit     :p5_1, 2026-10-06, 2d
    Parallel Department Clearance Routing  :p5_2, 2026-10-07, 2d
    Real-time SLA Countdown & Alerting     :p5_3, 2026-10-08, 1d

    section Phase 6: Inspections & Officers
    Common Joint Inspection Scheduler      :done, p6_1, 2026-10-09, 2d
    Government Officer Dashboard & Scrutiny:done, p6_2, 2026-10-10, 2d
    Maharashtra PSI Schemes & Subsidies    :done, p6_3, 2026-10-11, 2d
    Compliance Calendar & Renewal Engine   :done, p6_4, 2026-10-12, 1d
    Hackathon Demo Hardening & Polish      :done, p6_5, 2026-10-13, 2d

    section Phase 7: Admin & Governance
    Executive State Analytics & Heatmaps   :done, p7_1, 2026-10-14, 2d
    Dynamic Master Statutory Rules Engine  :done, p7_2, 2026-10-15, 2d
    Regulatory Audit Ledger & PII Masking  :done, p7_3, 2026-10-16, 1d
    User Governance & Lifecycle Controls   :done, p7_4, 2026-10-17, 1d
    Statutory RTS 2015 Appellate Grievance :done, p7_5, 2026-10-18, 2d
```

---

## 2. Phase Breakdown & Deliverables

### Phase 1: Technical Foundation & Architecture (Current Phase - Completed)
- [x] Comprehensive requirements analysis for SIH26130.
- [x] Unified folder structure (`client`, `server`, `docs`, `data`).
- [x] PostgreSQL database design with Prisma ORM encompassing all 17 entities.
- [x] CSV data ingestion pipeline and sample templates for Maharashtra departments, approvals, and rules.
- [x] Deterministic statutory rule matching engine with JSON predicate trees.
- [x] REST API architecture and OpenAPI/REST contracts.
- [x] Vite + React + Tailwind + TypeScript client scaffolding with auth guards and route stubs.

---

### Phase 2: Core Authentication, Security & Business Profile Engine
- Implement `POST /api/v1/auth/signup` and `POST /api/v1/auth/login` with bcrypt and JWT tokens.
- Build frontend Signup and Login forms with form validation and error handling.
- Verify that unauthenticated users cannot access `/start-assessment` or protected pages.
- Build multi-step Business Profile form capturing enterprise financials, plant & machinery, location, power, water, and environmental parameters.

---

### Phase 3: Smart Assessment & Statutory Approval Recommendations
- Connect the business profile with `POST /api/v1/assessments/evaluate`.
- Render the Applicable Approvals list with department badges, statutory act citations, RTS timelines, and dynamic legal justifications.
- Generate consolidated required documents checklist, deduplicating requirements across departments.

---

### Phase 4: Document Vault, AI Verification & Verified Wallet
- Implement secure file upload with MIME/size checking and SHA-256 integrity hashing.
- Integrate lightweight AI assistant for OCR classification and field consistency verification.
- Implement the "Verified Document Wallet" enabling one-click attachment across multiple statutory filings.

---

### Phase 5: Single-Window Submission, Parallel Processing & SLA Tracker
- Implement consolidated application submission (`POST /api/v1/applications/:id/submit`).
- Route clearances concurrently to respective department queues (MPCB, DISH, MIDC, Fire, etc.).
- Build visual SLA progress bar showing Maharashtra Right to Public Services Act countdowns with overdue escalation warnings.

---

### Phase 6: Common Inspections, Schemes, Officer Portal & Final Polish
- Common Joint Inspection scheduler synchronizing field visits across departments.
- Government Officer Dashboard for scrutinizing documents, raising queries, and approving applications.
- Maharashtra Package Scheme of Incentives (PSI) eligibility matcher.
- Post-approval compliance calendar and automated license renewal tracker.

---

### Phase 7: State Administration, Regulatory Audit Ledger, Performance Analytics & Statutory RTS Appellate Grievance Portal
- [x] Executive State Performance Analytics: aggregate state investments, employment, cross-department RTS rankings, SLA compliance rates, and district industrial Capex heatmaps.
- [x] Dynamic Statutory Master Rules Engine: schema validation, dynamic JSON predicate rule injection, priority management, and live evaluation.
- [x] Regulatory Audit Trail Explorer: tamper-proof event logging with client IP tracking, action/entity filtering, and PII masking for sensitive citizen identifiers.
- [x] User Governance & Role Management: operational lifecycle controls (Active/Suspended status toggle) with audit trail emission.
- [x] Maharashtra Right to Public Services Act (RTS 2015) Statutory Appeals Mechanism: Section 18 citizen appeal filing, First Appellate Authority (Joint Director of Industries) and Second Appellate Authority (Principal Secretary) tiering, docket tracking, and legally binding appellate disposal orders (`DIRECTED_CLEARANCE`, `UPHELD`, `DISMISSED`) auto-updating clearance states.
- [x] Dedicated Frontend State Control Center (`/admin/dashboard`) and Citizen RTS Grievance Desk on (`/sla-tracker`).
- [x] Automated Test Suite: 14 comprehensive end-to-end scenarios (`npm run test:phase7`).

