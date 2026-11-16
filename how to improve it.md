# Wealthmax — Complete Production Improvement Guide

> Target: **1 Million concurrent users**, full security hardening, all dummy features live.  
> Format: Each issue states the **exact file**, what is **wrong today**, and the **exact fix** needed.  
> No code was changed — this is a planning document only.

---

## Table of Contents

1. [Critical Security Fixes](#1-critical-security-fixes) ← Fix First
2. [Authentication & Session Hardening](#2-authentication--session-hardening)
3. [Database — Scalability & Performance](#3-database--scalability--performance)
4. [Backend Architecture for 1M Users](#4-backend-architecture-for-1m-users)
5. [Cron Jobs & Background Processing](#5-cron-jobs--background-processing)
6. [Making All Dummy Features Live](#6-making-all-dummy-features-live)
7. [Frontend Performance](#7-frontend-performance)
8. [API Design & Rate Limiting](#8-api-design--rate-limiting)
9. [Observability & Monitoring](#9-observability--monitoring)
10. [Infrastructure & Deployment](#10-infrastructure--deployment)
11. [Priority Roadmap](#11-priority-roadmap)

---

## 1. Critical Security Fixes

> These are **immediate** — before any other work. A production breach with financial data is catastrophic.

---

### 1.1 Rotate All Exposed Secrets Immediately

**Files affected:**
- `frontend/.env.example` — Contains a **live** Supabase service role key, production DB password (`WeathMax2026`), and a real Gemini API key.
- `backend/src/services/iifl.service.ts` — Line 7: `APP_SECRET_KEY` hardcoded as default fallback.
- `backend/src/services/iiflapi.service.ts` — Line 10: Same IIFL keys hardcoded.
- `backend/src/config/env.ts` — Line 38: `JWT_SECRET` defaults to `'dev_secret_key_change_in_prod'`. Line 39: `ENCRYPTION_KEY` defaults to `'01234567890123456789012345678901'`.

**What to do:**
```
1. Go to Supabase dashboard → Revoke the exposed service_role key → Generate new one.
2. Change the DB password immediately in Supabase.
3. Revoke the Gemini API key in Google Cloud Console → Create new.
4. Revoke IIFL keys (APP_KEY + APP_SECRET_KEY) → Get new from IIFL.
5. Set a proper random 64-char JWT_SECRET in production env.
6. Set a proper random 32-byte ENCRYPTION_KEY in production env.
7. Add .env* and *.env to .gitignore (verify it's already there).
8. Scan git history: run `git log --all -p | grep -i "WeathMax2026"` — if found, rewrite history using BFG Repo Cleaner.
9. NEVER put real credentials in .env.example — use placeholder values like `SUPABASE_KEY=your_key_here`.
```

---

### 1.2 OTP Master Key Bypass — Critical Auth Vulnerability

**File:** `backend/src/services/otp.service.ts` — Lines 27 and 66.

**What's wrong:**
```typescript
// THIS IS IN PRODUCTION CODE RIGHT NOW:
if (otp === '123456') {
    return true; // Anyone can log into ANY account with OTP "123456"
}
```
This means **any attacker who knows a user's email or phone number can log into their account by entering 123456**. This is an account takeover vulnerability affecting every single user.

**Fix:**
```typescript
// Remove those if-blocks entirely. Replace with:
static verifyOTP(mobile: string, otp: string): boolean {
    const stored = mobileOtpStore.get(mobile);
    if (!stored) return false;
    if (Date.now() > stored.expires) {
        mobileOtpStore.delete(mobile);
        return false;
    }
    if (stored.otp === otp) {
        mobileOtpStore.delete(mobile);
        return true;
    }
    return false;
}
```
Also add **OTP attempt limiting** — max 5 wrong attempts, then lockout for 15 minutes (use Redis, see section 3).

---

### 1.3 OTP Stored in Process Memory (Not Redis)

**File:** `backend/src/services/otp.service.ts` — Lines 5-6.

**What's wrong:**
```typescript
const mobileOtpStore: Map<string, ...> = new Map();
const emailOtpStore: Map<string, ...> = new Map();
```
- OTPs live in Node.js process memory.
- When you have **multiple backend instances** (which you must have for 1M users), each instance has its own Map. A user who hits instance 1 for OTP generation and instance 2 for verification will **always fail**.
- A process restart wipes all pending OTPs.
- Memory grows unboundedly under high load.

**Fix — Use Redis:**
```typescript
import redis from '../config/redis'; // Add a Redis client config

static async generateOTP(identifier: string): Promise<string> {
    const otp = crypto.randomInt(100000, 999999).toString(); // Use crypto, not Math.random
    await redis.setex(`otp:${identifier}`, 300, JSON.stringify({ otp, attempts: 0 }));
    return otp;
}

static async verifyOTP(identifier: string, otp: string): Promise<boolean> {
    const raw = await redis.get(`otp:${identifier}`);
    if (!raw) return false;
    const stored = JSON.parse(raw);
    
    // Increment attempt counter
    if (stored.attempts >= 5) {
        await redis.del(`otp:${identifier}`);
        throw new Error('Too many attempts. Request a new OTP.');
    }
    stored.attempts++;
    await redis.set(`otp:${identifier}`, JSON.stringify(stored), 'KEEPTTL');
    
    if (stored.otp !== otp) return false;
    await redis.del(`otp:${identifier}`); // Delete on success
    return true;
}
```

---

### 1.4 JWT Has No Refresh Token — But Frontend Expects One

**File (backend):** `backend/src/services/auth.service.ts` — Line 262-272. Token is generated as single 24h access token with no refresh.

**File (frontend):** `frontend/src/lib/api.ts` — Lines 63-90. The frontend tries to call `/auth/refresh-token` which **does not exist on the backend**.

**What happens:** At the 24h mark, the user is silently logged out. The refresh call fails, clears tokens, and redirects to `/login`. With financial data mid-flow, this is terrible UX.

**Fix — Add a proper refresh token system:**
```typescript
// In auth.service.ts generateToken():
private static generateTokenPair(user: User) {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, partner_id: user.partner_id },
        config.get('JWT_SECRET'),
        { expiresIn: '15m' } // Short-lived access token
    );
    const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        config.get('JWT_REFRESH_SECRET'), // Separate secret
        { expiresIn: '30d' }
    );
    // Store refreshToken hash in Redis with user ID
    return { accessToken, refreshToken };
}
```
Then add `POST /auth/refresh-token` route that validates the refresh token from Redis and issues a new access token.

---

### 1.5 Debug Route Exposed in Production

**File:** `backend/src/routes/index.ts` — Line 32: `router.use('/debug', debugRoutes)`.

**File:** `backend/src/routes/debug.routes.ts` — Exposes internal scheme data at `GET /api/v1/debug/:id`.

**Fix:** Remove the debug route entirely from the index. If needed for internal use, guard it:
```typescript
if (config.isDevelopment()) {
    router.use('/debug', debugRoutes);
}
```

---

### 1.6 Missing Input Validation on Most Routes

**What's wrong:** Most controllers receive `req.body` and pass it directly to services without sanitization. Example in `backend/src/controllers/auth.controller.ts` — the `register` endpoint trusts `req.body.role` directly, meaning a user could register themselves as `admin`.

**Fix:**
```typescript
// In auth.validation.ts, ensure role is never accepted from client:
const registerSchema = z.object({
    email: z.string().email(),
    mobile: z.string().regex(/^[6-9]\d{9}$/), // Indian mobile numbers only
    full_name: z.string().min(2).max(100),
    // role: NEVER from client. Always assign 'user' server-side.
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
});
```
Apply Zod validation middleware to every route that accepts user input.

---

### 1.7 SSL `rejectUnauthorized: false` in Production

**File:** `backend/src/config/database.ts` — Line 17.
```typescript
ssl: isSupabase ? { rejectUnauthorized: false } : false,
```
`rejectUnauthorized: false` disables SSL certificate verification — this opens the DB connection to man-in-the-middle attacks.

**Fix:**
```typescript
ssl: isSupabase ? {
    rejectUnauthorized: true, // Enable cert verification
    ca: process.env.SUPABASE_SSL_CERT, // Load Supabase CA cert from env
} : false,
```
Download the Supabase CA certificate from the dashboard and store it as a base64 env var.

---

### 1.8 OTP Leaked in Production Logs

**File:** `backend/src/services/otp.service.ts` — Line 18: `logger.info(`Mobile OTP Generated for ${mobile}: ${otp}`)`.

**File:** `backend/src/services/auth.service.ts` — Line 112: `return otp;` — The OTP is returned in the API response body for "dev convenience".

**Fix:**
```typescript
// Remove OTP from logs in production:
if (config.isDevelopment()) {
    logger.debug(`OTP for ${mobile}: ${otp}`);
}
// NEVER return OTP in response body — send via SMS/email only:
return { message: 'OTP sent successfully' }; // Not the OTP itself
```

---

## 2. Authentication & Session Hardening

### 2.1 Add SMS OTP Provider (Mobile OTP Is Fake Today)

**File:** `backend/src/services/otp.service.ts` — `generateOTP()` only logs the OTP to console. No SMS is sent.

**Fix — Integrate an Indian SMS gateway:**
```
1. Sign up for Textlocal, MSG91, or Fast2SMS (all TRAI compliant for India).
2. Create backend/src/services/sms.service.ts:
```
```typescript
import axios from 'axios';
export class SMSService {
    static async sendOTP(mobile: string, otp: string) {
        await axios.post('https://api.msg91.com/api/v5/otp', {
            mobile: `91${mobile}`,
            authkey: process.env.MSG91_AUTH_KEY,
            otp,
            template_id: process.env.MSG91_TEMPLATE_ID,
        });
    }
}
```
Then in `OTPService.generateOTP()`, call `SMSService.sendOTP(mobile, otp)` after generating.

---

### 2.2 No RBAC Enforcement on Many Routes

**File:** `backend/src/routes/index.ts` — Routes like `/admin`, `/partner`, `/advisor` exist but don't all enforce role checks at the route level.

**Fix:** Every route group must use `authorizeRoles()`:
```typescript
router.use('/admin', authenticateToken, authorizeRoles('admin'), adminRoutes);
router.use('/partner', authenticateToken, authorizeRoles('partner', 'admin'), partnerRoutes);
router.use('/advisor', authenticateToken, authorizeRoles('advisor', 'admin'), advisorRoutes);
```

---

### 2.3 JWT Secret Is Symmetric — Upgrade to RS256

**File:** `backend/src/services/auth.service.ts` — Uses `jwt.sign(..., config.get('JWT_SECRET'))` which is HMAC-SHA256 (symmetric).

For a multi-service architecture (microservices, edge functions), use **RS256** (asymmetric):
- Private key for signing (backend only)
- Public key for verification (any service, CDN, etc.)

---

## 3. Database — Scalability & Performance

### 3.1 Connection Pool Size Is Too Small

**File:** `backend/src/config/database.ts` — Line 20: `max: 20`.

At 1M users, with even 0.1% active at once = 1000 simultaneous requests. Each request uses a DB connection. 20 connections will throttle everything.

**Fix:**
```typescript
this.pool = new Pool({
    connectionString: dbUrl,
    max: 100, // Per instance; multiply by number of instances
    min: 10,  // Keep warm connections ready
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Fail fast if pool exhausted
    statement_timeout: 30000, // Kill runaway queries after 30s
});
```
Also: For 1M users, move to **PgBouncer** (connection pooler) in front of PostgreSQL. This allows 10,000+ app connections → 100 real DB connections efficiently.

---

### 3.2 Missing Database Indexes

The codebase has no migration files showing indexes on heavily-queried columns. Based on the query patterns in service files:

```sql
-- Add these indexes immediately:
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_advisor_id ON users(advisor_id);
CREATE INDEX idx_users_partner_id ON users(partner_id);
CREATE INDEX idx_portfolio_holdings_user ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_portfolio_holdings_isin ON portfolio_holdings(isin);
CREATE INDEX idx_mutual_fund_nav_isin ON mutual_fund_nav(isin);
CREATE INDEX idx_mutual_fund_nav_date ON mutual_fund_nav(nav_date DESC);
CREATE INDEX idx_mf_schemes_scheme_code ON mf_schemes(scheme_code);
CREATE INDEX idx_client_invites_token ON client_invites(invite_token);
CREATE INDEX idx_iifl_instruments_symbol ON iifl_instruments(trading_symbol);
```
Without these, every user login triggers a **full table scan** on the users table.

---

### 3.3 No Query Caching — Every Request Hits DB

**Files:** All service files query the DB on every request. Example: `PortfolioService.isDuplicateISIN()` runs a JOIN query every call.

**Fix — Add Redis caching layer:**
```typescript
// Pattern: Cache-aside
async function getCachedPortfolio(userId: string) {
    const cacheKey = `portfolio:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    const data = await db.query(...);
    await redis.setex(cacheKey, 300, JSON.stringify(data.rows)); // 5-min cache
    return data.rows;
}

// Invalidate on write:
async function updatePortfolio(userId: string, ...) {
    await db.query(...);
    await redis.del(`portfolio:${userId}`); // Bust cache
}
```
Priority caches to add:
- NAV data: Cache for 24h (updated once daily)
- Scheme list: Cache for 24h
- User profile: Cache for 5 minutes
- Portfolio snapshot: Cache for 5 minutes

---

### 3.4 No Database Migrations System

**File:** `backend/src/server.ts` — Lines 20-50: Tables are created with raw `CREATE TABLE IF NOT EXISTS` SQL inside the server startup function.

**What's wrong:**
- No version control for DB schema
- No rollback mechanism
- Schema changes are manual and error-prone
- New developers have no way to recreate the exact schema

**Fix — Use a migration tool:**
```bash
# Install db-migrate or Knex or use Flyway
npm install db-migrate db-migrate-pg

# Create proper migration files:
# migrations/001_create_users.sql
# migrations/002_create_portfolios.sql
# migrations/003_add_indexes.sql
# etc.
```
Move all `CREATE TABLE` statements from `server.ts` to numbered migration files. Run migrations as a separate step before server startup.

---

### 3.5 NAV Hydration Loop — Sequential with 200ms Delay Is Too Slow

**File:** `backend/src/server.ts` — Lines 123-130: 5000 schemes × 200ms delay = **16+ minutes** for one cron job cycle.

**Fix — Parallel batching:**
```typescript
const CONCURRENCY = 10;
for (let i = 0; i < res.rows.length; i += CONCURRENCY) {
    const batch = res.rows.slice(i, i + CONCURRENCY);
    await Promise.allSettled(batch.map(s => hydrateSchemeData(s.scheme_code, true)));
}
// 5000 schemes / 10 parallel = 500 rounds → much faster
```
Also: Move this to a dedicated **worker process** (see section 5), not the web server cron.

---

## 4. Backend Architecture for 1M Users

### 4.1 Single Process Cannot Handle 1M Users

**File:** `backend/src/server.ts` — One Node.js process, single-threaded event loop, one port.

**What happens at 1M users:** Even with async I/O, a single process will max out at ~5,000-10,000 concurrent requests under real load. Heavy CPU tasks (PDF generation via `pdfV3.service.ts` which is 152 KB of PDF logic) will block the event loop.

**Fix — Horizontal scaling architecture:**
```
[Users] → [CDN/Cloudflare] → [Load Balancer (Nginx / AWS ALB)]
                                        ↓
                           [Backend Pod 1] [Backend Pod 2] [Backend Pod N]
                                        ↓
                           [Redis Cluster] ← Shared session/OTP/cache
                                        ↓
                           [PostgreSQL with PgBouncer]
                                        ↓
                           [Worker Queue (Bull + Redis)] ← Heavy jobs
```

Steps:
1. Containerize with Docker (add `Dockerfile` + `docker-compose.yml`)
2. Deploy on Kubernetes (EKS/GKE) or use Railway/Render with auto-scaling
3. Set `replicas: 5` minimum, scale to 50+ under load
4. Use `pm2 cluster` mode locally: `pm2 start dist/server.js -i max`

---

### 4.2 Body Parser Has No Size Limit

**File:** `backend/src/app.ts` — Line 25: `app.use(express.json())` — no limit set.

A malicious user can send a 1GB JSON body and crash the server.

**Fix:**
```typescript
app.use(express.json({ limit: '10mb' })); // Portfolio CSV imports may be large
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

---

### 4.3 No Rate Limiting at All

**File:** `backend/src/app.ts` — No rate limiting middleware anywhere.

At 1M users, even 1 request/second/user = 1M req/s which is devastating. Without rate limiting, a single user can flood the API.

**Fix:**
```bash
npm install express-rate-limit rate-limit-redis
```
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// General API rate limit
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 min per IP
    store: new RedisStore({ client: redis }),
});

// Strict limit for auth routes (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Only 10 OTP requests per 15 min
    store: new RedisStore({ client: redis }),
});

app.use('/api/v1', generalLimiter);
app.use('/api/v1/auth', authLimiter);
```

---

### 4.4 Cron Jobs Run on Every Instance (Duplicate Execution)

**File:** `backend/src/server.ts` — Lines 66-158: 4 cron jobs start on every server instance.

With 10 backend pods, the AMFI NAV sync runs **10 times simultaneously** every night — 10x DB writes, 10x external API calls, potential conflicts.

**Fix:** Move all cron jobs to a **dedicated singleton worker process**:
```
backend/
  src/
    server.ts      ← HTTP server only, no crons
    worker.ts      ← Cron jobs only, 1 replica only
```
In Kubernetes, set `replicas: 1` for the worker deployment and `replicas: N` for the server.  
Alternatively, use a distributed lock: `SET cron:nav-sync LOCKED EX 3600 NX` in Redis before running.

---

### 4.5 Heavy PDF Generation Blocks the Event Loop

**File:** `backend/src/services/pdfV3.service.ts` — 152 KB of synchronous PDF generation logic.

Generating a PDF is CPU-intensive. Running it on the same process that handles HTTP requests will freeze all other requests for that instance during generation.

**Fix — Use a job queue:**
```bash
npm install bull bull-board
```
```typescript
// In pdf.routes.ts:
router.post('/generate', authenticateToken, async (req, res) => {
    const jobId = await pdfQueue.add({ userId: req.user.id, options: req.body });
    res.json({ success: true, jobId: jobId.id, message: 'PDF generation started' });
});

// In worker.ts (separate process):
pdfQueue.process(async (job) => {
    const pdf = await PDFServiceV3.generate(job.data);
    await uploadToS3(pdf); // Store in S3
    await notifyUserByEmail(job.data.userId, s3Url);
});
```

---

## 5. Cron Jobs & Background Processing

### 5.1 NAV Sync Cron — Move to Bull Queue for Reliability

**Current:** `node-cron` inside `server.ts`. If the server restarts mid-sync, the job is lost with no retry.

**Fix:**
```typescript
// Use Bull for retryable, persistent jobs:
const navSyncQueue = new Bull('nav-sync', { redis: redisConfig });

// Schedule via Bull's repeat option:
navSyncQueue.add({}, { repeat: { cron: '30 17 * * *' }, removeOnComplete: 10 });

// Process:
navSyncQueue.process(async () => {
    return syncAmfiData();
});
```
Bull stores jobs in Redis, retries on failure (configurable), and shows job history.

---

### 5.2 IIFL Equity Sync Is Fake — Replace or Remove

**File:** `backend/src/services/iiflapi.service.ts` — `syncEquityContracts()` called from server startup, uses a placeholder API URL and mock authentication. It syncs nothing real.

**Fix options:**
1. **Remove it** (recommended until IIFL integration is real) — delete the cron job from `server.ts`, stop importing `iiflapi.service.ts`.
2. **Replace with NSE/BSE data** — Use the public NSE equity master file (`https://nseindia.com/api/equity-master`) which is freely available and doesn't need credentials.

---

## 6. Making All Dummy Features Live

### 6.1 Mobile OTP → Integrate SMS Gateway

**Current state:** OTP is generated and logged, never sent via SMS.
**Files to change:**
- `backend/src/services/otp.service.ts` — Call `SMSService.sendOTP()` in `generateOTP()`
- Create `backend/src/services/sms.service.ts`
- Add `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` to `.env`

**Steps:**
1. Register at msg91.com, get auth key
2. Create a DLT-registered SMS template (required for Indian numbers)
3. Add the service file, wire it into OTP generation

---

### 6.2 ReportingDashboard.tsx → Wire to Real API

**File:** `frontend/src/pages/ReportingDashboard.tsx` — Uses `mockUserData` (hardcoded).

**Fix:**
```typescript
// Replace mock data with real API call:
const [userData, setUserData] = useState<UserFinancialData | null>(null);

useEffect(() => {
    api.get('/profile/financial-summary')
       .then(res => setUserData(res.data.data))
       .catch(err => toast.error('Failed to load report'));
}, []);
```
Backend endpoint needed: `GET /api/v1/profile/financial-summary` — this can be built using existing `profiling.service.ts` and `reportData.service.ts` which already have the calculation logic.

---

### 6.3 ProposalGenerator.tsx → Wire to Real PDF Generation

**File:** `frontend/src/pages/ProposalGenerator.tsx` — PDF generation is a 2-second fake sleep.

**Fix:**
```typescript
// Replace setTimeout mock with real API call:
const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
        const response = await api.post('/pdf/proposal', {
            clientName,
            amount,
            horizonYears,
            assumedCagr,
            selectedFunds, // Add fund selection state
        }, { responseType: 'blob' });
        
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proposal_${clientName}_${Date.now()}.pdf`;
        a.click();
        toast.success('PDF downloaded!');
    } catch (err) {
        toast.error('PDF generation failed');
    } finally {
        setGenerating(false);
    }
};
```
The backend `pdfV3.service.ts` and `proposalPdf.service.ts` exist and have the logic — they just need to be wired to this frontend.

Also replace the "Fund selection placeholder" in Step 1 with a real fund search using `GET /api/v1/mutual-funds/search?q=...` which already exists.

---

### 6.4 AuditService → Wire to Real Database Table

**File:** `backend/src/services/audit.service.ts` — Both methods are no-ops.

**Fix:**
```sql
-- Add migration: create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```
```typescript
// In audit.service.ts:
static async log(event: AuditEvent): Promise<void> {
    await db.query(
        `INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [event.userId, event.action, event.resource, 
         JSON.stringify(event.details), event.ipAddress, event.userAgent]
    );
}
```
This is a SEBI compliance requirement for regulated financial platforms — audit logs are mandatory.

---

### 6.5 Tax Optimizer → Validate and Complete

**File:** `backend/src/routes/tax.routes.ts` — Single route with no middleware.

**Fix:**
```typescript
router.post('/optimize', authenticateToken, TaxController.optimize);
router.get('/summary/:userId', authenticateToken, TaxController.getSummary);
```
Then verify `TaxController.optimize` calls `tax.service.ts` correctly and test with real portfolio data. The frontend `TaxPlanner.tsx` (19 KB) is a real implementation — it just needs the backend to not be a skeleton.

---

### 6.6 Portfolio Rebalancing → Complete the Backend

**File:** `backend/src/routes/rebalancing.routes.ts` — 344 bytes, skeletal.

`rebalancing.service.ts` (7.6 KB) already exists with the logic. Just wire it:
```typescript
router.get('/:portfolioId', authenticateToken, RebalancingController.getRebalancingPlan);
router.post('/:portfolioId/execute', authenticateToken, RebalancingController.executeRebalancing);
```

---

### 6.7 Remove Plaid — Replace with Indian Account Aggregator

**Files:** `backend/src/routes/plaid.routes.ts`, `frontend/src/components/PlaidLinkButton.tsx`.

Plaid is US-only and useless for India. **Replace with Account Aggregator (AA) framework** — this is the SEBI/RBI-mandated standard for financial data sharing in India.

**Providers:** Setu, Finbox, Cookiejar — all provide AA-compliant APIs.

```typescript
// New: frontend/src/components/AccountAggregatorButton.tsx
// New: backend/src/routes/aa.routes.ts
// New: backend/src/services/accountAggregator.service.ts
```

---

## 7. Frontend Performance

### 7.1 No Code Splitting — All Routes Load at Once

**File:** `frontend/src/App.tsx` — All page components are imported directly at the top.

`FinancialDashboard.tsx` is 73 KB. `FinancialSnapshot.tsx` is 54 KB. Every user downloads all of this on first load even if they never visit those pages.

**Fix — React lazy loading:**
```typescript
// Replace static imports:
// import FinancialDashboard from './pages/FinancialDashboard';

// With lazy imports:
const FinancialDashboard = lazy(() => import('./pages/FinancialDashboard'));
const FinancialSnapshot = lazy(() => import('./pages/FinancialSnapshot'));

// Wrap routes in Suspense:
<Suspense fallback={<LoadingSpinner />}>
    <Route path="/dashboard" element={<FinancialDashboard />} />
</Suspense>
```
Expected improvement: 60-70% reduction in initial bundle size.

---

### 7.2 No CDN for Static Assets

All JS/CSS/images are served from the Node.js backend (`/uploads` static route). Node.js is not a file server.

**Fix:**
1. Build the frontend: `npm run build`
2. Upload `dist/` to **Cloudflare Pages** or **AWS S3 + CloudFront**
3. Set cache headers: `Cache-Control: public, max-age=31536000, immutable` for hashed assets
4. Remove `app.use('/uploads', express.static('uploads'))` from `app.ts`

---

### 7.3 Tokens Stored in localStorage — XSS Vulnerable

**File:** `frontend/src/lib/api.ts` — `localStorage.getItem('wm_token')`.

`localStorage` is accessible by any JavaScript on the page. An XSS attack anywhere in the app (or in a third-party script) can steal the JWT.

**Fix — Use httpOnly cookies:**
```typescript
// Backend: Set token as httpOnly cookie on login:
res.cookie('access_token', token, {
    httpOnly: true,     // Not accessible by JS
    secure: true,       // HTTPS only
    sameSite: 'strict', // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes
});

// Frontend: Remove all localStorage.getItem('wm_token') calls.
// Axios will send the cookie automatically with `withCredentials: true`.
api.defaults.withCredentials = true;
```

---

### 7.4 `console.log` of Financial Data in Production

**File:** `frontend/src/pages/SmartReportDashboard.tsx` — Line 22: `console.log('Report Payload:', result)`.

**File:** `backend/src/app.ts` — Line 42: `console.log('Mounting API Routes...')`.

Both log sensitive financial data and internal info to browser/server consoles visible to anyone with DevTools.

**Fix:** Replace all `console.log` with structured logger calls. In production, disable `console.log` globally:
```typescript
if (config.isProduction()) {
    console.log = () => {};
    console.debug = () => {};
}
```

---

## 8. API Design & Rate Limiting

### 8.1 No API Versioning Strategy

Currently everything is `/api/v1`. When you need to make breaking changes for 1M users (some will be on old clients), you need `/api/v2` without breaking v1.

**Fix:** The v1 prefix is already there — good. Establish a policy: new routes go to v1, breaking changes to v2. Keep v1 alive for 6 months after v2 launch.

---

### 8.2 No Request Timeout on External API Calls

**File:** `backend/src/services/navSync.service.ts` — Line 64: `timeout: 60_000`. This is reasonable.

But `backend/src/services/mfapi.service.ts` and others use axios without explicit timeouts. If `mfapi.in` goes down, requests will hang indefinitely, exhausting the connection pool.

**Fix:** Create a shared axios instance with defaults:
```typescript
// backend/src/config/httpClient.ts
export const httpClient = axios.create({
    timeout: 30000, // 30 second max for all external calls
    headers: { 'User-Agent': 'WealthMax/1.0' },
});
```
Use this everywhere instead of raw `axios.get()`.

---

### 8.3 CORS Is Not Strict Enough

**File:** `backend/src/app.ts` — Line 19: `origin: process.env.FRONTEND_URL`. This is okay but note line 16 also loads `config.get('CORS_ORIGIN')` and never uses it — dead code.

**Fix:**
```typescript
app.use(cors({
    origin: (origin, callback) => {
        const allowed = [process.env.FRONTEND_URL, process.env.PARTNER_URL];
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 9. Observability & Monitoring

### 9.1 No Health Check for Dependencies

**File:** `backend/src/routes/health.routes.ts` — The health route likely just returns `{ status: 'ok' }`.

For production, health checks must verify all dependencies:
```typescript
router.get('/health', async (req, res) => {
    const checks = {
        database: await checkDatabase(),
        redis: await checkRedis(),
        amfi: await checkAmfiReachability(),
    };
    const healthy = Object.values(checks).every(v => v === 'ok');
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'healthy' : 'degraded', checks });
});

router.get('/health/live', (req, res) => res.json({ status: 'alive' })); // Kubernetes liveness
router.get('/health/ready', async (req, res) => { ... }); // Kubernetes readiness
```

---

### 9.2 No Structured Error Tracking

**File:** `backend/src/middleware/errorHandler.ts` — Errors are logged to Winston but never sent to an error tracking service.

**Fix — Add Sentry:**
```bash
npm install @sentry/node @sentry/profiling-node
```
```typescript
// In app.ts:
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN, environment: config.get('NODE_ENV') });
app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler()); // Before errorHandler middleware
```
This gives you real-time error alerts, stack traces grouped by issue, and user-impact metrics.

---

### 9.3 No APM / Performance Tracing

For 1M users, you need to know which endpoints are slow. Add:
- **New Relic** or **Datadog APM** for Node.js — automatic instrumentation of DB queries, HTTP calls, function timings.
- Or use **OpenTelemetry** (free, vendor-neutral) with Jaeger/Tempo backend.

---

### 9.4 No Alerting System

No alerts when:
- NAV sync fails
- Error rate spikes
- DB connections exhausted
- Response times degrade

**Fix:** Set up PagerDuty or OpsGenie alerts triggered from:
- Sentry (error rate thresholds)
- Datadog/New Relic monitors
- Uptime checks (Pingdom, Better Uptime)

---

## 10. Infrastructure & Deployment

### 10.1 No Docker Configuration

There is no `Dockerfile` or `docker-compose.yml` in the project. Every developer sets up manually, and production deployment is manual.

**Fix — Add to project root:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 5001
CMD ["node", "dist/server.js"]
```
```yaml
# docker-compose.yml (local development)
services:
  backend:
    build: ./backend
    ports: ["5001:5001"]
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
```

---

### 10.2 Redis Is Configured But Never Actually Used

**File:** `backend/src/config/env.ts` — `REDIS_URL` is defined. But no Redis client is initialized anywhere in the codebase. The `otp.service.ts` comment says "Use Redis in production" but the code still uses Maps.

**Fix — Create `backend/src/config/redis.ts`:**
```typescript
import { createClient } from 'redis';
import config from './env';

const redis = createClient({ url: config.get('REDIS_URL') });
redis.on('error', (err) => logger.error('Redis error', err));
await redis.connect();

export default redis;
```
Then replace all in-memory Maps (OTP store, any future caches) with Redis calls.

---

### 10.3 No CI/CD Pipeline

No `Dockerfile`, no `.github/workflows/`, no automated tests. Every deploy is manual.

**Fix — Add GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t wealthmax-backend:${{ github.sha }} ./backend
      - name: Push to registry and deploy
        run: # kubectl set image deployment/backend backend=wealthmax-backend:${{ github.sha }}
```

---

### 10.4 No Backup Strategy for Database

Financial data requires **point-in-time recovery (PITR)**. If Supabase is used, PITR is available on Pro tier — ensure it's enabled. If self-hosted PostgreSQL:
```
1. Enable WAL archiving to S3
2. Daily pg_dump to a separate S3 bucket (encrypted)
3. Test restore monthly
4. Set retention: 30 days minimum (SEBI requirement for financial platforms)
```

---

## 11. Priority Roadmap

Do these **in order**. Do not skip Phase 1.

### Phase 1 — Emergency Security (Week 1, Today)
| # | Task | File | Effort |
|---|------|------|--------|
| 1 | Rotate all leaked secrets | `.env.example`, `iifl*.service.ts` | 2 hours |
| 2 | Remove `123456` OTP bypass | `otp.service.ts` L27, L66 | 30 min |
| 3 | Remove debug route from production | `routes/index.ts` L32 | 15 min |
| 4 | Add body size limits | `app.ts` L25 | 15 min |
| 5 | Fix JWT secret to non-default | `env.ts` L38 | 15 min |
| 6 | Remove OTP from API response | `auth.service.ts` L112 | 15 min |

### Phase 2 — Core Infrastructure (Weeks 2-3)
| # | Task | Effort |
|---|------|--------|
| 7 | Add Redis (client config + OTP migration) | 1 day |
| 8 | Add rate limiting | 0.5 day |
| 9 | Add refresh token system | 1 day |
| 10 | Add DB indexes | 2 hours |
| 11 | Add DB migration system | 1 day |
| 12 | Increase DB pool size | 30 min |

### Phase 3 — Live Features (Weeks 3-5)
| # | Task | Effort |
|---|------|--------|
| 13 | Wire SMS OTP (MSG91) | 1 day |
| 14 | Wire ReportingDashboard to real API | 1 day |
| 15 | Wire ProposalGenerator PDF | 1 day |
| 16 | Activate AuditService (add DB table) | 0.5 day |
| 17 | Replace Plaid with Account Aggregator | 3 days |
| 18 | Complete rebalancing + tax routes | 2 days |

### Phase 4 — Scale (Weeks 5-8)
| # | Task | Effort |
|---|------|--------|
| 19 | Dockerize everything | 2 days |
| 20 | Set up CI/CD (GitHub Actions) | 1 day |
| 21 | Move crons to dedicated worker | 1 day |
| 22 | Add Bull queue for PDF generation | 1 day |
| 23 | Add Redis caching layer | 2 days |
| 24 | Frontend code splitting | 1 day |
| 25 | Move tokens from localStorage to httpOnly cookies | 1 day |
| 26 | Add Sentry error tracking | 0.5 day |
| 27 | Add APM (New Relic / Datadog) | 0.5 day |
| 28 | PgBouncer + horizontal scaling | 2 days |

### Phase 5 — Production Hardening (Week 8+)
| # | Task |
|---|------|
| 29 | Load test with k6 (target: 1M users) |
| 30 | RS256 JWT migration |
| 31 | SEBI compliance audit (logs, encryption, data retention) |
| 32 | Penetration testing by external firm |
| 33 | SOC 2 / ISO 27001 alignment |
| 34 | Disaster recovery drill (restore DB from backup) |

---

## Quick Reference: File-to-Fix Mapping

| File | Problem | Fix Section |
|------|---------|-------------|
| `backend/src/services/otp.service.ts` | `123456` master bypass, in-memory OTP, OTP in logs | 1.2, 1.3, 1.8 |
| `backend/src/services/auth.service.ts` | OTP returned in response, no refresh token | 1.8, 2.1, 1.4 |
| `backend/src/config/database.ts` | Pool too small (20), SSL cert disabled | 3.1, 1.7 |
| `backend/src/config/env.ts` | Default JWT secret, default encryption key | 1.1, 1.5 |
| `backend/src/routes/index.ts` | Debug route in prod, Plaid route, no role guards | 1.5, 2.2, 6.7 |
| `backend/src/services/audit.service.ts` | 100% no-op | 6.4 |
| `backend/src/services/iifl.service.ts` | Hardcoded keys, all-mock data | 1.1, 5.2 |
| `backend/src/services/iiflapi.service.ts` | Hardcoded keys, fake auth, duplicate file | 1.1, 5.2 |
| `backend/src/services/mutualFund.mock.service.ts` | All hardcoded fake data | useless.md |
| `backend/src/server.ts` | Crons on all instances, sequential hydration loop, inline schema migrations | 4.4, 3.5, 3.4 |
| `backend/src/app.ts` | No rate limit, no body size limit, unused CORS var | 4.3, 4.2, 8.3 |
| `frontend/src/lib/api.ts` | Tokens in localStorage (XSS), refresh endpoint missing | 7.3, 1.4 |
| `frontend/src/pages/ReportingDashboard.tsx` | 100% mock data | 6.2 |
| `frontend/src/pages/ProposalGenerator.tsx` | Fake PDF, empty fund step | 6.3 |
| `frontend/src/pages/SmartReportDashboard.tsx` | `console.log` of financial data | 7.4 |
| `frontend/src/components/PlaidLinkButton.tsx` | US-only, irrelevant for India | 6.7 |
| `frontend/.env.example` | Live production secrets committed | 1.1 |
