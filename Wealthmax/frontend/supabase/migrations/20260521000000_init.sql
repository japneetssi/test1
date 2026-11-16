-- ============================================================
-- WealthMax Supabase Database - Complete Migration
-- Generated: 2026-05-21
-- Run this file to set up the complete database schema and seed data
-- ============================================================

-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================
-- SECTION 2: TRIGGER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- SECTION 3: CORE TABLES (create in dependency order)
-- ============================================================

-- Users table (foundation - create early as it's referenced everywhere)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'advisor', 'admin', 'rm')),
    advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES partner_agencies(id) ON DELETE SET NULL,
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Partner Agencies (must be created early - referenced by users, families, client_invites)
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

-- Families table
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    head_user_id UUID,
    partner_id UUID REFERENCES partner_agencies(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp
);

-- Market Indices table
CREATE TABLE IF NOT EXISTS market_indices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    symbol VARCHAR(50),
    type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    mobile VARCHAR(20),
    date_of_birth DATE,
    occupation VARCHAR(100),
    annual_income NUMERIC,
    risk_appetite VARCHAR(20) CHECK (risk_appetite IN ('low', 'medium', 'high')),
    avatar_url TEXT,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp
);

-- Holding Metadata table
CREATE TABLE IF NOT EXISTS holding_metadata (
    isin VARCHAR(12) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('EQUITY', 'MUTUAL_FUND')),
    ticker VARCHAR(50),
    current_nav DECIMAL(15,4),
    nav_date TIMESTAMPTZ,
    description TEXT,
    benchmark_index_id UUID,
    category VARCHAR(50) DEFAULT 'Uncategorized',
    sector VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- User Portfolios table
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

-- Portfolio Holdings table
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

-- Portfolio Transactions table
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

-- Market Index History table
CREATE TABLE IF NOT EXISTS market_index_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    index_id UUID REFERENCES market_indices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Mutual Fund NAV table
CREATE TABLE IF NOT EXISTS mutual_fund_nav (
    isin VARCHAR(20) PRIMARY KEY,
    scheme_name VARCHAR(255) NOT NULL,
    current_nav DECIMAL(10,4) NOT NULL,
    nav_date DATE NOT NULL,
    last_synced TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Platform Metrics table
CREATE TABLE IF NOT EXISTS platform_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_aum DECIMAL(20,2) DEFAULT 0,
    active_users_count INTEGER DEFAULT 0,
    onboarded_partners_count INTEGER DEFAULT 0,
    onboarded_advisors_count INTEGER DEFAULT 0,
    wealth_margin DECIMAL(15,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Survey Responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    responses JSONB NOT NULL,
    total_score INTEGER NOT NULL,
    final_class VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Action Items table
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

-- Health Scores table
CREATE TABLE IF NOT EXISTS health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 1000),
    savings_score NUMERIC NOT NULL DEFAULT 0,
    debt_score NUMERIC NOT NULL DEFAULT 0,
    liquidity_score NUMERIC NOT NULL DEFAULT 0,
    diversification_score NUMERIC NOT NULL DEFAULT 0,
    insurance_score NUMERIC NOT NULL DEFAULT 0,
    goal_score NUMERIC NOT NULL DEFAULT 0,
    improvement_tips TEXT[] NOT NULL DEFAULT '{}',
    peer_rank NUMERIC NOT NULL DEFAULT 50,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Goals table
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

-- Interaction Logs table
CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Documents table
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

-- Pledge Requests table
CREATE TABLE IF NOT EXISTS pledge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    amount NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- Onboarding Prospects table
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

-- Advisor Prospects table
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

-- Client Invites table
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

-- Audit Logs table
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

-- ============================================================
-- SECTION 4: PLEDGE & MARGIN TABLES
-- ============================================================

-- Holdings table: tracks user's free/pledged assets
CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    scrip_name TEXT NOT NULL,
    asset_type TEXT NOT NULL DEFAULT 'equity' CHECK (asset_type IN ('equity', 'mutual_fund', 'etf')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    avg_price NUMERIC NOT NULL CHECK (avg_price >= 0),
    current_nav NUMERIC NOT NULL DEFAULT 0,
    haircut NUMERIC NOT NULL DEFAULT 0.20,
    status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'pledged')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pledge ledger: immutable audit log of pledge/unpledge events
CREATE TABLE IF NOT EXISTS pledge_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    holding_id UUID REFERENCES holdings(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('pledge', 'unpledge', 'auto_liquidate')),
    units NUMERIC NOT NULL,
    nav_at_action NUMERIC NOT NULL,
    pledge_value NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Margin accounts: tracks borrowed amount and credit available
CREATE TABLE IF NOT EXISTS margin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_pledge_value NUMERIC NOT NULL DEFAULT 0,
    available_credit NUMERIC NOT NULL DEFAULT 0,
    borrowed_amount NUMERIC NOT NULL DEFAULT 0,
    utilization_pct NUMERIC NOT NULL DEFAULT 0,
    margin_call_triggered BOOLEAN NOT NULL DEFAULT false,
    last_risk_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SECTION 5: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON users(partner_id);
CREATE INDEX IF NOT EXISTS idx_users_advisor_id ON users(advisor_id);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);

CREATE INDEX IF NOT EXISTS idx_families_head_user_id ON families(head_user_id);
CREATE INDEX IF NOT EXISTS idx_families_partner_id ON families(partner_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_action_items_user_id ON action_items(user_id);

CREATE INDEX IF NOT EXISTS idx_holding_metadata_ticker ON holding_metadata(ticker);
CREATE INDEX IF NOT EXISTS idx_holding_metadata_type ON holding_metadata(type);

CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_sync_status ON user_portfolios(sync_status);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_isin ON portfolio_holdings(isin);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_source ON portfolio_holdings(source);

CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_portfolio_id ON portfolio_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_isin ON portfolio_transactions(isin);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_transaction_date ON portfolio_transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_health_scores_total ON health_scores(total_score);
CREATE INDEX IF NOT EXISTS idx_health_scores_user ON health_scores(user_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_mutual_fund_nav_nav_date ON mutual_fund_nav(nav_date);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_family_id ON goals(family_id);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_client_id ON interaction_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_advisor_id ON interaction_logs(advisor_id);

CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_advisor_id ON documents(advisor_id);

CREATE INDEX IF NOT EXISTS idx_pledge_requests_user_id ON pledge_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pledge_requests_status ON pledge_requests(status);

CREATE INDEX IF NOT EXISTS idx_onboarding_prospects_rm_id ON onboarding_prospects(rm_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_prospects_stage ON onboarding_prospects(stage);

CREATE INDEX IF NOT EXISTS idx_advisor_prospects_advisor_id ON advisor_prospects(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_prospects_status ON advisor_prospects(status);

CREATE INDEX IF NOT EXISTS idx_client_invites_token ON client_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_client_invites_advisor ON client_invites(advisor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- SECTION 6: CONSTRAINTS
-- ============================================================

ALTER TABLE portfolio_transactions ADD CONSTRAINT unique_transaction UNIQUE (portfolio_id, isin, transaction_date, transaction_type, units, amount);

ALTER TABLE market_index_history ADD CONSTRAINT market_index_history_index_id_date_key UNIQUE (index_id, date);

ALTER TABLE holding_metadata ADD CONSTRAINT holding_metadata_benchmark_index_id_fkey FOREIGN KEY (benchmark_index_id) REFERENCES market_indices(id) ON DELETE SET NULL;

-- ============================================================
-- SECTION 7: TRIGGERS
-- ============================================================

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- ============================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pledge_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own holdings" ON holdings
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own pledge ledger" ON pledge_ledger
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users view own margin account" ON margin_accounts
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users view own health scores" ON health_scores
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Service role full access holdings" ON holdings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access pledge_ledger" ON pledge_ledger
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access margin_accounts" ON margin_accounts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access health_scores" ON health_scores
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- SECTION 9: SEED DATA
-- ============================================================

INSERT INTO platform_metrics (total_aum, active_users_count, onboarded_partners_count, onboarded_advisors_count, wealth_margin) 
VALUES (8920000000, 2847, 7, 38, 124000000)
ON CONFLICT DO NOTHING;

INSERT INTO partner_agencies (name, admin_email, total_clients, subscription_tier, status) VALUES 
    ('Next Curve Financials', 'rajesh@nextcurve.in', 142, 'Business Pro', 'Active'),
    ('Alpha Wealth Partners', 'sneha@alphawp.com', 89, 'Enterprise', 'Active'),
    ('Pinnacle Advisory', 'amit@pinnacle.co', 56, 'Starter', 'Active'),
    ('Vertex Capital', 'kiran@vertexcap.in', 210, 'Enterprise', 'Active'),
    ('Horizon MF Distributors', 'priya@horizonmf.com', 34, 'Business Pro', 'Suspended'),
    ('TrustBridge Advisors', 'deepak@trustbridge.in', 78, 'Starter', 'Active'),
    ('Wealth Guru Network', 'suresh@wealthguru.co', 0, 'Starter', 'Suspended')
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- All tables, indexes, triggers, policies, and seed data have been created.
-- ============================================================