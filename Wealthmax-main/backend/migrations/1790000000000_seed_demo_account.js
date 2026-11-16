/* eslint-disable camelcase */

/**
 * DEMO LOGIN ACCOUNT (temporary feature request).
 *
 * Seeds a single demo user so evaluators can log in with the email/mobile
 * below and OTP 123456 while no SMS/SMTP provider is configured. The fixed
 * OTP is accepted ONLY for this account (see auth.service + otp.service);
 * the flag itself is gated by config.isDemoLoginEnabled().
 *
 * Everything in this migration is idempotent: ON CONFLICT DO NOTHING /
 * NOT EXISTS guards, so re-running migrations never duplicates demo data.
 *
 * Login identifiers (overridable via env):
 *   Email : demo@wealthmax.app   (DEMO_EMAIL)
 *   Mobile: +919999999999        (DEMO_MOBILE)
 */

const DEMO_EMAIL = 'demo@wealthmax.app';
const DEMO_MOBILE = '+919999999999';

exports.up = (pgm) => {
    // ── 1. Demo user ────────────────────────────────────────────────────────
    pgm.sql(`
        INSERT INTO users (email, mobile, full_name, role, dob, occupation,
                           marital_status, kyc_status, assigned_persona,
                           risk_class, risk_score)
        VALUES ('${DEMO_EMAIL}', '${DEMO_MOBILE}', 'Demo Investor', 'user',
                '1990-05-15', 'Software Engineer', 'Married', 'Verified',
                'Wealth Builder', 'Moderate', 72)
        ON CONFLICT (email) DO NOTHING;
    `);

    // ── 2. Financial snapshot (drives dashboard + gap analysis) ────────────
    pgm.sql(`
        INSERT INTO profiles (user_id, gross_income, fixed_expenses,
                              total_liabilities, dependents, liabilities_emi,
                              emergency_fund_amount, insurance_cover,
                              bank_balance, fixed_deposits,
                              gold_assets, real_estate_assets, home_loan,
                              personal_loan, health_insurance_cover)
        SELECT u.id, 150000, 60000, 2600000, 1, 18000, 400000, 2500000,
               400000, 500000, 500000, 4500000, 2200000, 150000, 1000000
        FROM users u
        WHERE u.email = '${DEMO_EMAIL}'
          AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = u.id);
    `);

    // ── 3. Incomes ──────────────────────────────────────────────────────────
    pgm.sql(`
        INSERT INTO incomes (user_id, base_income)
        SELECT u.id, 175000 FROM users u
        WHERE u.email = '${DEMO_EMAIL}'
          AND NOT EXISTS (SELECT 1 FROM incomes i WHERE i.user_id = u.id);
    `);
    pgm.sql(`
        INSERT INTO income_sources (income_id, source, amount, frequency)
        SELECT i.id, s.source, s.amount, s.frequency::frequency_type
        FROM incomes i
        JOIN users u ON u.id = i.user_id AND u.email = '${DEMO_EMAIL}'
        JOIN (VALUES
            ('Salary', 150000, 'Monthly'),
            ('Freelance consulting', 25000, 'Monthly')
        ) AS s(source, amount, frequency) ON TRUE
        WHERE NOT EXISTS (
            SELECT 1 FROM income_sources is2 WHERE is2.income_id = i.id
        );
    `);

    // ── 4. Expenses ─────────────────────────────────────────────────────────
    pgm.sql(`
        INSERT INTO expenses (user_id, base_expenses)
        SELECT u.id, 50000 FROM users u
        WHERE u.email = '${DEMO_EMAIL}'
          AND NOT EXISTS (SELECT 1 FROM expenses e WHERE e.user_id = u.id);
    `);
    pgm.sql(`
        INSERT INTO expense_sources (expense_id, source, amount, frequency)
        SELECT e.id, s.source, s.amount, s.frequency::frequency_type
        FROM expenses e
        JOIN users u ON u.id = e.user_id AND u.email = '${DEMO_EMAIL}'
        JOIN (VALUES
            ('Household', 30000, 'Monthly'),
            ('Transport & fuel', 8000, 'Monthly'),
            ('Education', 12000, 'Monthly'),
            ('Subscriptions & dining', 5000, 'Monthly'),
            ('Travel', 60000, 'Annually')
        ) AS s(source, amount, frequency) ON TRUE
        WHERE NOT EXISTS (
            SELECT 1 FROM expense_sources es2 WHERE es2.expense_id = e.id
        );
    `);

    // ── 5. Assets ───────────────────────────────────────────────────────────
    pgm.sql(`
        INSERT INTO assets (user_id, bank_balance, fixed_deposits, mutual_funds,
                            bonds, provident_fund, gold_etfs, land_property,
                            vehicles, gold_physical)
        SELECT u.id, 400000, 500000, 1350000, 200000, 900000, 150000,
               4500000, 700000, 350000
        FROM users u
        WHERE u.email = '${DEMO_EMAIL}'
          AND NOT EXISTS (SELECT 1 FROM assets a WHERE a.user_id = u.id);
    `);
    pgm.sql(`
        INSERT INTO other_assets (asset_id, name, amount)
        SELECT a.id, s.name, s.amount
        FROM assets a
        JOIN users u ON u.id = a.user_id AND u.email = '${DEMO_EMAIL}'
        JOIN (VALUES
            ('Crypto portfolio', 100000)
        ) AS s(name, amount) ON TRUE
        WHERE NOT EXISTS (
            SELECT 1 FROM other_assets oa WHERE oa.asset_id = a.id
        );
    `);

    // ── 6. Liabilities ──────────────────────────────────────────────────────
    pgm.sql(`
        INSERT INTO liabilities (user_id, home_loan, personal_loan, car_loan,
                                 credit_card_loan, business_loan,
                                 other_liabilities)
        SELECT u.id, 2200000, 150000, 350000, 40000, 0, 0
        FROM users u
        WHERE u.email = '${DEMO_EMAIL}'
          AND NOT EXISTS (SELECT 1 FROM liabilities l WHERE l.user_id = u.id);
    `);

    // ── 7. Safety net ───────────────────────────────────────────────────────
    pgm.sql(`
        INSERT INTO safety_nets (user_id, emergency_fund, life_insurance,
                                 health_insurance, general_insurance)
        SELECT u.id, 400000, 10000000, 1000000, 200000
        FROM users u
        WHERE u.email = '${DEMO_EMAIL}'
          AND NOT EXISTS (SELECT 1 FROM safety_nets sn WHERE sn.user_id = u.id);
    `);
    pgm.sql(`
        INSERT INTO safety_net_dependents (safety_net_id, name, age, income)
        SELECT sn.id, s.name, s.age, s.income
        FROM safety_nets sn
        JOIN users u ON u.id = sn.user_id AND u.email = '${DEMO_EMAIL}'
        JOIN (VALUES
            ('Spouse', 34, 0),
            ('Daughter', 6, 0)
        ) AS s(name, age, income) ON TRUE
        WHERE NOT EXISTS (
            SELECT 1 FROM safety_net_dependents snd WHERE snd.safety_net_id = sn.id
        );
    `);

    // ── 8. Portfolio (holding metadata + holdings + SIP history) ───────────
    // MF ISINs are demo placeholders; equity ISINs are real NSE ISINs.
    pgm.sql(`
        INSERT INTO holding_metadata (isin, name, type, ticker, current_nav)
        VALUES
            ('INE002A01018', 'Reliance Industries', 'EQUITY', 'RELIANCE', NULL),
            ('INE467I01001', 'Tata Consultancy Services', 'EQUITY', 'TCS', NULL),
            ('INE009A01021', 'Infosys', 'EQUITY', 'INFY', NULL),
            ('INE154A01025', 'ITC', 'EQUITY', 'ITC', NULL),
            ('INF109K01DEM', 'HDFC Flexi Cap Fund', 'MUTUAL_FUND', 'HDFC_FLEXI', 130),
            ('INF456B0DEM1', 'Parag Parikh Flexi Cap Fund', 'MUTUAL_FUND', 'PPFAS', 68)
        ON CONFLICT (isin) DO NOTHING;
    `);

    pgm.sql(`
        INSERT INTO user_portfolios (user_id, portfolio_alias, source)
        SELECT u.id, 'Main Portfolio', 'MANUAL'
        FROM users u
        WHERE u.email = '${DEMO_EMAIL}'
          AND NOT EXISTS (SELECT 1 FROM user_portfolios up WHERE up.user_id = u.id);
    `);

    pgm.sql(`
        INSERT INTO portfolio_holdings (portfolio_id, isin, quantity,
                                        average_price, last_valuation)
        SELECT up.id, h.isin, h.quantity, h.average_price, h.last_valuation
        FROM user_portfolios up
        JOIN users u ON u.id = up.user_id AND u.email = '${DEMO_EMAIL}'
        JOIN (VALUES
            ('INE002A01018', 120,  2450, 316800),
            ('INE467I01001', 60,   3300, 207000),
            ('INE009A01021', 80,   1520, 140000),
            ('INE154A01025', 200,  395,  97000),
            ('INF109K01DEM', 1500, 78.4, 195000),
            ('INF456B0DEM1', 900, 55.6, 61200)
        ) AS h(isin, quantity, average_price, last_valuation) ON TRUE
        WHERE NOT EXISTS (
            SELECT 1 FROM portfolio_holdings ph WHERE ph.portfolio_id = up.id
        );
    `);

    // Six months of SIP history so gap-analysis "investment %" is non-zero.
    pgm.sql(`
        INSERT INTO portfolio_transactions (portfolio_id, isin,
                                            transaction_date, transaction_type,
                                            units, amount, nav, folio)
        SELECT up.id, t.isin,
               (CURRENT_DATE - (t.months_ago || ' months')::interval)::date,
               'SIP', t.units, t.amount, t.nav, 'DEMO-1'
        FROM user_portfolios up
        JOIN users u ON u.id = up.user_id AND u.email = '${DEMO_EMAIL}'
        JOIN (VALUES
            ('INF109K01DEM', 6, 76.9, 10000, 130),
            ('INF109K01DEM', 5, 77.2, 10000, 130),
            ('INF109K01DEM', 4, 78.1, 10000, 130),
            ('INF109K01DEM', 3, 79.0, 10000, 130),
            ('INF456B0DEM1', 2, 147.1, 10000, 68),
            ('INF456B0DEM1', 1, 146.8, 10000, 68)
        ) AS t(isin, months_ago, units, amount, nav) ON TRUE
        WHERE NOT EXISTS (
            SELECT 1 FROM portfolio_transactions pt WHERE pt.portfolio_id = up.id
        );
    `);
};

exports.down = (pgm) => {
    // Remove the demo dataset (users cascade removes everything user-owned).
    pgm.sql(`DELETE FROM users WHERE email = '${DEMO_EMAIL}';`);
};
