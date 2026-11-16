# Wealthmax — Useless / Dead / Redundant Files & Functions

> **Rule**: No code was changed. This is an audit-only document.
> All paths are relative to `Wealthmax-main/Wealthmax-main/` unless stated.

---

## 1. Root-Level Junk Files (safe to delete entirely)

| File | Why It's Useless |
|------|-----------------|
| `test-yahoo.js` | One-off manual debug script to test Yahoo Finance HTTP headers. Not part of any module, not imported anywhere. Pure throwaway. |
| `download_prices.py` | Standalone Python script to bulk-download equity prices. It is completely separate from the Node.js backend and duplicates what `navSync.service.ts` already does inside the app. |
| `fix_bluechips.py` | Quick-fix script that patches bluechip fund names directly in the DB. Belongs in a proper migration, not as a loose file. |
| `fix_all_bluechips.py` | Slightly bigger version of the same thing. Duplicate intent with `fix_bluechips.py`. The `scripts/fix_all_bluechips.py` inside `/scripts/` is another copy. |
| `patch.py` | Massive 12 KB one-shot migration script to populate DB tables from CSV data. Should be a proper versioned migration (e.g., via Prisma/knex). Has no rollback, no error recovery. Dead after first use. |

---

## 2. Duplicate / Backup Files in `frontend/src/pages/`

| File | Why It's Useless |
|------|-----------------|
| `Marketplace.tsx.orig` | 26 KB backup of the old `Marketplace.tsx`. Created by the `patch.py` script. Git exists for version history — `.orig` files have no place in source code. Should be deleted. |
| `Marketplace.tsx.patch` | A raw `diff` patch file inside the source tree. Once applied, it is dead weight. Git diffs serve this purpose. |

---

## 3. Stub / Placeholder Pages (frontend/src/pages/)

These pages exist in the router but have no real implementation — they either show nothing, use 100% mock data, or just re-export a component with zero logic.

| File | Problem |
|------|---------|
| `ClientReassignment.tsx` | 5 lines. Just re-exports `<BulkClientReassign />`. This file adds a routing layer with zero value. The component could be registered directly in the router. |
| `ReportingDashboard.tsx` | Uses **100% hardcoded mock data** (`mockUserData`, `mockUserProfile`). The comment says "In a real scenario, this comes from Supabase/Context" — it never was wired up. Completely fake. |
| `ProposalGenerator.tsx` | The "Fund Selection" tab (Step 1) is a placeholder with the literal text `"Fund selection placeholder"`. The "Generate PDF" button fakes a 2-second delay and says `"placeholder"` in the toast. This is a demo skeleton, not a working feature. |

---

## 4. Dead / No-Op Backend Services

### `backend/src/services/audit.service.ts`
- Both methods `log()` and `getLogsByUser()` are **no-ops**.
- `log()` does nothing: `// No-op for Phase 1 as audit_logs table is removed`
- `getLogsByUser()` always returns an empty array `[]`.
- The service is imported and called in various controllers but produces **zero output**. Keeping it means compliance events silently disappear.

### `backend/src/services/pdf.service.ts`
- This is a **thin wrapper** (36 lines) that calls `AnalyticsService.getPortfolioSnapshot()` and then `TemplateService.generateAdvisoryHTML()`.
- There are **two better versions** already: `pdfV2.service.ts` (26 KB) and `pdfV3.service.ts` (152 KB).
- `pdf.service.ts` is the old V1 and is no longer referenced by any active route. It is dead code.

### `backend/src/services/mutualFund.mock.service.ts`
- An entire service class with 77 lines of **hardcoded fake data** (fund names, NAVs, AUM, news articles).
- This was likely scaffolding during early development. The real `mutualFund.service.ts` and `marketplace-discovery.service.ts` exist and use actual DB/API data.
- Nothing in production should reference this mock. It should be deleted.

### `backend/src/services/iifl.service.ts` & `iiflapi.service.ts`
- Both files target `https://api.iiflcapital.com/v1` — a **placeholder base URL** (the comment says "Placeholder base URL").
- Both hardcode the IIFL API keys directly in the source file (`APP_KEY`, `APP_SECRET_KEY` leaked in code).
- `iifl.service.ts` falls back to `getMockData()` on every real API call, meaning it **never actually fetches real IIFL data**.
- `iiflapi.service.ts` is a second, different attempt at the same thing — two separate implementations of an integration that doesn't work.
- **Both files are effectively mock/dead code with leaked credentials.**

---

## 5. Useless / Dead Backend Routes

| File | Problem |
|------|---------|
| `backend/src/routes/debug.routes.ts` | A single `GET /:id` route pointing to `DebugController.debugScheme`. Debug routes **must not exist in production**. This is a security risk (exposes internal scheme data) and has zero user-facing value. |
| `backend/src/routes/plaid.routes.ts` | Plaid is a **US-only bank linking service**. Wealthmax is an Indian wealth management platform. This entire integration (routes + controller + frontend component) is irrelevant to the target market and appears to have been copied from a US-market template. |
| `backend/src/routes/tax.routes.ts` | Single route `POST /optimize` that calls `TaxController.optimize`. The tax page (`TaxPlanner.tsx`) is real, but the backend route points to a controller that needs to be verified — the route file itself is empty of any guard/middleware and likely untested. |
| `backend/src/routes/analytics.routes.ts` | 363 bytes — barely a route definition. Likely incomplete scaffolding. |
| `backend/src/routes/rebalancing.routes.ts` | 344 bytes — similarly minimal. The `PortfolioRebalancing.tsx` frontend page exists but the backend route is skeletal. |
| `backend/src/routes/survey.routes.ts` | 371 bytes. Needs verification of whether the survey backend is actually functional. |

---

## 6. Useless Frontend Components

| File | Problem |
|------|---------|
| `frontend/src/components/PlaidLinkButton.tsx` | Plaid is US-only. Irrelevant for an Indian platform. Not rendered anywhere in active pages. Dead component with a real dependency (`react-plaid-link`) adding unnecessary bundle weight. |
| `frontend/src/components/MarketWatch.tsx` | 2 KB component that shows placeholder market tickers. Needs to be checked if it uses live data or static values. |

---

## 7. Duplicate Scripts in `/scripts/` Folder

| File | Duplicate Of |
|------|-------------|
| `scripts/fix_all_bluechips.py` | Same as root-level `fix_all_bluechips.py`. Two copies of the same one-shot DB fix script. |

---

## 8. Useless Functions Inside Otherwise Valid Files

### `frontend/src/pages/SmartReportDashboard.tsx`
- Line 22: `console.log('Report Payload:', result)` — A raw `console.log` of sensitive financial data left in production code. **Must be removed.**

### `frontend/src/pages/PortfolioReview.tsx` (the page, not the component)
- `localStorage.getItem('wm_token')` on line 39 — manually reads JWT from localStorage instead of using the app's shared `api.ts` client which already handles auth headers. This is dead, inconsistent code.

### `backend/src/services/iiflapi.service.ts`
- `authenticateIifl()` function calls an endpoint that returns a placeholder/mock token. The entire authentication flow is fake.
- `syncAllSchemes()` and `syncSchemeNAV()` — called from the server startup hydration loop but target IIFL endpoints that return mock data. These functions look active but produce no real sync.

### `backend/src/services/audit.service.ts`
- `AuditService.log()` — silently swallows every audit event. Every caller (e.g., auth controller, profile routes) believes they are logging compliance events. They are not.
- `AuditService.getLogsByUser()` — always returns `[]`, making the compliance dashboard (if any) permanently empty.

---

## 9. Files That Are 100% Mock / Fake Data (Should Be Replaced or Deleted)

| File | What's Fake |
|------|------------|
| `backend/src/services/mutualFund.mock.service.ts` | All fund data, NAVs, AUMs, news items |
| `backend/src/services/iifl.service.ts` | All `getMockData()` returns (FDs, equities, mutual funds) |
| `frontend/src/pages/ReportingDashboard.tsx` | Entire user profile and all financial figures |
| `frontend/src/pages/ProposalGenerator.tsx` | Fund selection step, PDF generation (just a 2s sleep) |

---

## 10. Hardcoded Secrets Found in Source Files (Security — Not Just "Useless")

These are dangerous, not just wasteful. Included here for completeness:

| File | Secret |
|------|--------|
| `backend/src/services/iifl.service.ts` | `APP_KEY` and `APP_SECRET_KEY` hardcoded as fallback defaults |
| `backend/src/services/iiflapi.service.ts` | Same `APP_KEY` and `APP_SECRET_KEY` hardcoded |
| `frontend/.env.example` | Contains production `SUPABASE_SERVICE_ROLE_KEY`, live DB password (`WeathMax2026`), and a real Gemini API key |

---

## Summary Table

| Category | Count | Action |
|----------|-------|--------|
| Root-level throwaway scripts | 5 | Delete |
| Backup/patch files in source | 2 | Delete |
| Stub/placeholder pages | 3 | Build properly or remove |
| Dead/no-op services | 5 | Delete or fix |
| Dead/skeletal routes | 6 | Remove or complete |
| Irrelevant integrations (Plaid, IIFL mock) | 3 | Remove |
| Duplicate scripts | 1 | Delete one copy |
| Dangerous hardcoded secrets | 3 files | Rotate keys + use env vars only |
