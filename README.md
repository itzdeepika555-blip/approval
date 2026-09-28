# Industrial Approval, Compliance and Government Support Navigator
### Smart India Hackathon — Problem Statement: SIH26130

**Organization:** Government of Maharashtra  
**Department:** Maharashtra State Innovation Society (MSInS), Department of Skills, Employment, Entrepreneurship and Innovation  
**Category:** Software  

---

## 📌 Executive Summary

Entrepreneurs and industrial units establishing operations in Maharashtra face immense complexity navigating multiple statutory approvals, licenses, NOCs, and environmental consents across multiple authorities (MPCB, MIDC, DISH, Fire Directorate, MSEDCL, Revenue Department, Labour Department, etc.).

This project delivers an **intelligent single-window industrial navigator** that:
1. **Determines Applicable Approvals:** Uses a deterministic, rule-based matching engine to evaluate business parameters against statutory acts.
2. **Eliminates Redundant Uploads:** Houses a unified **Verified Document Wallet** that reuses documents across departments.
3. **Assists via AI:** Employs AI for document classification, OCR consistency verification, and plain-language explanation of regulatory triggers.
4. **Orchestrates Parallel Processing:** Submits a single consolidated application that branches into parallel departmental queues.
5. **Enforces Statutory SLAs:** Tracks turnaround times under the **Maharashtra Right to Public Services Act (RTS)** with real-time countdowns.
6. **Schedules Joint Inspections:** Combines field visits across MPCB, DISH, and Fire into a single common inspection date.
7. **Recommends Maharashtra Incentives:** Matches industrial profiles with the Maharashtra Package Scheme of Incentives (PSI 2019/2024).

---

## 🛠 Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with Government of Maharashtra color palette
- **Routing:** React Router v6 with strict authentication route guards (`ProtectedRoute`)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js with TypeScript
- **Validation:** Zod Schema Validation
- **Security:** Helmet, CORS, Express Rate Limiter, bcrypt password hashing, JWT Access & Refresh Tokens

### Database & ORM
- **Database:** PostgreSQL (17 core relational tables)
- **ORM:** Prisma ORM
- **Migrations & Studio:** Prisma Migrate & Prisma Studio

### Data Ingestion
- **Formats:** Master CSV templates (`departments_master.csv`, `approvals_master_template.csv`, `approval_rules_template.csv`)
- **Ingestion Script:** Idempotent upsert pipeline (`import-approvals-csv.ts`) ensuring rule updates without modifying code.

---

## 🏛 17 Core Functional Modules

| # | Module | Scope & Description | Access Level |
| :-: | :--- | :--- | :--- |
| **1** | **Welcome / Home** | Single-window landing page, problem discovery, and search. | Public |
| **2** | **Signup / Login** | Secure registration and JWT login for Citizens, Officers, and Admins. | Public |
| **3** | **Citizen Dashboard** | Overview of ongoing applications, approvals, active queries, and alerts. | Citizen (Auth) |
| **4** | **Business Profile** | Captures 20+ industrial parameters (scale, sector, location, pollution, power, water). | Citizen (Auth) |
| **5** | **Smart Approval Assessment** | Deterministic rule matching engine evaluating statutory requirements. | Citizen (Auth) |
| **6** | **Applicable Approvals** | Clear itemized list of required NOCs, acts, fees, and departments. | Citizen (Auth) |
| **7** | **Required Document Checklist** | Deduplicated statutory checklist tailored to the enterprise. | Citizen (Auth) |
| **8** | **AI Document Verification** | AI-assisted OCR classification and metadata extraction from uploaded files. | Citizen / Officer |
| **9** | **Verified Document Wallet** | Secure repository storing reusable verified documents (e.g. 7/12, PAN, MoA). | Citizen (Auth) |
| **10** | **Application Review & Submit** | Consolidated review and single-click statutory filing. | Citizen (Auth) |
| **11** | **Parallel Dept Processing** | Simultaneous multi-departmental processing without serial bottlenecks. | Citizen / Officer |
| **12** | **Approval Tracker + SLA** | Live statutory turnaround tracking under Maharashtra RTS Act. | Citizen / Officer |
| **13** | **Common Inspection Scheduler** | Joint inspection scheduling across departments to prevent redundant visits. | Citizen / Officer |
| **14** | **Schemes & Incentives** | Matcher for Maharashtra Package Scheme of Incentives (PSI 2019/2024). | Public / Citizen |
| **15** | **Compliance & Renewal** | Post-establishment compliance calendar (Form V, returns) and license renewals. | Citizen (Auth) |
| **16** | **Officer Dashboard** | Departmental scrutiny desk, document verification, query raising, and approvals. | Officer / Admin |
| **17** | **State Administration & RTS Appeals** | Executive analytics, dynamic rules management, audit ledger, and statutory appeals. | Admin / Officer / Citizen |

---

## 📁 Repository Structure

```text
SIH/
├── client/                               # Frontend Web Application (React + TS + Vite)
│   ├── public/                           # Static assets
│   ├── src/
│   │   ├── components/                   # Reusable UI & Layout Components
│   │   ├── context/                      # React Context (AuthContext)
│   │   ├── routes/                       # ProtectedRoute & Role Guards
│   │   ├── types/                        # TypeScript DTOs & Interfaces
│   │   ├── App.tsx                       # App Router with all 16 module endpoints
│   │   ├── index.css                     # Tailwind CSS entry
│   │   └── main.tsx                      # React root entry
│   ├── index.html                        # Application HTML shell
│   ├── package.json                      # Frontend dependencies
│   ├── tailwind.config.js                # Custom theme & colors
│   ├── tsconfig.json                     # Frontend TS config
│   └── vite.config.ts                    # Vite bundler config
│
├── server/                               # Backend REST API (Node.js + Express + TS)
│   ├── data/
│   │   ├── scripts/
│   │   │   └── import-approvals-csv.ts   # CSV Ingestion Pipeline
│   │   └── templates/                    # Master CSV Datasets
│   │       ├── approvals_master_template.csv
│   │       ├── approval_rules_template.csv
│   │       └── departments_master.csv
│   ├── prisma/
│   │   └── schema.prisma                 # 17 Core Database Tables
│   ├── src/
│   │   ├── config/                       # Environment configuration
│   │   ├── engine/
│   │   │   └── rule-evaluator.ts         # Deterministic Approval Rule Engine
│   │   ├── middlewares/                  # Auth, RBAC, Zod Validation, Audit Logging
│   │   ├── routes/                       # Express REST API v1 Routes
│   │   ├── types/                        # Backend TypeScript definitions
│   │   ├── app.ts                        # Express application setup
│   │   └── server.ts                     # Backend server entry point
│   ├── .env.example                      # Environment variables template
│   ├── package.json                      # Backend dependencies
│   └── tsconfig.json                     # Backend TS config
│
├── docs/                                 # Architectural Documentation
│   ├── ARCHITECTURE.md                   # System Architecture & Flow Diagrams
│   ├── API_SPECIFICATION.md              # REST API Contracts
│   ├── DATABASE_SCHEMA.md                # 17-Table Data Dictionary & ER Diagram
│   ├── CSV_INGESTION_SPEC.md             # Ingestion & Rule Engine Guide
│   └── ROADMAP.md                        # Phased Delivery Roadmap
│
├── .gitignore                            # Git ignore patterns
└── README.md                             # Project Documentation
```

---

## 🔒 Security & Authentication Architecture

- **Strict Access Enforcement:** Citizens must Signup and Login. Unauthenticated visitors cannot access `/start-assessment` or protected modules.
- **Password Protection:** Passwords are never stored in plaintext; salted with `bcrypt` (12 rounds).
- **JWT Architecture:** Dual-token model (15-minute access token, 7-day refresh token).
- **Role-Based Access Control (RBAC):** Three distinct roles (`CITIZEN`, `OFFICER`, `ADMIN`).
- **Input Validation:** Every endpoint is validated with **Zod** schemas.
- **Audit Trails:** Immutable logging in `audit_logs` capturing user ID, timestamp, IP address, and payload diffs.

---

## ⚙️ Setup & Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npx prisma generate
npx prisma db push
npm run db:import-csv
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and proxy requests to `http://localhost:5000`.

---

## 🧪 Automated Verification & Test Suites

The project features comprehensive end-to-end automated test suites verifying all core logic, multi-tenant boundaries, and statutory compliance:

```bash
cd server

# Run Phase 7 Test Suite (14 scenarios)
npm run test:phase7

# Run Complete Consolidated Test Suite (Phases 4, 5, 6, 7 — 50/50 tests)
npm run test:all

# Type-check and Build Backend
npm run build

# Type-check and Build Frontend
cd ../client
npm run build
```

---

## 📄 Phase 7 Deliverables Summary

Phase 7 delivers the **Administrative Governance, State Analytics, Regulatory Audit Ledger, Dynamic Statutory Rules & RTS 2015 Appellate Grievance Portal**:
1. **Executive State Performance Analytics:** Real-time calculation of statewide investment Capex, employment generated, cross-department RTS rankings, average clearance days, and district-wise industrial investment heatmaps.
2. **Dynamic Statutory Rules Management:** Live insertion, inspection, and schema validation of deterministic JSON rule predicates without requiring server restarts.
3. **Immutable Regulatory Audit Ledger:** Secure auditing of statutory actions with client IP capture, user role tracking, and PII masking (masking emails, phone numbers, PAN, GSTIN, and Aadhaar identifiers).
4. **User Governance & Role Controls:** Administrative operational lifecycle controls (Active/Suspension toggle) with automated audit logging.
5. **Maharashtra RTS Act 2015 Statutory Appeals Mechanism:** Section 18 Citizen appeal filing, First Appellate Authority (Joint Director of Industries) & Second Appellate Authority (Principal Secretary) tiering, docket tracking, and legally binding appellate disposal orders (`DIRECTED_CLEARANCE`, `UPHELD`, `DISMISSED`) that automatically grant and advance clearances in the underlying single-window application.
6. **Frontend State Control Center (`/admin/dashboard`):** Unified executive operations console equipped with dynamic tabs for State Analytics, Statutory Rule Editor, Appeals Docket, Regulatory Audit Ledger, and User Management.
7. **Citizen Grievance Integration (`/sla-tracker`):** One-click statutory RTS appeal petition filing directly linked to application SLA countdowns.

