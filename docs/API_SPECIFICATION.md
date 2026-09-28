# REST API Specification & Architecture
## SIH26130: Industrial Approval, Compliance and Government Support Navigator

**Base URL:** `http://localhost:5000/api/v1`  
**Protocol:** HTTPS / REST over JSON  
**Authentication Scheme:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`

---

## 1. Global Response Standards

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-26T16:00:00.000Z"
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Human readable error description.",
  "errors": [
    {
      "field": "investmentPlantMachinery",
      "message": "Investment must be a positive number greater than 0."
    }
  ]
}
```

---

## 2. API Endpoints by Domain

### A. Authentication & Session Management (`/auth`)

#### 1. Citizen Registration (Signup)
- **Method & Route:** `POST /api/v1/auth/signup`
- **Access:** Public (Citizen)
- **Request Body:**
  ```json
  {
    "fullName": "Rajesh Deshmukh",
    "email": "rajesh@innovatetech.in",
    "phone": "9823012345",
    "password": "StrongPassword@2026"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Citizen registration successful. Please log in to continue.",
    "data": {
      "userId": "d748f219-c07a-4712-9c3f-cba668cba761",
      "fullName": "Rajesh Deshmukh",
      "email": "rajesh@innovatetech.in",
      "role": "CITIZEN"
    }
  }
  ```

#### 2. User Login
- **Method & Route:** `POST /api/v1/auth/login`
- **Access:** Public (Citizen, Officer, Admin)
- **Request Body:**
  ```json
  {
    "email": "rajesh@innovatetech.in",
    "password": "StrongPassword@2026"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "d748f219-c07a-4712-9c3f-cba668cba761",
        "fullName": "Rajesh Deshmukh",
        "email": "rajesh@innovatetech.in",
        "role": "CITIZEN"
      }
    }
  }
  ```

#### 3. Refresh Access Token
- **Method & Route:** `POST /api/v1/auth/refresh`
- **Request Body:** `{ "refreshToken": "..." }`
- **Response (200 OK):** `{ "accessToken": "..." }`

---

### B. Business Profiles (`/business-profiles`)

#### 1. Create or Update Business Profile
- **Method & Route:** `POST /api/v1/business-profiles`
- **Access:** Authenticated (`CITIZEN`)
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:**
  ```json
  {
    "businessName": "Maha Precision Forgings Pvt Ltd",
    "legalEntityType": "PRIVATE_LIMITED",
    "industrySector": "Automotive Engineering",
    "nicCode": "25910",
    "businessActivity": "Manufacturing of forged automotive components and transmission gears",
    "district": "Pune",
    "taluka": "Khed",
    "pinCode": "410501",
    "isMidcArea": true,
    "midcEstateName": "Chakan Industrial Area Phase II",
    "landAreaSqm": 4500.0,
    "builtUpAreaSqm": 2800.0,
    "investmentPlantMachinery": 85000000.0,
    "investmentLandBuilding": 45000000.0,
    "annualTurnover": 150000000.0,
    "employeeCount": 65,
    "powerRequirementKva": 450.0,
    "waterRequirementKld": 25.0,
    "waterSource": "MIDC",
    "pollutionCategory": "ORANGE",
    "effluentDischargeKld": 8.5,
    "hazardousWasteGeneration": true,
    "hasBoiler": false,
    "hasDgSet": true,
    "dgSetCapacityKva": 250.0,
    "gstRegistered": true,
    "gstin": "27AAACM1234F1Z5",
    "msmeRegistered": true,
    "udyamNumber": "UDYAM-MH-26-0012345"
  }
  ```
- **Response (201 Created / 200 OK):** Profile entity with ID.

---

### C. Smart Approval Assessment (`/assessments`)

#### 1. Evaluate Applicable Approvals (Rule Engine Trigger)
- **Method & Route:** `POST /api/v1/assessments/evaluate`
- **Access:** Authenticated (`CITIZEN`)
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Request Body:** `{ "businessProfileId": "uuid" }` OR raw profile JSON for on-the-fly calculation.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "totalApplicableApprovals": 4,
        "departmentsCount": 3,
        "maxSlaWorkingDays": 45
      },
      "approvals": [
        {
          "approvalCode": "MPCB_CTE",
          "name": "Consent to Establish (CTE)",
          "departmentCode": "MPCB",
          "departmentName": "Maharashtra Pollution Control Board",
          "stage": "PRE_ESTABLISHMENT",
          "statutoryAct": "Water Act 1974, Air Act 1981",
          "statutoryTimelineDays": 45,
          "triggerReason": "Your industrial unit is classified under the ORANGE category by MPCB, mandating a Consent to Establish prior to any physical construction or machine installation.",
          "requiredDocCodes": ["DOC_PAN", "DOC_PROJECT_REPORT", "DOC_SITE_PLAN", "DOC_POLLUTION_SCHEME"],
          "feeStructureDetails": "Tiered based on capital investment",
          "renewalRequired": false
        },
        {
          "approvalCode": "DISH_FACT_LIC",
          "name": "Factory Registration and License",
          "departmentCode": "DISH",
          "departmentName": "Directorate of Industrial Safety and Health",
          "stage": "PRE_OPERATION",
          "statutoryAct": "Factories Act 1948 Section 6",
          "statutoryTimelineDays": 30,
          "triggerReason": "Your enterprise employs 65 workers and utilizes power, fulfilling the statutory definition of a factory under Section 2(m)(i) of the Factories Act, 1948.",
          "requiredDocCodes": ["DOC_SITE_PLAN", "DOC_STABILITY_CERTIFICATE", "DOC_FLOW_CHART"],
          "renewalRequired": true
        }
      ],
      "consolidatedDocumentChecklist": [
        { "code": "DOC_PAN", "title": "Company PAN Card", "isMandatory": true },
        { "code": "DOC_PROJECT_REPORT", "title": "Detailed Project Report (DPR)", "isMandatory": true },
        { "code": "DOC_SITE_PLAN", "title": "Factory Site Layout Blueprint", "isMandatory": true }
      ]
    }
  }
  ```

---

### D. Applications & Parallel Clearance (`/applications`)

#### 1. Create Application from Assessment
- **Method & Route:** `POST /api/v1/applications`
- **Access:** Authenticated (`CITIZEN`)
- **Request Body:** `{ "businessProfileId": "uuid", "projectStage": "PRE_ESTABLISHMENT" }`
- **Response (201 Created):** Application entity with auto-generated `applicationNumber` (e.g. `MH-NAV-2026-1049`).

#### 2. Submit Application for Parallel Department Processing
- **Method & Route:** `POST /api/v1/applications/:id/submit`
- **Access:** Authenticated (`CITIZEN`)
- **Response (200 OK):** Broadcasts application to relevant `application_departments` and initializes SLA counters.

---

### E. Documents & Verified Wallet (`/documents`)

#### 1. Secure File Upload
- **Method & Route:** `POST /api/v1/documents/upload`
- **Access:** Authenticated (`CITIZEN`)
- **Content-Type:** `multipart/form-data`
- **Payload:** File binary (`file`), `documentTypeCode`, `saveToWallet` (boolean).
- **Processing:** Validates MIME type, calculates SHA-256 hash, queues for AI OCR verification assist.

---

### F. Common Inspection Scheduler (`/inspections`)

#### 1. Schedule Joint Department Inspection
- **Method & Route:** `POST /api/v1/inspections/schedule`
- **Access:** Authenticated (`OFFICER`, `ADMIN`)
- **Request Body:**
  ```json
  {
    "applicationId": "uuid",
    "departmentIds": ["uuid-mpcb", "uuid-dish", "uuid-fire"],
    "scheduledDate": "2026-10-15T10:00:00Z",
    "inspectionType": "JOINT_COMMON_INSPECTION",
    "siteAddress": "Plot C-12, MIDC Chakan Phase II, Pune"
  }
  ```

---

### G. Officer Desk & Scrutiny (`/officer`)

#### 1. Officer Dashboard Metrics
- **Method & Route:** `GET /api/v1/officer/dashboard`
- **Access:** Authenticated (`OFFICER`, `ADMIN`)
- **Response (200 OK):** Pending scrutinies, SLA breach warnings, upcoming joint inspections, active queries.

#### 2. Raise Clarification Query
- **Method & Route:** `POST /api/v1/queries`
- **Access:** Authenticated (`OFFICER`)
- **Request Body:**
  ```json
  {
    "applicationId": "uuid",
    "applicationApprovalId": "uuid",
    "querySubject": "Clarification on ETP Wastewater Flow Chart",
    "queryDescription": "The provided DPR indicates 8.5 KLD effluent, but the proposed ETP design schematic shows capacity for only 5 KLD."
  }
  ```
