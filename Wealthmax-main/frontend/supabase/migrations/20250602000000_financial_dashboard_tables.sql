-- ============================================================
-- WealthMax Financial Dashboard Tables
-- Created: 2025-06-02
-- This migration adds comprehensive financial data tracking tables
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ 
BEGIN
    CREATE TYPE frequency_type AS ENUM ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- INCOMES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    base_income NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    income_id UUID NOT NULL REFERENCES incomes(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    frequency frequency_type NOT NULL DEFAULT 'Monthly',
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- ============================================================
-- EXPENSES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    base_expenses NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS expense_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    frequency frequency_type NOT NULL DEFAULT 'Monthly',
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- ============================================================
-- ASSETS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Financial Assets
    bank_balance NUMERIC(15,2) DEFAULT 0,
    fixed_deposits NUMERIC(15,2) DEFAULT 0,
    mutual_funds NUMERIC(15,2) DEFAULT 0,
    bonds NUMERIC(15,2) DEFAULT 0,
    provident_fund NUMERIC(15,2) DEFAULT 0,
    gold_etfs NUMERIC(15,2) DEFAULT 0,
    -- Physical Assets
    land_property NUMERIC(15,2) DEFAULT 0,
    vehicles NUMERIC(15,2) DEFAULT 0,
    gold_physical NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

CREATE TABLE IF NOT EXISTS other_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- ============================================================
-- LIABILITIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    home_loan NUMERIC(15,2) DEFAULT 0,
    personal_loan NUMERIC(15,2) DEFAULT 0,
    car_loan NUMERIC(15,2) DEFAULT 0,
    credit_card_loan NUMERIC(15,2) DEFAULT 0,
    business_loan NUMERIC(15,2) DEFAULT 0,
    other_liabilities NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- ============================================================
-- SAFETY NET TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_nets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emergency_fund NUMERIC(15,2) DEFAULT 0,
    life_insurance NUMERIC(15,2) DEFAULT 0,
    health_insurance NUMERIC(15,2) DEFAULT 0,
    general_insurance NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_income_sources_income_id ON income_sources(income_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_sources_expense_id ON expense_sources(expense_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_other_assets_asset_id ON other_assets(asset_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_liabilities_user_id ON liabilities(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_safety_nets_user_id ON safety_nets(user_id);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: If you run this script multiple times (idempotently) on Postgres < 14, 
-- these CREATE TRIGGER statements might throw a "trigger already exists" error.
-- To fix that, you can use `CREATE OR REPLACE TRIGGER` (Postgres 14+) or 
-- `DROP TRIGGER IF EXISTS trigger_name ON table_name;` right before creating them.

-- Incomes triggers
CREATE TRIGGER update_incomes_modtime BEFORE UPDATE ON incomes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_income_sources_modtime BEFORE UPDATE ON income_sources FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Expenses triggers
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_expense_sources_modtime BEFORE UPDATE ON expense_sources FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Assets triggers
CREATE TRIGGER update_assets_modtime BEFORE UPDATE ON assets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_other_assets_modtime BEFORE UPDATE ON other_assets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Liabilities trigger
CREATE TRIGGER update_liabilities_modtime BEFORE UPDATE ON liabilities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Safety Net trigger
CREATE TRIGGER update_safety_nets_modtime BEFORE UPDATE ON safety_nets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE other_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_nets ENABLE ROW LEVEL SECURITY;

-- Policies for incomes
CREATE POLICY "Users can view their own incomes" ON incomes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own incomes" ON incomes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own incomes" ON incomes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own incomes" ON incomes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for income_sources
CREATE POLICY "Users can view their own income sources" ON income_sources FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM incomes i WHERE i.id = income_sources.income_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can insert their own income sources" ON income_sources FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM incomes i WHERE i.id = income_sources.income_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can update their own income sources" ON income_sources FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM incomes i WHERE i.id = income_sources.income_id AND i.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM incomes i WHERE i.id = income_sources.income_id AND i.user_id = auth.uid()));
CREATE POLICY "Users can delete their own income sources" ON income_sources FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM incomes i WHERE i.id = income_sources.income_id AND i.user_id = auth.uid()));

-- Policies for expenses
CREATE POLICY "Users can view their own expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for expense_sources
CREATE POLICY "Users can view their own expense sources" ON expense_sources FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_sources.expense_id AND e.user_id = auth.uid()));
CREATE POLICY "Users can insert their own expense sources" ON expense_sources FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_sources.expense_id AND e.user_id = auth.uid()));
CREATE POLICY "Users can update their own expense sources" ON expense_sources FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_sources.expense_id AND e.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_sources.expense_id AND e.user_id = auth.uid()));
CREATE POLICY "Users can delete their own expense sources" ON expense_sources FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_sources.expense_id AND e.user_id = auth.uid()));

-- Policies for assets
CREATE POLICY "Users can view their own assets" ON assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assets" ON assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON assets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON assets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for other_assets
CREATE POLICY "Users can view their own other assets" ON other_assets FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM assets a WHERE a.id = other_assets.asset_id AND a.user_id = auth.uid()));
CREATE POLICY "Users can insert their own other assets" ON other_assets FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM assets a WHERE a.id = other_assets.asset_id AND a.user_id = auth.uid()));
CREATE POLICY "Users can update their own other assets" ON other_assets FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM assets a WHERE a.id = other_assets.asset_id AND a.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM assets a WHERE a.id = other_assets.asset_id AND a.user_id = auth.uid()));
CREATE POLICY "Users can delete their own other assets" ON other_assets FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM assets a WHERE a.id = other_assets.asset_id AND a.user_id = auth.uid()));

-- Policies for liabilities
CREATE POLICY "Users can view their own liabilities" ON liabilities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own liabilities" ON liabilities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own liabilities" ON liabilities FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own liabilities" ON liabilities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for safety_nets
CREATE POLICY "Users can view their own safety nets" ON safety_nets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own safety nets" ON safety_nets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own safety nets" ON safety_nets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own safety nets" ON safety_nets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Service role policies for backend access
CREATE POLICY "Service role full access incomes" ON incomes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access income_sources" ON income_sources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access expenses" ON expenses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access expense_sources" ON expense_sources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access assets" ON assets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access other_assets" ON other_assets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access liabilities" ON liabilities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access safety_nets" ON safety_nets FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================