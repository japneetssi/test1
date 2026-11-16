# WealthMax Comprehensive Technical Audit: Architecture, Workflow & Vulnerability Analysis

> **Audit Context**: Conducted using the **ECC (Agentic Engineering & Code Review Framework)** methodology.
> **Date**: October 2026  
> **Target Path**: `c:\Users\Japneet Singh Anand\Downloads\Wealthmax-main`  
> **Status**: Read-only Architecture & Quality Analysis (No application code modified).

---

## Table of Contents
1. [Executive Summary & Core Mission](#1-executive-summary--core-mission)
2. [Workspace & Directory Structure](#2-workspace--directory-structure)
3. [Technology Stack & System Topology](#3-technology-stack--system-topology)
4. [How the System Works: End-to-End Workflows](#4-how-the-system-works-end-to-end-workflows)
   - [4.1 Authentication & Role-Based Access Control](#41-authentication--role-based-access-control)
   - [4.2 Onboarding, Profiling & The Persona Engine](#42-onboarding-profiling--the-persona-engine)
   - [4.3 Portfolio Ingestion & CAS PDF Parser](#43-portfolio-ingestion--cas-pdf-parser)
   - [4.4 Marketplace, Data Aggregation & Synchronization Crons](#44-marketplace-data-aggregation--synchronization-crons)
   - [4.5 Option Wealth & Covered Call Margin Engine](#45-option-wealth--covered-call-margin-engine)
   - [4.6 Tax Planning & Dual Regime Engine](#46-tax-planning--dual-regime-engine)
   - [4.7 Advisory Console, White-Labeling & Multi-Engine PDF Reports](#47-advisory-console-white-labeling--multi-engine-pdf-reports)
   - [4.8 Family Financial Aggregation Hub](#48-family-financial-aggregation-hub)
5. [In-Depth Codebase & Module Inventory](#5-in-depth-codebase--module-inventory)
6. [Comprehensive Catalog of Mistakes, Bugs & Security Vulnerabilities](#6-comprehensive-catalog-of-mistakes-bugs--security-vulnerabilities)
   - [Severity: CRITICAL (Immediate Exploits & Data Leaks)](#severity-critical-immediate-exploits--data-leaks)
   - [Severity: HIGH (Runtime Crashes & Broken Core Workflows)](#severity-high-runtime-crashes--broken-core-workflows)
   - [Severity: MEDIUM (Financial Calculation & Business Logic Errors)](#severity-medium-financial-calculation--business-logic-errors)
   - [Severity: LOW / CODE HEALTH (Repository Hygiene, Antipatterns & Dead Code)](#severity-low--code-health-repository-hygiene-antipatterns--dead-code)
7. [System Remediation & Modernization Roadmap](#7-system-remediation--modernization-roadmap)

---

## 1. Executive Summary & Core Mission

**WealthMax** is an enterprise-grade Indian Wealth Management and Advisory SaaS platform. It bridges the gap between retail investors, Registered Investment Advisors (RIAs), Relationship Managers (RMs), and Wealth Partner Agencies.

### Core Business Pillars
1. **Automated Personal Financial Planning**: Benchmarking investor cashflows against the **30-30-30-10 Indian Personal Finance Rule** (30% Necessities, 30% Debt/EMI, 30% Long-term Investments, 10% Liquidity/Emergency).
2. **Psychometric & Risk Behavioral Profiling**: A 25-question behavioral risk survey coupled with dynamic contradiction detection, classifying clients into **Conservative**, **Moderate**, or **Aggressive** profiles and assigning one of three core financial personas (**A: Early Career Builder**, **B: Growth Strategist**, **C: Wealth Preserver**).
3. **Automated Portfolio Aggregation**: Ingestion of CAMS & KFintech Consolidated Account Statements (CAS) in PDF/CSV format to automatically populate mutual fund and equity holdings with automated transaction reconstruction.
4. **Marketplace & Real-Time Intelligence**: Synchronized master data from **AMFI (Association of Mutual Funds in India)**, **MFAPI/FinAPI**, **IIFL Capital**, and **Yahoo Finance**.
5. **Option Wealth & Yield Optimization**: Loan-to-value (LTV) margin calculation for collateralized holdings (pledging direct equities at 50% and debt mutual funds at 80%) to generate monthly cashflows via covered call option strategies.
6. **Multi-Tenant White-Labeling & Automated Advisory Reporting**: Allowing partner agencies and advisors to brand the portal and generate multi-page institutional PDF advisory dossiers for clients.

---

## 2. Workspace & Directory Structure

The current folder layout on disk displays a double-nested structure created by unzipping GitHub releases alongside a separate git repository clone:

```
c:\Users\Japneet Singh Anand\Downloads\Wealthmax-main\
│
├── .git\                              # Root git configuration
├── .gitattributes                     # Git LFS & line ending attributes
├── what its doing and misstake.md     # THIS AUDIT DOCUMENT
│
├── weathmx\                           # Secondary git clone (origin: https://github.com/japneetssi/weathmx.git)
│   └── .git\
│
└── Wealthmax-main\                    # Primary active application workspace
    ├── README.md                      # Setup and run instructions
    ├── .gitignore
    ├── patch.py                       # Ad-hoc Python script patching FinancialDashboard.tsx
    ├── fix_bluechips.py               # Standalone script (contains HARDCODED live credentials)
    ├── fix_all_bluechips.py           # Standalone script (contains HARDCODED live credentials)
    ├── download_prices.py             # Script downloading prices via yfinance
    ├── test-yahoo.js                  # Node.js scratch testing Yahoo Finance endpoints
    │
    ├── scripts\                       # Utility & database population scripts
    │   ├── fix_all_bluechips.py       # Duplicated bluechip script with live credentials
    │   ├── populate-equity-prices.js  # Node.js script with live credentials
    │   └── populate_yfinance.py       # Python script with live credentials
    │
    ├── backend\                       # Express + Node.js + TypeScript REST API
    │   ├── package.json               # Backend dependencies (express, pg, zod, etc.)
    │   ├── tsconfig.json              # TypeScript compilation config
    │   ├── .env.example               # Backend environment variables template (contains leaked IIFL keys)
    │   ├── nodemon.json
    │   ├── seed.js                    # Database seeder
    │   ├── seed_indices.ts            # Nifty/Sensex index seed script
    │   ├── seed_partner.js            # Partner agency seed script
    │   ├── migrate_metadata.ts        # Metadata migration runner
    │   ├── run_migration.ts
    │   ├── scratch-*.ts / *.js        # 30+ experimental scratch scripts left in backend root
    │   │
    │   ├── migrations\                # 42 node-pg-migrate JavaScript migration scripts
    │   │   ├── 1768204080743_initial-schema.js
    │   │   ├── 1768822523000_add-portfolio-tables.js
    │   │   ├── 1769133284000_add-transactions-table.js
    │   │   ├── 1773131000000_create_partner_agencies_and_metrics.js
    │   │   ├── 1784000000000_add_modular_financial_data.js
    │   │   ├── 1786000000000_mfapi-schema.js
    │   │   └── 1787000000000_iifl-instruments-schema.js
    │   │
    │   └── src\
    │       ├── app.ts                 # Express application configuration & middleware
    │       ├── server.ts              # Server bootstrap & background cron job scheduler
    │       ├── config\                # Database (pg pool), Redis, Winston logger, Env configuration
    │       ├── controllers\           # 28 Express request controllers
    │       ├── cron\                  # Background tasks
    │       ├── data\                  # Static configuration & initial seed data
    │       ├── middleware\            # Auth (JWT), Validation (Zod), Impersonation, Multer Upload
    │       ├── models\                # 15 PostgreSQL data access models
    │       ├── routes\                # 26 modular REST router definitions
    │       ├── services\              # 42 business logic services (PDF, Analytics, Profiling, etc.)
    │       ├── types\                 # Domain interfaces & TypeScript definitions
    │       ├── utils\                 # Helper functions & math routines
    │       └── validation\            # Zod validation schemas
    │
    └── frontend\                      # React 18 + Vite + TailwindCSS + Radix/shadcn UI
        ├── package.json               # Frontend dependencies
        ├── vite.config.ts             # Vite bundler configuration
        ├── tailwind.config.ts         # Design tokens & color system
        ├── index.html                 # HTML entry point
        ├── fix.py                     # String replacement patch script
        ├── fix_responsive.py          # Responsive layout replacement patch script
        ├── eslint_report.json         # 628KB generated linter dump
        ├── components.json            # shadcn/ui configuration
        │
        ├── supabase\                  # Orphaned Supabase migration folder
        │   └── migrations\
        │       └── 20250602000000_financial_dashboard_tables.sql # Unapplied financial tables
        │
        └── src\
            ├── App.tsx                # Client-side router & route transitions
            ├── main.tsx               # DOM bootstrap
            ├── index.css              # Core Tailwind & custom CSS variables
            ├── assets\                # Logos and graphic assets
            ├── components\            # Modular UI components (marketplace, financial, partner, ui)
            ├── contexts\              # React contexts (AuthContext, BrandingContext, InvestmentCartContext)
            ├── hooks\                 # Custom React hooks (useToast, etc.)
            ├── integrations\          # Unused Supabase client instantiation
            ├── lib\                   # Axios API client instance (`api.ts`), financial math
            ├── pages\                 # 36 application pages (Dashboard, Survey, Portfolio, CRM, etc.)
            ├── services\              # Frontend API client abstraction layer
            └── types\                 # TypeScript interfaces
```

---

## 3. Technology Stack & System Topology

| Tier | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18.3, TypeScript 5.8, Vite 5.4 | High-performance Single Page Application (SPA) |
| **Styling & Components** | TailwindCSS 3.4, shadcn/ui, Radix Primitives, Framer Motion | Design system with smooth animations & data tables |
| **Data Fetching & State** | TanStack React Query v5, Axios, Native Context API | Server state caching, optimistic updates, global auth |
| **Backend Runtime** | Node.js (v18+), Express 4.22, TypeScript 5.7 | Modular REST API server |
| **Primary Database** | PostgreSQL (hosted on AWS via Supabase Pooler) | Relational data persistence with JSONB document columns |
| **Database Migrations** | `node-pg-migrate` | Versioned schema migration files in JavaScript |
| **Caching Layer** | Redis (`ioredis`) with in-memory fallback | Market quotes, scheme search results, and session caching |
| **Document Processing** | `pdfkit`, `pdf-parse`, `html2pdf.js`, `jspdf`, `html2canvas` | Parsing investor CAS PDFs and rendering advisory dossiers |
| **Task Scheduling** | `node-cron` | In-process cron jobs for AMFI, MFAPI, and IIFL synchronization |
| **External Integrations** | AMFI India, FinAPI/MFAPI, IIFL Capital, Yahoo Finance, Nodemailer | Financial market data, execution contracts, and email OTPs |

---

## 4. How the System Works: End-to-End Workflows

```mermaid
graph TD
    User([User / Advisor / Partner]) -->|Browser| FE[React / Vite Frontend]
    FE -->|Axios REST / Bearer JWT| BE[Express Node.js Backend]
    
    subgraph Backend Services
        BE --> Auth[Auth & Impersonation Engine]
        BE --> Prof[Profiling & Persona Engine]
        BE --> Port[Portfolio & CAS Parser]
        BE --> Market[Marketplace & Yield Engine]
        BE --> Rep[Advisory PDF Engine V1/V2/V3]
        BE --> Cron[Node-Cron Sync Scheduler]
    end
    
    subgraph Persistence & External
        BE --> DB[(PostgreSQL Database)]
        BE --> Cache[(Redis Cache / In-Memory)]
        Cron -->|23:00 IST| AMFI[AMFI India NAV]
        Cron -->|02:00 IST| MFAPI[FinAPI Scheme Master]
        Cron -->|04:00 IST| IIFL[IIFL Capital Contracts]
        Market --> YF[Yahoo Finance API]
        Auth --> SMTP[Nodemailer SMTP]
    end
```

### 4.1 Authentication & Role-Based Access Control
1. **User Identifier Flow**: The platform operates on a **passwordless OTP paradigm**. A user provides either an email address or an Indian mobile number (`+91...`).
2. **OTP Generation & Verification**:
   - `POST /api/v1/auth/otp/request` triggers `OTPService.generateOTP` or `generateEmailOTP`, caching a 6-digit random code with a 5-minute TTL.
   - `POST /api/v1/auth/otp/verify` verifies the submitted code.
3. **Session Issuance**: Upon successful verification, the backend issues an HMAC-SHA256 signed JSON Web Token (JWT) with user metadata (`id`, `email`, `role`, `partner_id`).
4. **RBAC Hierarchy**:
   - `admin`: Super-administrator with access to firm onboarding and global metrics.
   - `partner`: Principal wealth firm with access to firm-wide analytics, advisor rosters, and client reassignments.
   - `advisor` / `relationship_manager`: Financial intermediaries managing assigned client lists and pipeline prospects.
   - `user`: Retail investor viewing their personal dashboard, portfolio, and reports.
5. **Advisor Impersonation Middleware**:
   - Advisors can pass `?userId=<clientId>` on protected endpoints.
   - `impersonation.middleware.ts` validates that the client is assigned to the advisor and injects `targetUserId` into the request lifecycle.

### 4.2 Onboarding, Profiling & The Persona Engine
1. **Financial Baseline Snapshot (`/financial-snapshot`)**:
   - Captures Date of Birth, occupation, marital status, dependents, and PAN.
   - Captures detailed cashflow arrays: primary/secondary income, household fixed expenses, liabilities/EMIs, existing asset classes, and safety nets.
2. **25-Question Behavioral Survey (`/survey`)**:
   - Evaluates risk tolerance across multiple psychological dimensions.
   - Analyzes questions for contradiction (e.g., asserting high risk appetite while demanding capital guarantees).
   - If severe contradictions exist, the engine automatically downgrades the risk class from Aggressive $\rightarrow$ Moderate or Moderate $\rightarrow$ Conservative.
3. **Algorithmic Persona Classification**:
   - **Persona C (Wealth Preserver)**: Triggered if client Age $> 50$. Focuses on fixed income, wealth preservation, and inheritance planning.
   - **Persona A (Early Career Builder)**: Triggered if client Age $\le 35$ and Gross Income $\le ₹18,00,000$. Focuses on automated SIPs and emergency liquidity.
   - **Persona B (Growth Strategist)**: Default for mid-career and high-earning individuals. Focuses on tax optimization, equities, and aggressive capital appreciation.
4. **Action Item Generation**:
   - Analyzes deviations against the **30-30-30-10 rule** and populates personalized, prioritized financial milestones in the `action_items` table.

### 4.3 Portfolio Ingestion & CAS PDF Parser
1. **Upload**: Users upload a monthly CAMS or KFintech CAS PDF statement with an optional password.
2. **Extraction Engine (`casParser.service.ts`)**:
   - Utilizes `pdf-parse` to convert binary PDF streams to raw text.
   - Employs regular expressions (`/\b(INF[A-Z0-9]{9})\b/g`) to locate Indian Mutual Fund ISINs.
   - Extracts folio numbers, scheme names, cumulative units, purchase dates, and latest NAVs.
3. **Holding Upsertion**:
   - Creates or updates records in `user_portfolios` and `portfolio_holdings`.
   - Records individual transactions in `portfolio_transactions` with duplicate detection.
4. **Portfolio Alignment**:
   - Calculates the asset allocation ratio (Equity % vs. Debt % vs. Cash %) and scores alignment against the user's assigned risk class.

### 4.4 Marketplace, Data Aggregation & Synchronization Crons
1. **Catalog Pipeline**:
   - Offers searchable catalogs for direct mutual funds and equities.
   - Real-time quote enrichment from Yahoo Finance (`yahoo-finance2`) with Redis caching (15-minute TTL).
2. **Automated Cron Jobs (`server.ts`)**:
   - **17:30 UTC (23:00 IST)**: Downloads the official `NAVAll.txt` daily NAV feed from the AMFI India website, bulk-updating scheme valuations.
   - **20:30 UTC (02:00 IST)**: Synchronizes master scheme lists from FinAPI/MFAPI.
   - **21:30 UTC (03:00 IST)**: Hydrates scheme fundamentals (AUM, expense ratios, fund managers) for top active funds.
   - **22:30 UTC (04:00 IST)**: Synchronizes tradable equity contracts from IIFL Capital into `iifl_instruments`.

### 4.5 Option Wealth & Covered Call Margin Engine
1. **Collateral Evaluation (`optionWealth.service.ts`)**:
   - Evaluates user holdings to determine eligible margin under SEBI collateral pledging rules.
   - Applies standard haircut / LTV: Direct Equities $\rightarrow 50\%$, Debt Mutual Funds $\rightarrow 80\%$.
2. **Covered Call Opportunity Discovery**:
   - Scans direct equity positions with a market value exceeding ₹5,00,000 (standard Indian F&O lot threshold).
   - Projects a monthly covered call yield estimate (modeled conservatively at 1.5% monthly premium).

### 4.6 Tax Planning & Dual Regime Engine
1. **Comparison Engine (`tax.service.ts`)**:
   - Accepts gross annual income, salaried status, Section 80C investments, 80D health insurance, NPS 80CCD(1B), and Section 24(b) home loan interest.
   - Calculates income tax liability under both the **Old Tax Regime** and the **New Tax Regime (FY 2024-25 Budget)**.
   - Computes Section 87A tax rebates (full rebate up to ₹5L in Old Regime, up to ₹7L in New Regime) and 4% Health & Education Cess.
2. **Recommendation**:
   - Automatically recommends the regime with lower liability, computes exact rupee savings, and highlights deduction gaps.

### 4.7 Advisory Console, White-Labeling & Multi-Engine PDF Reports
1. **Advisor Dashboard**:
   - Provides advisors with client AUM, pending KYC approvals, risk distributions, and automated nudges.
2. **White-Labeling**:
   - Partner firms upload logos (`uploadLogo` multer middleware) and select brand colors.
   - The branding context dynamically injects partner styles and logos into client headers and reports.
3. **PDF Generation Architecture**:
   - **V1 (`pdf.service.ts`)**: Generates raw HTML templates for client-side rendering.
   - **V2 (`pdfV2.service.ts`)**: Generates modular white-labeled summaries.
   - **V3 (`pdfV3.service.ts`)**: A 150KB institutional report generator using PDFKit, producing 10+ page dossiers with asset breakdowns, gap analysis, and advisor signatures.

### 4.8 Family Financial Aggregation Hub
1. **Unit Creation**:
   - Enables firm-associated clients to establish a family wealth group.
2. **Consolidated Rollup**:
   - Aggregates portfolio holdings, asset allocations, and insurance safety nets across all family members.
   - Enables shared family financial goals (e.g., child education or home purchase).

---

## 5. In-Depth Codebase & Module Inventory

### Backend Route & Controller Mapping
| Router File | Controller File | Purpose | Auth Required | Roles Permitted |
| :--- | :--- | :--- | :---: | :--- |
| `auth.routes.ts` | `auth.controller.ts`, `invite.controller.ts` | OTP Login, User Registration, Advisor Invites | Partial | Public / Any Authenticated |
| `admin.routes.ts` | `admin.controller.ts` | Super Admin Dashboard & Partner Onboarding | Yes | `admin` |
| `partner.routes.ts`| `partner.controller.ts` | Firm Metrics, Advisor Roster, White-labeling | Yes | `partner` (Public branding endpoint protected by auth) |
| `advisor.routes.ts`| `advisor.controller.ts`, `portfolioReview.controller.ts` | Client Management, Proposals, Reviews | Yes | `advisor` |
| `rm.routes.ts` | `rm.controller.ts`, `onboarding.controller.ts` | Client Search, Kanban Onboarding Pipeline | Yes | **None checked (BROKEN ACCESS CONTROL)** |
| `profile.routes.ts`| `profile.controller.ts` | Profile CRUD, Gap Analysis, Action Items | Yes | Any Authenticated User |
| `financial.routes.ts`| `financial.controller.ts` | Modular Incomes, Expenses, Assets, Liabilities | Yes | Any Authenticated User |
| `portfolio.routes.ts`| `portfolio.controller.ts` | Holdings, CAS Upload, Analytics Snapshots | Yes | Any Authenticated User (supports impersonation) |
| `marketplace.routes.ts`| `marketplace.controller.ts` | Catalog, Recommendations, MFAPI Sync | No (mostly) | Public (**Sync endpoint has no auth**) |
| `equity.routes.ts` | `equity.controller.ts` | Stock Quotes, Valuations, Financial Statements | No | Public |
| `equityDashboard.routes.ts`| `equityDashboard.controller.ts` | Market Indices, Top Gainers, Movers | No | Public (**All data is hardcoded mock**) |
| `survey.routes.ts` | `survey.controller.ts` | 25 Questions, Risk Calculation | Yes | Any Authenticated User |
| `calculator.routes.ts`| `calculator.controller.ts` | SIP, EMI, Retirement, Lumpsum Math | No | Public |
| `tax.routes.ts` | `tax.controller.ts` | Old vs New Regime Optimizer | No | Public |
| `family.routes.ts` | `family.controller.ts` | Family Creation, Aggregated Portfolios | Yes | Users with `partner_id` |
| `pdf.routes.ts` | `pdf.controller.ts` | Advisory Report Downloads (V1, V2, V3) | Yes | Any Authenticated User |
| `plaid.routes.ts` | `plaid.controller.ts` | Western Bank Aggregation (US/UK/CA) | Yes | Any Authenticated User |
| `debug.routes.ts` | `debug.controller.ts` | Scheme Hydration Debugging | No | **Public (Dumps stack traces)** |

---

## 6. Comprehensive Catalog of Mistakes, Bugs & Security Vulnerabilities

### Severity: CRITICAL (Immediate Exploits & Data Leaks)

#### 1. Live Production Database Credentials & Supabase Service Role Key Committed to Git
* **Locations**:
  - `frontend/.env.example` (Lines 1-9)
  - `fix_bluechips.py` (Line 4)
  - `fix_all_bluechips.py` (Line 4)
  - `scripts/fix_all_bluechips.py` (Line 4)
  - `scripts/populate_yfinance.py` (Line 6)
  - `scripts/populate-equity-prices.js` (Line 18)
* **Evidence**:
  ```python
  DATABASE_URL = "postgresql://postgres.hjljksufiquaoihgsmvq:WeathMax2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
  ```
  And in `frontend/.env.example`:
  ```env
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbGprc3VmaXF1YW9paGdzbXZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMjcwMywiZXhwIjoyMDk0MzA4NzAzfQ.kFEHI8ejEzV2IoroepmG7lEho41gBk1bvgWkUlQ6YRw"
  SUPABASE_PASSWORD="WeathMax2026"
  VITE_GEMINI_API_KEY="AIzaSyB59FIyBApfIcUbPhz7RHDZoRW5gV2iwsk"
  ```
* **Impact**: The **Supabase Service Role Key** grants unrestricted administrative access that completely bypasses Row-Level Security (RLS). The database credentials allow direct connection and destruction of the AWS AP-Northeast-2 PostgreSQL instance. The Google Gemini API key is also exposed.

#### 2. Plaintext OTP Exposed in HTTP Response Body
* **Location**: `backend/src/controllers/auth.controller.ts` (Lines 48-55)
* **Evidence**:
  ```typescript
  const otp = await AuthService.requestOTP(identifier);
  return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: { otp } // Dev only
  });
  ```
* **Impact**: Any unauthenticated attacker can supply any registered phone number or email to `/api/v1/auth/otp/request` and instantly receive the active login OTP in the response payload, taking over any account on the platform.

#### 3. Permanent Universal Backdoor OTP in Production
* **Location**: `backend/src/services/otp.service.ts` (Lines 27-30 & 65-69)
* **Evidence**:
  ```typescript
  // Development/Demo mock OTP
  if (otp === '123456') {
      logger.info(`Mock Mobile OTP verified for ${mobile}`);
      return true;
  }
  ```
* **Impact**: The bypass contains **no environment check** (`if (process.env.NODE_ENV === 'development')`). An attacker can log into any user, advisor, partner, or admin account by providing `123456` as the OTP.

#### 4. Hardcoded IIFL Capital Secret Keys in Source Code
* **Locations**:
  - `backend/src/services/iiflapi.service.ts` (Lines 9-10)
  - `backend/.env.example` (Lines 48-49)
* **Evidence**:
  ```typescript
  const APP_KEY = process.env.IIFL_APP_KEY || 'xfi92yf7ULjSxyJ';
  const APP_SECRET_KEY = process.env.IIFL_APP_SECRET_KEY || 'IhkYNtmwKQ6LjvZizEYLenWSSMAKaOFWr7RbOsVnsRkaqHMFNMlElV8mcXoRSuOw2fiKuJsinwJ08jSlvw7l1pmgY1XWTJIse1za';
  ```
* **Impact**: Production broker API credentials are embedded in repository source files.

---

### Severity: HIGH (Runtime Crashes & Broken Core Workflows)

#### 5. Fatal Database Crash in Gap Analysis: Non-Existent Tables
* **Location**: `backend/src/routes/profile.routes.ts` (Lines 38-50)
* **Evidence**:
  ```sql
  SELECT gross_income, fixed_expenses, emergency_fund_amount,
         COALESCE((SELECT SUM(amount) FROM financial_transactions WHERE user_id = $1 AND transaction_type = 'emi'), 0) as total_emi
  FROM user_profiles
  WHERE user_id = $1
  ```
* **Impact**:
  - The PostgreSQL table name created by migration `1768204080743_initial-schema.js` is `profiles`, **not** `user_profiles`.
  - The transactions table is `portfolio_transactions`, **not** `financial_transactions`.
  - Calling `GET /api/v1/profile/gap-analysis` immediately throws a 500 error: `relation "user_profiles" does not exist`.

#### 6. Missing Relational Financial Tables (`incomes`, `expenses`, etc.)
* **Location**: `backend/src/models/financial.model.ts` (Lines 28, 40, 68, etc.)
* **Root Cause**:
  - `IncomeModel`, `ExpenseModel`, `AssetModel`, `LiabilityModel`, and `SafetyNetModel` perform direct SQL queries against `incomes`, `income_sources`, `expenses`, `assets`, etc.
  - These tables exist **only** in an unapplied SQL file located in `frontend/supabase/migrations/20250602000000_financial_dashboard_tables.sql`.
  - The actual backend migration `1784000000000_add_modular_financial_data.js` added JSONB columns (`income_details`, `expense_details`, etc.) to the `profiles` table instead of creating separate tables.
* **Impact**: Every endpoint under `/api/v1/financial/*` (`/income`, `/expense`, `/asset`, `/liability`, `/safety-net`, `/all`) crashes with table relation errors.

#### 7. Broken Access Control: Relationship Manager Routes Completely Unprotected
* **Location**: `backend/src/routes/rm.routes.ts` (Lines 8-21)
* **Evidence**:
  ```typescript
  router.get('/clients', authenticateToken, RMController.getClients);
  router.delete('/onboarding/:id', authenticateToken, OnboardingController.deleteProspect);
  ```
* **Impact**: None of the routes in `rm.routes.ts` include `authorizeRoles('relationship_manager', 'advisor')`. Any authenticated retail client can view all RM clients, access internal metrics, and delete onboarding prospects.

#### 8. Partner Multi-Tenant Isolation Breach in Impersonation
* **Location**: `backend/src/middleware/impersonation.middleware.ts` (Lines 26-38)
* **Evidence**:
  ```typescript
  if (user.role === 'advisor') {
      const client = await UserModel.findById(requestedUserId);
      if (!client || client.advisor_id !== user.id) {
          res.status(403).json({ success: false, message: 'Unauthorized' });
          return;
      }
  }
  // admin and partner implicitly bypass the specific ownership check above
  ```
* **Impact**: The middleware enforces client ownership checks for `advisor`, but **partner** bypasses it completely. Any partner firm can impersonate and modify clients belonging to competitor partner agencies.

#### 9. Public Denial-of-Service Vector on Batch Sync
* **Location**: `backend/src/routes/marketplace.routes.ts` (Line 17)
* **Evidence**:
  ```typescript
  router.post('/sync-mfapi', MarketplaceController.triggerSync);
  ```
* **Impact**: Completely unauthenticated. Anyone on the internet can repeatedly send POST requests to trigger intensive downloads and batch inserts of tens of thousands of mutual fund records.

#### 10. Public Debug Route Dumping Internal Stack Traces
* **Location**: `backend/src/routes/debug.routes.ts` (Line 4) and `debug.controller.ts` (Lines 8-15)
* **Impact**: `/api/v1/debug/:id` has no authentication and outputs raw error stack traces, SQL errors, and internal scheme metadata.

#### 11. Broken Client Token Refresh Mechanism
* **Location**: `frontend/src/lib/api.ts` (Lines 71-78)
* **Impact**:
  - The Axios response interceptor catches 401s and attempts to call `POST /auth/refresh-token`.
  - The backend `auth.routes.ts` has **no refresh token route**.
  - Token refresh requests return 404, triggering an immediate redirect to `/login` and trapping the user in an authentication loop.

#### 12. Public Branding Endpoint Blocked by Authentication
* **Location**: `backend/src/routes/partner.routes.ts` (Line 31)
* **Evidence**:
  ```typescript
  router.get('/public-branding/:id', authenticateToken, PartnerController.getPublicBranding);
  ```
* **Impact**: The endpoint is named `public-branding`, and the frontend attempts to fetch branding on public landing, signup, and invite pages before login. Because `authenticateToken` is required, the request fails with 401.

#### 13. Duplicate Route Definitions Shadowing Controllers
* **Location**: `backend/src/routes/advisor.routes.ts` (Lines 26-31 and Lines 67-72)
* **Evidence**:
  ```typescript
  router.get('/portfolio-review/:clientId', authenticateToken, authorizeRoles('advisor'), AdvisorController.getPortfolioReview);
  ...
  router.get('/portfolio-review/:clientId', authenticateToken, authorizeRoles('advisor'), PortfolioReviewController.getPortfolioReview);
  ```
* **Impact**: Route defined twice with two different controller handlers. The second handler (`PortfolioReviewController.getPortfolioReview`) is shadowed and will never execute.

---

### Severity: MEDIUM (Financial Calculation & Business Logic Errors)

#### 14. Nonsensical Dimension Math in Profile Investment Percentage
* **Location**: `backend/src/routes/profile.routes.ts` (Lines 72-74)
* **Evidence**:
  ```typescript
  const investmentMonthly = investmentRows && investmentRows[0]?.total_invested ? 
      Math.round((investmentRows[0].total_invested / 365 / 30 / monthlyGrossIncome) * 100) : 0;
  ```
* **Impact**: Divides total portfolio valuation by 365 and then by 30 ($365 \times 30 = 10,950$), yielding a minuscule fraction that has no financial meaning.

#### 15. Intraday Prices Mapped as 52-Week High/Low
* **Location**: `Wealthmax-main/Wealthmax-main/download_prices.py` (Lines 9-30)
* **Evidence**:
  ```python
  data = yf.download(tickers, period="1d", ...)
  ...
  "week_52_high": high,
  "week_52_low": low
  ```
* **Impact**: The script fetches only 1 day of price data (`period="1d"`), but maps the single day's high and low as the **52-Week High** and **52-Week Low**.

#### 16. Incorrect Frequency Normalization for Quarterly Expenses
* **Location**: `frontend/src/pages/FinancialSnapshot.tsx` (Lines 143-148)
* **Evidence**:
  ```typescript
  const normalizeExpensesToMonthly = (amount: number, freq: string) => {
      if (freq === 'Quarterly') return amount / 4; // WRONG: A quarter has 3 months
  ```
* **Impact**: While income divides by 3 (`amount / 3`), quarterly expenses divide by 4, deflating monthly expense numbers by 25%.

#### 17. Hardcoded 20% Circuit Bands Violating Indian Market Rules
* **Location**: `backend/src/services/equity.service.ts` (Lines 216-235)
* **Impact**: The service sets upper circuit at $+20\%$ and lower circuit at $-20\%$ for all stocks. In NSE/BSE:
  - F&O securities have no fixed price bands (dynamic 10% flexing).
  - High-volatility and SME stocks have 5% or 10% circuits.
  - Presenting hardcoded 20% circuits to users produces inaccurate risk data.

#### 18. First-Time Onboarding Persona Assignment Defaults to Age 30
* **Location**: `backend/src/controllers/profile.controller.ts` (Lines 31-43 and 108-124)
* **Impact**:
  - `ProfileController.updateProfile` calculates age from `user?.dob` from the database.
  - On first onboarding submission, the date of birth is in `req.body.dob`, but not yet persisted to `users.dob`.
  - The controller falls back to default `finalAge = 30`, running the persona classification algorithm with age 30 regardless of the user's actual DOB.

#### 19. Blocking Independent Retail Users from Family Wealth Management
* **Location**: `backend/src/controllers/family.controller.ts` (Lines 16-18)
* **Evidence**:
  ```typescript
  if (!partnerId) {
      return res.status(400).json({ success: false, message: 'Only users associated with a firm can create family units.' });
  }
  ```
* **Impact**: Retail B2C users without an advisor or partner firm are blocked from creating family groups.

#### 20. Entire Equity Dashboard Built on Static Hardcoded Mock Data
* **Location**: `backend/src/controllers/equityDashboard.controller.ts` (Lines 6-160)
* **Impact**: All endpoints (`/market-overview`, `/categories`, `/trending`, `/recommended`) return static hardcoded JSON (NIFTY at 24320.15, TCS at 4120.50), ignoring real data synchronized into `iifl_instruments` and `equity_prices`.

---

### Severity: LOW / CODE HEALTH (Repository Hygiene, Antipatterns & Dead Code)

#### 21. Environment Variable Name & Port Mismatches
* **Port Conflict**: `backend/src/config/env.ts` defaults to port `5001`, but `README.md` and frontend default to port `5000`.
* **CORS Key Mismatch**: `backend/src/app.ts` checks `process.env.FRONTEND_URL`, while `.env.example` documents `CORS_ORIGIN`.

#### 22. Ephemeral Local File Storage on Cloud Deployments
* **Location**: `backend/src/middleware/upload.middleware.ts` (Lines 30-33)
* **Impact**: Partner logos are stored in `../../uploads/partners` on local disk. On containerized platforms like Render (referenced in `frontend/.env.example`), uploads are wiped on server restart.

#### 23. Abandoned / Dead Dependencies & Integrations
* **Supabase Client**: `@supabase/supabase-js` is configured in `frontend/src/integrations/supabase/client.ts`, but completely unused; all frontend calls go through Express Axios.
* **Plaid**: Plaid is designed for US/UK/Canada bank accounts and cannot connect to Indian banks (which require Account Aggregators like Setu/OneMoney).
* **Gemini API**: Key is exposed in `.env.example`, but zero Gemini SDK imports or API calls exist in the codebase.

#### 24. Heavy In-Process Cron Blocking Server Event Loop
* **Location**: `backend/src/server.ts` (Lines 112-136)
* **Impact**: The cron loops sequentially through up to 5,000 schemes with a `200ms` delay ($5,000 \times 200\text{ms} \approx 16.6\text{ minutes}$) inside the primary Node.js process instead of delegating to an asynchronous worker or job queue.

#### 25. Repository Clutter & Scratch Artifacts
* **Over 35 scratch files left in backend**: `scratch-test1.ts` through `scratch-test9.ts`, `scratch-power*.ts`, `scratch-mock*.ts`, `scratch-quote*.ts`, `test-db.js`, `test-yf.js`, etc.
* **Orphaned patch scripts in frontend & root**: `patch.py`, `fix.py`, `fix_responsive.py`, `Marketplace.tsx.orig`, `Marketplace.tsx.patch`, and a 628KB `eslint_report.json`.

---

## 7. System Remediation & Modernization Roadmap

```mermaid
graph LR
    P1[Phase 1: Security Lockdown] --> P2[Phase 2: Database Schema Realignment]
    P2 --> P3[Phase 3: Financial Logic Fixes]
    P3 --> P4[Phase 4: Architecture Cleanup]
```

### Phase 1: Security Lockdown (Immediate Priority)
1. **Rotate Credentials**:
   - Immediately rotate the Supabase database password for project `hjljksufiquaoihgsmvq`.
   - Rotate the Supabase service role key, Gemini API key, and IIFL app secrets.
2. **Scrub Git History & Secure `.env.example`**:
   - Remove real connection strings and keys from all `.env.example` files and Python scripts.
   - Add `.env` and all scratch files to `.gitignore`.
3. **Remove Auth Backdoors**:
   - Delete `data: { otp }` from the response in `AuthController.requestOTP`.
   - Remove the `otp === '123456'` hardcoded bypass from `OTPService`.
4. **Implement Broken Access Control Protections**:
   - Add `authorizeRoles('relationship_manager', 'advisor', 'admin')` to `rm.routes.ts`.
   - Add tenant ownership validation (`client.partner_id === user.partner_id`) in `impersonation.middleware.ts`.
   - Require `admin` authentication for `/api/v1/marketplace/sync-mfapi`.
   - Remove or guard `/api/v1/debug` behind `NODE_ENV === 'development'`.

### Phase 2: Database Schema Realignment
1. **Fix Table Name References**:
   - Update `profile.routes.ts` to query `profiles` (not `user_profiles`) and `portfolio_transactions` (not `financial_transactions`).
2. **Reconcile Financial Data Storage**:
   - Choose between the JSONB columns on `profiles` (as migrated in `1784000000000_add_modular_financial_data.js`) OR apply the relational migration from `frontend/supabase/migrations/20250602000000_financial_dashboard_tables.sql` into `backend/migrations`.
   - Align `financial.model.ts` to query the chosen schema.
3. **Fix Onboarding DOB Sequence**:
   - In `ProfileController.updateProfile`, calculate age directly from `req.body.dob` if `user.dob` is not yet saved, ensuring correct persona assignment on initial submission.

### Phase 3: Financial Logic & Integration Repair
1. **Correct Financial Math**:
   - Fix the investment percentage formula in `profile.routes.ts`.
   - Correct quarterly expense normalization in `FinancialSnapshot.tsx` (divide by 3, not 4).
   - In `download_prices.py`, download 1 year of data (`period="1y"`) or query 52-week metrics from the ticker summary.
2. **Fix Token Refresh & Auth Handshake**:
   - Implement `/api/v1/auth/refresh-token` in `auth.routes.ts` or adjust `frontend/src/lib/api.ts` to redirect directly to `/login` without looping.
   - Make `/api/v1/partner/public-branding/:id` accessible without requiring a Bearer token.
3. **Connect Equity Dashboard to Real Data**:
   - Replace static mock arrays in `equityDashboard.controller.ts` with queries to `iifl_instruments` and `equity_prices`.

### Phase 4: Architecture & Repository Cleanup
1. **Move Background Sync to BullMQ / Worker**:
   - Offload the 16-minute sequential AMFI/MFAPI synchronization loops to a Redis-backed background worker queue.
2. **Migrate Uploads to S3/Cloud Storage**:
   - Replace local disk uploads in `upload.middleware.ts` with AWS S3 or Cloudinary storage.
3. **Purge Repository Dead Weight**:
   - Delete all 30+ `scratch-*.ts` files, `test-*.js` files, `.orig`, `.patch`, and temporary Python scripts (`patch.py`, `fix.py`, `fix_responsive.py`).
   - Remove unused `@supabase/supabase-js` imports and the unconfigured Plaid integration.
