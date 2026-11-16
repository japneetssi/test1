-- ============================================================
-- WealthMax Supabase Database Backup
-- Generated: 2026-04-11
-- Project: vwkfljvijngvogkgswmv
-- ============================================================

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    pan_encrypted TEXT,
    is_email_verified BOOLEAN DEFAULT false,
    is_mobile_verified BOOLEAN DEFAULT false,
    password_hash TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    pan_digest VARCHAR(64) UNIQUE,
    partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    kyc_status VARCHAR(50) DEFAULT 'Pending',
    assigned_persona VARCHAR(50),
    risk_class VARCHAR(50),
    risk_score INTEGER,
    dob DATE,
    occupation TEXT,
    marital_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_advisor_id ON users(advisor_id);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    gross_income DECIMAL(15,2) DEFAULT 0,
    fixed_expenses DECIMAL(15,2) DEFAULT 0,
    total_liabilities DECIMAL(15,2) DEFAULT 0,
    existing_assets DECIMAL(15,2) DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    risk_class VARCHAR(50) CHECK (risk_class IN ('Conservative', 'Moderate', 'Aggressive')),
    health_score INTEGER DEFAULT 0,
    checklist_status JSONB DEFAULT '{}',
    monthly_emi DECIMAL(15,2) DEFAULT 0,
    insurance_premium DECIMAL(15,2) DEFAULT 0,
    persona_data JSONB DEFAULT '{}',
    asset_types JSONB DEFAULT '[]',
    insurance_coverage DECIMAL DEFAULT 0,
    action_items JSONB DEFAULT '[]',
    age INTEGER DEFAULT 30,
    dependents INTEGER DEFAULT 0,
    liabilities_emi NUMERIC(15,2) DEFAULT 0,
    emergency_fund_amount NUMERIC(15,2) DEFAULT 0,
    insurance_cover NUMERIC(15,2) DEFAULT 0,
    other_income NUMERIC(15,2) DEFAULT 0,
    household_expenses NUMERIC(15,2) DEFAULT 0,
    bank_balance NUMERIC(15,2) DEFAULT 0,
    fixed_deposits NUMERIC(15,2) DEFAULT 0,
    trading_capital NUMERIC(15,2) DEFAULT 0,
    gold_assets NUMERIC(15,2) DEFAULT 0,
    real_estate_assets NUMERIC(15,2) DEFAULT 0,
    home_loan NUMERIC(15,2) DEFAULT 0,
    personal_loan NUMERIC(15,2) DEFAULT 0,
    health_insurance_cover NUMERIC(15,2) DEFAULT 0,
    is_active_trader BOOLEAN DEFAULT false,
    trading_capital_allocation_percent NUMERIC(5,2) DEFAULT 25,
    trading_strategies TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- ============================================================
-- SURVEY RESPONSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    responses JSONB NOT NULL,
    total_score INTEGER NOT NULL,
    final_class VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

-- ============================================================
-- ACTION ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_type VARCHAR(100),
    severity VARCHAR(50),
    gap_amount NUMERIC(15,2) DEFAULT 0,
    estimated_score_impact INTEGER DEFAULT 0,
    problem_statement TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);

-- ============================================================
-- HOLDING METADATA TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS holding_metadata (
    isin VARCHAR(12) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('EQUITY', 'MUTUAL_FUND')),
    ticker VARCHAR(50),
    current_nav DECIMAL(15,4),
    nav_date TIMESTAMPTZ,
    description TEXT,
    benchmark_index_id UUID REFERENCES market_indices(id) ON DELETE SET NULL,
    category VARCHAR(50) DEFAULT 'Uncategorized',
    sector VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_holding_metadata_ticker ON holding_metadata(ticker);
CREATE INDEX IF NOT EXISTS idx_holding_metadata_type ON holding_metadata(type);

-- ============================================================
-- USER PORTFOLIOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_alias VARCHAR(100) DEFAULT 'Main Portfolio',
    source VARCHAR(50),
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(20) CHECK (sync_status IS NULL OR sync_status IN ('SUCCESS', 'PARTIAL', 'FAILED')),
    sync_source VARCHAR(20) CHECK (sync_source IS NULL OR sync_source IN ('MANUAL', 'CSV', 'CAS', 'PAN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_sync_status ON user_portfolios(sync_status);

-- ============================================================
-- PORTFOLIO HOLDINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    isin VARCHAR(12) NOT NULL REFERENCES holding_metadata(isin) ON DELETE RESTRICT,
    quantity DECIMAL(20,4) NOT NULL,
    average_price DECIMAL(15,4),
    last_valuation DECIMAL(15,2),
    source VARCHAR(20) NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'CSV', 'CAS', 'PAN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_isin ON portfolio_holdings(isin);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_source ON portfolio_holdings(source);

-- ============================================================
-- PORTFOLIO TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    isin VARCHAR(12) NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('BUY', 'SELL', 'SIP', 'SWITCH_IN', 'SWITCH_OUT', 'DIVIDEND', 'REDEMPTION')),
    units DECIMAL(20,4) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    nav DECIMAL(15,4),
    folio VARCHAR(50),
    source VARCHAR(20) NOT NULL DEFAULT 'CAS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_portfolio_id ON portfolio_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_isin ON portfolio_transactions(isin);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_transaction_date ON portfolio_transactions(transaction_date);

ALTER TABLE portfolio_transactions ADD CONSTRAINT unique_transaction UNIQUE (portfolio_id, isin, transaction_date, transaction_type, units, amount);

-- ============================================================
-- MARKET INDICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS market_indices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    symbol VARCHAR(50),
    type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_index_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    index_id UUID REFERENCES market_indices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE market_index_history ADD CONSTRAINT market_index_history_index_id_date_key UNIQUE (index_id, date);

-- ============================================================
-- HEALTH SCORES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    savings_score INTEGER DEFAULT 0,
    debt_score INTEGER DEFAULT 0,
    liquidity_score INTEGER DEFAULT 0,
    diversity_score INTEGER DEFAULT 0,
    protection_score INTEGER DEFAULT 0,
    goals_score INTEGER DEFAULT 0,
    literacy_score INTEGER DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_health_scores_user_id ON health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_calculated_at ON health_scores(calculated_at);

-- ============================================================
-- PARTNER AGENCIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL UNIQUE,
    total_clients INTEGER DEFAULT 0,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'Starter',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#00458c',
    action_color VARCHAR(7) DEFAULT '#f37920',
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- ============================================================
-- PLATFORM METRICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_aum DECIMAL(20,2) DEFAULT 0,
    active_users_count INTEGER DEFAULT 0,
    onboarded_partners_count INTEGER DEFAULT 0,
    onboarded_advisors_count INTEGER DEFAULT 0,
    wealth_margin DECIMAL(15,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- ============================================================
-- MUTUAL FUND NAV TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS mutual_fund_nav (
    isin VARCHAR(20) PRIMARY KEY,
    scheme_name VARCHAR(255) NOT NULL,
    current_nav DECIMAL(10,4) NOT NULL,
    nav_date DATE NOT NULL,
    last_synced TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_mutual_fund_nav_nav_date ON mutual_fund_nav(nav_date);

-- ============================================================
-- FAMILIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    head_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partner_agencies(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_families_head_user_id ON families(head_user_id);
CREATE INDEX IF NOT EXISTS idx_families_partner_id ON families(partner_id);

-- ============================================================
-- GOALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    target_date DATE NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    monthly_contribution DECIMAL(15,2) DEFAULT 0,
    priority VARCHAR(50) DEFAULT 'Medium',
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    is_family_goal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_family_id ON goals(family_id);

-- ============================================================
-- INTERACTION LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_client_id ON interaction_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_advisor_id ON interaction_logs(advisor_id);

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(512) NOT NULL,
    url TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(255),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_advisor_id ON documents(advisor_id);

-- ============================================================
-- PLEDGE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS pledge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_pledge_requests_user_id ON pledge_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pledge_requests_status ON pledge_requests(status);

-- ============================================================
-- ONBOARDING PROSPECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rm_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(20),
    stage VARCHAR(50) NOT NULL DEFAULT 'Prospect',
    estimated_aum NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    last_contact TIMESTAMP NOT NULL DEFAULT current_timestamp,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_onboarding_prospects_rm_id ON onboarding_prospects(rm_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_prospects_stage ON onboarding_prospects(stage);

-- ============================================================
-- ADVISOR PROSPECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS advisor_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    est_aum NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Proposal Sent', 'Converted', 'Lost')),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_advisor_prospects_advisor_id ON advisor_prospects(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_prospects_status ON advisor_prospects(status);

-- ============================================================
-- CLIENT INVITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS client_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partner_agencies(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    client_email VARCHAR(255) NOT NULL,
    invite_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Expired')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_invites_token ON client_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_client_invites_advisor ON client_invites(advisor_id);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- INITIAL SEED DATA
-- ============================================================

-- Platform Metrics Seed
INSERT INTO platform_metrics (total_aum, active_users_count, onboarded_partners_count, onboarded_advisors_count, wealth_margin) 
VALUES (8920000000, 2847, 7, 38, 124000000)
ON CONFLICT DO NOTHING;

-- Partner Agencies Seed
INSERT INTO partner_agencies (name, admin_email, total_clients, subscription_tier, status) VALUES 
('Next Curve Financials', 'rajesh@nextcurve.in', 142, 'Business Pro', 'Active'),
('Alpha Wealth Partners', 'sneha@alphawp.com', 89, 'Enterprise', 'Active'),
('Pinnacle Advisory', 'amit@pinnacle.co', 56, 'Starter', 'Active'),
('Vertex Capital', 'kiran@vertexcap.in', 210, 'Enterprise', 'Active'),
('Horizon MF Distributors', 'priya@horizonmf.com', 34, 'Business Pro', 'Suspended'),
('TrustBridge Advisors', 'deepak@trustbridge.in', 78, 'Starter', 'Active'),
('Wealth Guru Network', 'suresh@wealthguru.co', 0, 'Starter', 'Suspended')
ON CONFLICT DO NOTHING;