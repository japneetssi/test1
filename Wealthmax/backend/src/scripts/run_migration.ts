import db from '../config/database';

async function migrate() {
    try {
        console.log("Dropping existing tables if any...");
        // Drop existing tables to start fresh
        await db.query(`
            DROP TABLE IF EXISTS audit_logs CASCADE;
            DROP TABLE IF EXISTS score_history CASCADE;
            DROP TABLE IF EXISTS survey_responses CASCADE;
            DROP TABLE IF EXISTS action_items CASCADE;
            DROP TABLE IF EXISTS goals CASCADE;
            DROP TABLE IF EXISTS portfolio_transactions CASCADE;
            DROP TABLE IF EXISTS portfolio_holdings CASCADE;
            DROP TABLE IF EXISTS user_portfolios CASCADE;
            DROP TABLE IF EXISTS holding_metadata CASCADE;
            DROP TABLE IF EXISTS market_index_history CASCADE;
            DROP TABLE IF EXISTS market_indices CASCADE;
            DROP TABLE IF EXISTS profiles CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS financial_profiles CASCADE;
            DROP TABLE IF EXISTS health_scores CASCADE;
            DROP TABLE IF EXISTS portfolios CASCADE;
            DROP TABLE IF EXISTS margin_ledgers CASCADE;
            DROP TABLE IF EXISTS action_alerts CASCADE;
        `);

        console.log("Creating new MVP tables...");

        // 1. users
        await db.query(`
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                mobile VARCHAR(15) UNIQUE NOT NULL,
                pan_encrypted VARCHAR(255),
                kyc_status VARCHAR(50) DEFAULT 'Pending',
                assigned_persona VARCHAR(50),
                risk_class VARCHAR(50),
                dob DATE,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. financial_profiles
        await db.query(`
            CREATE TABLE financial_profiles (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                dependents INTEGER DEFAULT 0,
                gross_income NUMERIC(15, 2) DEFAULT 0,
                fixed_expenses NUMERIC(15, 2) DEFAULT 0,
                liabilities_emi NUMERIC(15, 2) DEFAULT 0,
                existing_assets NUMERIC(15, 2) DEFAULT 0,
                emergency_fund_amount NUMERIC(15, 2) DEFAULT 0,
                insurance_cover NUMERIC(15, 2) DEFAULT 0,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. health_scores
        await db.query(`
            CREATE TABLE health_scores (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                total_score INTEGER CHECK (total_score >= 0 AND total_score <= 100),
                savings_score INTEGER,
                debt_score INTEGER,
                liquidity_score INTEGER,
                diversity_score INTEGER,
                goals_score INTEGER,
                literacy_score INTEGER,
                calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_health_scores_user ON health_scores(user_id);
        `);

        // 4. portfolios
        await db.query(`
            CREATE TABLE portfolios (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                asset_class VARCHAR(50) NOT NULL,
                isin_code VARCHAR(20) NOT NULL,
                scrip_name VARCHAR(255) NOT NULL,
                quantity NUMERIC(15, 4) NOT NULL,
                average_buy_price NUMERIC(15, 2) NOT NULL,
                pledge_status VARCHAR(50) DEFAULT 'Free',
                imported_via VARCHAR(50),
                last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_portfolios_user ON portfolios(user_id);
        `);

        // 5. margin_ledgers
        await db.query(`
            CREATE TABLE margin_ledgers (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                is_trial_mode BOOLEAN DEFAULT TRUE,
                approved_ltv_cap NUMERIC(5, 2) DEFAULT 80.00,
                total_pledge_value NUMERIC(15, 2) DEFAULT 0.00,
                utilized_margin NUMERIC(15, 2) DEFAULT 0.00,
                margin_call_status VARCHAR(50) DEFAULT 'Healthy',
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 6. action_alerts
        await db.query(`
            CREATE TABLE action_alerts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                alert_type VARCHAR(100) NOT NULL,
                severity VARCHAR(50) NOT NULL,
                problem_statement TEXT NOT NULL,
                action_text TEXT,
                linked_tool VARCHAR(100),
                is_resolved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_action_alerts_user ON action_alerts(user_id);
        `);

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

migrate();
