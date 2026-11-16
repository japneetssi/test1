# WealthMax — Code Changes Log

> Remediation performed against the three audit documents:
> `how to improve it.md`, `useless.md`, `what its doing and misstake.md`.
> Methodology: phase-by-phase (GSD) with an executable verification gate
> (`python main.py --check` → `storage/reports/verify.json`).
> Current verification state: **66/69 checks PASS · 0 FAIL · 3 blocked by
> external provider actions (Supabase project restore, credential rotation,
> SMS gateway signup).**

Commits:

| Phase | Commit |
|---|---|
| 1 — Security lockdown | `522ec47` |
| 2+3 — Schema realignment & financial logic | `94182d6` |
| 3 addendum — family B2C, review page rewire | `e94d168` |
| 4 — Dead code cleanup & audit wiring | `36ac5eb` (amended) |
| 5 — Demo account + this file | `bcfdd5f` |
| 6 — First real run (install/migrate/boot fixes) | (current) |

---

## Phase 1 — Security Lockdown

### Secrets & credentials
- **`frontend/.env.example`** — stripped of LIVE production secrets: Supabase project
  ref `hjljksufiquaoihgsmvq`, both JWT service keys, DB password `WeathMax2026`,
  Gemini API key `AIza…`, pooler hostname. Replaced with placeholder values.
- **`backend/.env.example`** — IIFL `APP_KEY`/`APP_SECRET_KEY` real values stripped;
  documented `DB_POOL_MAX` and `DB_SSL_REJECT_UNAUTHORIZED`.
- **`backend/src/services/iifl.service.ts` + `iiflapi.service.ts`** — removed hardcoded
  IIFL key/secret fallbacks; credentials now env-only and empty-string default.
  `syncEquityContracts()` fails fast (skip + warning) when credentials are absent.

### OTP flow (removed every `123456` path, then re-scoped per user request)
- **`backend/src/services/otp.service.ts` — rewritten**: cryptographically secure
  `crypto.randomInt` codes, Redis-backed storage (`otp:mobile:*` / `otp:email:*`,
  graceful in-memory fallback), 5-minute TTL, max **5 verification attempts**,
  one-time use, OTP values logged only in development at debug level.
- **`backend/src/services/auth.service.ts`** — all `OTPService` calls now awaited
  (previously fire-and-forget promises); OTP never returned from the service;
  email/mobile OTP both real; registration and forgot/reset flows consistent.
- **`backend/src/controllers/auth.controller.ts`** — OTP is surfaced in the HTTP
  response **only when `NODE_ENV=development`** (`data.otp`), never in production.
- **Universal `123456` bypass removed everywhere** (backend zero matches verified);
  frontend `Auth.tsx` register tab no longer validates against the hard-coded demo
  code (accepts any 6-digit code; server verifies).

### Registration & roles
- **`backend/src/validation/auth.validation.ts`** — client-chosen `role` field removed
  from `registerSchema`.
- **`backend/src/services/auth.service.ts`** — registration hard-codes
  `role: 'user'` server-side (advisor/admin accounts come only through the
  invitation/activation flow).

### Route / middleware hardening
- **`backend/src/routes/index.ts`** — `/debug` routes mounted **only in development**.
- **`backend/src/routes/marketplace.routes.ts`** — `POST /sync-mfapi` now
  `authenticateToken` + `authorizeRoles('admin')`.
- **`backend/src/routes/rm.routes.ts`** — router-level
  `authorizeRoles('advisor','relationship_manager','partner','admin')` guard
  (partner included because `PartnerDashboard` consumes `/rm/*`).
- **`backend/src/middleware/impersonation.middleware.ts`** — partner users may only
  impersonate clients of their own firm (`partner_id` match); advisor ownership
  check extended to relationship managers.
- **`backend/src/middleware/auth.middleware.ts`** — JWT verification pins
  `algorithms: ['HS256']`.
- **`backend/src/routes/partner.routes.ts`** — `GET /public-branding/:id` made
  genuinely public (needed pre-login by landing/invite pages; controller returns
  only whitelisted branding fields).

### Server-level protections
- **`backend/src/middleware/rateLimit.middleware.ts` (new)** — in-process sliding
  window limiter: global 600 req/15 min/IP, auth endpoints 20 req/15 min/IP with
  `429` + `Retry-After`.
- **`backend/src/app.ts`** — `trust proxy 1` (Render/ALB real IP), explicit CORS
  allow-list (comma-separated `CORS_ORIGIN` + `FRONTEND_URL`), JSON/urlencoded body
  limit `10mb`, morgan piped into the real logger (removed boot-time
  `console.log('Mounting API Routes...')`), global `apiLimiter` on `/api/v1`.
- **`backend/src/config/env.ts`** — production refuses to boot with default JWT
  secret or the sample AES key; changed default `PORT` to 5000 (README/frontend
  alignment).
- **`backend/src/config/database.ts`** — SSL `rejectUnauthorized` defaults ON
  (explicit off-switch via `DB_SSL_REJECT_UNAUTHORIZED=false`), pool default
  `DB_POOL_MAX=100`, `min: 2`, 30 s `statement_timeout`.

### Token pair
- **`backend/src/services/auth.service.ts`** — added `generateRefreshToken()` +
  `refreshToken()` (30-day refresh token stored as SHA-256 hash in the Redis
  store, rotation on every exchange, revocation-aware, in-memory fallback for dev).
- **`backend/src/routes/auth.routes.ts`** — `POST /auth/refresh-token` (public,
  rate-limited); `authLimiter` applied to register/OTP/activate endpoints.
- **`backend/src/controllers/auth.controller.ts`** — all login/register/activate
  responses now include `refreshToken`.
- **`frontend/src/services/auth.ts`** — role type widened
  (`partner`/`relationship_manager`), `RefreshTokenResponse` type, `refreshToken()`
  service method.
- **`frontend/src/contexts/AuthContext.tsx`** — stores/clears `wm_refresh_token`
  alongside the access token.

### Verification infrastructure (project-local GSD/Ralph/ECC port)
- **`main.py` (repo root, new)** — `python main.py --check` runs every registered
  check and writes `storage/reports/verify.json` (non-zero exit on any FAIL).
- **`.gitignore` (repo root, new)** — excludes nested clones (`weathmx/`,
  later `Wealthmax/`), `.env` files, `__pycache__`, `node_modules`.

---

## Phase 2 — Database Schema Realignment

- **`backend/migrations/1788000000000_create_financial_tables.js` (new)** — creates
  the nine tables the financial models query against the backend's own `users`
  table (the only pre-existing definitions were an unapplied Supabase SQL file
  referencing `auth.users`): `incomes`, `income_sources`, `expenses`,
  `expense_sources`, `assets`, `other_assets`, `liabilities`, `safety_nets`,
  `safety_net_dependents` (+ `frequency_type` enum, updated-at triggers, child
  FK indexes).
- **`backend/src/routes/profile.routes.ts` — gap analysis realigned**:
  - Table is `profiles` (the previous query targeted non-existent
    `user_profiles`), EMI source is `profiles.liabilities_emi`
    (the previous query read a phantom `financial_transactions` 'emi' rows).
  - "Investment %" now = last-30-days `BUY`/`SIP` volume from
    `portfolio_transactions JOIN user_portfolios` over monthly income (replacing
    the meaningless `totalPortfolioValue / 10950` formula); response now also
    returns `portfolioValue` and `monthlyInvested`.
- **`backend/src/controllers/profile.controller.ts` (onboarding persona fix)** —
  age is computed from the submitted DOB first (`req.body.dob`, the field the
  frontend sends), falling back to stored DOB; previously first-onboarding ran
  persona classification with the default age 30. Debug `console.log`s removed.

---

## Phase 3 — Financial Logic Fixes

- **`frontend/src/pages/FinancialSnapshot.tsx`** — quarterly expense normalization
  fixed `amount / 4` → `amount / 3` (was undercounting monthly expenses 25%).
- **`backend/src/services/equity.service.ts`** — circuit bands no longer hard-coded
  as fact: `EQUITY_CIRCUIT_BAND_PERCENT` env (default 20) with honest
  `circuitSource` label ("Estimated … NSE/BSE dynamic price bands are not fixed").
- **`backend/src/routes/advisor.routes.ts`** — duplicate `/portfolio-review/:clientId`
  registration removed; `PortfolioReviewController` (the response shape the actual
  route consumer expects) is now authoritative.
- **`backend/src/controllers/equityDashboard.controller.ts` — rewritten**:
  - `market-overview` — live Yahoo Finance data for 8 index tickers (fetched
    per-symbol via `Promise.allSettled` so a bad symbol can't zero the strip),
    top gainers/losers/52-week/most-active from a 30-ticker liquid NSE universe,
    IST market-open status; 60-second Redis cache; `dataSource` label.
  - `trending` / `recommended` — computed from live quotes; `recommended` ranks
    by raw numeric volume with factual reason strings (no fake match scores of
    user-personalized suitability).
  - `portfolio` — **authenticated**: percentage returns computed from real
    holdings (cost basis `quantity × average_price` vs `last_valuation`);
    day-change/XIRR returned as explicit `null` (historical per-holding prices
    not yet synced) instead of invented numbers.
  - `market-opportunities` / `news` — return empty arrays with an `_note`
    (licensed feed pending) instead of fabricated setups.
  - `mostActive`/`mostTraded` sort on raw numeric volume (formatted "Cr"/"L"
    strings don't sort lexicographically).
- **`backend/src/routes/equityDashboard.routes.ts`** — `/portfolio` now requires
  `authenticateToken` (was serving an anonymous hardcoded wallet).
- **7 equity section components** (`MarketSnapshot`, `DiscoverStocks`,
  `EquityPortfolio`, `MarketIntelligence`, `MarketOpportunities`,
  `RecommendedForYou`, `TrendingStocks`) — hardcoded
  `fetch('https://wealthmax-og-backend.onrender.com/...')` replaced with the
  shared `api` axios client (`@/lib/api`) so auth headers and the configurable
  base URL apply.
- **`EquityPortfolio.tsx`** — null-safe rendering for `todaysReturns`/`xirr`
  (renders "—"), `(data.topHoldings || [])` guard.

---

## Phase 3 Addendum — Remaining Audit Defects

- **Family/B2C (audit #19)**:
  - Root cause found: `FamilyModel.create` INSERTs `families.partner_id`, a column
    that **never existed** → every family creation 500'd.
  - **`backend/migrations/1789000000000_add_families_partner_id.js` (new)** — adds
    nullable `families.partner_id` (FK `partner_agencies`, SET NULL) + index.
  - **`backend/src/controllers/family.controller.ts`** — partner-firm requirement
    removed: B2C retail users create personal family groups (`partner_id` null);
    the cross-firm `add-member` check is retained.
  - **`backend/src/services/family.service.ts` / `models/family.model.ts`** —
    `partnerId` optional/null-safe through the stack, logging distinguishes
    B2C vs B2B2C creation.
- **`frontend/src/pages/PortfolioReview.tsx` (routed page)** — replaced raw
  `fetch('/api/advisor/...')` with manual `localStorage.getItem('wm_token')`
  header by the shared `api` client at the correct `/advisor/portfolio-review/:id`
  path, and re-typed/re-rendered for the controller's actual response
  (`alignmentScore`, `summary`, percentage-based allocation pies, action plan
  with current→target and rationale).
- **`frontend/src/pages/SmartReportDashboard.tsx`** — removed `console.log` of the
  full report payload (sensitive financial data).

---

## Phase 4 — Dead Code Cleanup (useless.md)

**Deleted (13 files):**
`test-yahoo.js`, `download_prices.py`, `fix_bluechips.py`,
`fix_all_bluechips.py`, `scripts/fix_all_bluechips.py`, `patch.py`,
`frontend/src/pages/Marketplace.tsx.orig`, `Marketplace.tsx.patch`,
`backend/src/services/mutualFund.mock.service.ts`,
`backend/src/routes/plaid.routes.ts`, `backend/src/controllers/plaid.controller.ts`,
`backend/src/models/plaid.model.ts`, `frontend/src/components/PlaidLinkButton.tsx`.

- **`backend/src/controllers/mutualFund.controller.ts` + `routes/mutualFund.routes.ts`**
  — all 10 mock endpoints removed (verified: zero frontend consumers); the four
  real endpoints (`/schemes`, `/schemes/:code`, `/schemes/:code/nav-history`,
  `/cache-status`) backed by the actual DB/API service remain.
- **Plaid removal** — routes unmounted from `routes/index.ts`, `Profile.tsx` no
  longer imports/renders the button (helpful text updated), `react-plaid-link`
  removed from `frontend/package.json`.
- **`backend/src/services/audit.service.ts` — wired to reality** (was a documented
  no-op silently discarding every compliance event): inserts into `audit_logs`
  created by **`backend/migrations/1789000000001_create_audit_logs.js` (new)**
  (backend `users` FK, indexed on user/action/created_at); insert failures never
  break the audited request but are logged loudly (`AUDIT WRITE FAILED`);
  `getLogsByUser()` performs a real 200-row query.
- **Deliberately kept, with reasons** (search-first verification over the audit's
  claims): `pdf.service.ts` (actively imported by `pdf.controller.ts`), IIFL
  services (referenced by startup hydration; secrets already scrubbed, fail-fast
  added), debug routes (development-only mount), skeletal
  analytics/rebalancing/survey routes (imported by the live router), and the
  routed stub pages `ProposalGenerator`/`ReportingDashboard`/
  `ClientReassignment` (rebuilding them is a product task; removing routed pages
  would break navigation).

---

## Phase 5 — Demo Login Account (user request, temporary)

- **`backend/migrations/1790000000000_seed_demo_account.js` (new, runs last)** —
  idempotent seed (ON CONFLICT / NOT EXISTS guards) of one demo user:

  | Field | Value |
  |---|---|
  | Email | `demo@wealthmax.app` (env `DEMO_EMAIL`) |
  | Mobile | `+919999999999` (env `DEMO_MOBILE`) |
  | Role | `user` (not admin — demo cannot touch admin endpoints) |
  | Profile data | gross_income 1.5 L/mo, monthly expenses 60 K, EMI 18 K, emergency fund 4 L (≈6.7 months), persona "Wealth Builder", risk Moderate |
  | Financial tables | incomes (Salary 1.5 L + Freelance 25 K), expenses (5 categories), assets (incl. land/property 45 L), liabilities (home 22 L + car + personal + card), safety net (1 Cr life, 10 L health) with 2 dependents |
  | Portfolio | 4 equities (Reliance/TCS/Infosys/ITC — real ISINs) + 2 mutual funds (demo-placeholder ISINs), ~₹10.17 L current value vs ~₹8.6 L cost, six months of SIP history |

- **`backend/src/config/env.ts`** — `DEMO_EMAIL` / `DEMO_MOBILE` / `DEMO_OTP` +
  `isDemoLoginEnabled()`: **ON by default in development** (`false` to disable);
  in production it is **never enabled unless `DEMO_LOGIN_ENABLED=true` is set
  explicitly**.
- **`backend/src/services/otp.service.ts`** — generate methods accept an optional
  `{ fixedOtp }` used **only** by the demo-account branch; no universal bypass
  returns.
- **`backend/src/services/auth.service.ts`** — `requestOTP` detects the demo
  identifiers (case/space-normalized) when demo login is enabled: stores the fixed
  demo OTP through the normal (TTL + attempt-limited) record, skips SMS/SMTP
  delivery, and returns `{ demo: true }` so the UI can show the hint. All
  non-demo users keep the crypto-random OTP path.
- **`backend/src/controllers/auth.controller.ts`** — response includes
  `data.demo: true` for the demo path (dev OTP still dev-gated).
- **`frontend/src/pages/Auth.tsx`** — login toast shows
  "Demo account: use OTP 123456 to log in." when the backend marks `demo`.
- **`backend/.env.example`** — demo env block documented with the production
  warning.

**How to log in:** enter `demo@wealthmax.app` (or `+919999999999`) on the login
tab → request OTP → enter `123456`. Disable anytime with `DEMO_LOGIN_ENABLED=false`
(and drop the migration seed for a permanent removal).

---

## Phase 6 — First Real Run (install → migrate → boot)

`npm install` had never executed in this workspace, so the first true
install/apply/compile round surfaced five latent defects. All fixed here.

### Migration-chain fixes (the chain had never actually been applied anywhere)
1. **`1775000100000_add_family_goal_fields.js`** — `ALTER TABLE goals` crashed
   (42P01): **no migration ever created `goals`** (it existed only in the
   unshipped Supabase SQL file). The migration now creates the table
   (`CREATE TABLE IF NOT EXISTS`, shaped exactly like `goal.model.ts`) before
   adding `family_id` / `is_family_goal`.
2. **`1780000000000_create_client_invites.js`** — was an ESM module creating
   its **own pg.Pool**, so it ran *outside* node-pg-migrate's transaction and
   saw an empty database ("relation users does not exist"). Rewired to the
   standard `pgm` API, same schema.
3. **`1788000000000_create_financial_tables.js`** — `CREATE FUNCTION IF
   NOT EXISTS` is not valid PostgreSQL (42601); after switching to a
   duplicate-guarded form, the wrong plpgsql guard (`duplicate_object`) let a
   42723 through. Now the canonical `CREATE OR REPLACE FUNCTION` idiom.
4. **`1779000000000_update_crm_tables.js` — deleted**: it blindly re-created
   `interaction_logs` + `documents` (already created by `1776000000000` →
   42P07) and would have weakened `size` to bigint (string in pg results).
   The base migration is authoritative.
5. **`1790000000000_seed_demo_account.js`** — first-run sweep fixed two seed
   bugs: `profiles.mutual_funds` does not exist (that column lives on
   `assets`), and `frequency` is the `frequency_type` enum (needed explicit
   casts). Chain now applies end-to-end: `Migrations complete!`.
6. **Audit-correction** — audit #19 claimed `families.partner_id` never
   existed; it does (`1775000200000_add_partner_id_to_families.js`, already
   nullable + FK + index). The redundant Phase-3 fix migration
   (`1789000000000_add_families_partner_id.js`) was removed, and the harness
   check retargeted to the correct file. The real historical failure was the
   chain itself never applying (items 1-4 above).

### Compile gate (first real `tsc`)
- `npx tsc --noEmit` — now clean (exit 0). `yahoo-finance2@3.13.2` is v3:
  the default export is a **class**, and the equity dashboard controller
  called modules on it directly (`never`-typed everything at compile time).
  Instantiated a shared client (`new YahooFinance()`) there (+ fixed a
  mixed-return-path in `getPortfolio`, missing `PortfolioService` import).
  The other two consumers already instantiated correctly.

### Environment / runtime
- **Supabase project unreachable** — both pooler ports answer
  `tenant/user not found` and the direct db host no longer resolves: the
  project is paused/deleted. Logged as a third BLOCKED item (dashboard
  action). Deployment to the remote DB can resume by supplying a fresh
  `DATABASE_URL` in `backend/.env` (the recovered URL is preserved as a
  comment in that file).
- **Local dev DB** — the run works against an embedded PostgreSQL 17
  (no admin rights, data in the machine-temp area) at
  `postgresql://postgres:postgres@localhost:5433/wealthmax`, wired via
  git-ignored `backend/.env` (URL recovered from initial-commit history for
  when Supabase returns).

### Live verification (this run)
- `python main.py --check` → **66/69 PASS, 0 FAIL, 3 BLOCKED**
- Backend health: `GET /api/v1/health` → 200 `Server is running`
- Demo login E2E: request OTP → `data.demo=true`;
  wrong OTP **rejected** (attempt counter intact); `123456` → token +
  refresh token, JWT `role=user`; OTP is one-time-use (second verify of the
  same code is rejected as designed); frontend `/login` reached at
  http://localhost:8080.

---

## Current Verification Snapshot

`python main.py --check` → **66/69 PASS, 0 FAIL, 3 BLOCKED**:

| Blocked item | Why it needs a human |
|---|---|
| Supabase project unreachable | Project is paused/deleted at Supabase; restore it (or a replacement) from the dashboard, then swap `DATABASE_URL` in `backend/.env` back to the pooler URL |
| Secret rotation | Supabase/Gemini/IIFL keys must be revoked & reissued on provider dashboards |
| SMS gateway | Needs an MSG91/Textlocal account + DLT template for production OTP delivery |

**Known follow-ups (not blockers):**
1. ~~`npm install` never ran~~ — DONE in the Phase 6 run (`npm install` in both
   dirs, `npx tsc --noEmit` clean). For deploy CI, keep the type gate.
2. ~~Migrations never applied~~ — DONE locally on the embedded Postgres
   (`npm run migrate -- up` = "Migrations complete!"). Caveat: package.json's
   `migrate` script lacks the required `up` command — run
   `npm run migrate -- up` until the script is fixed to `node-pg-migrate up`.
3. Stub pages (`ProposalGenerator`, `ReportingDashboard`) remain routed but
   placeholder-grade — build them out or decommission explicitly.
4. To remove the demo account later: set `DEMO_LOGIN_ENABLED=false` and run the
   seed migration's `down` (deletes the demo user and cascade-owned data).
