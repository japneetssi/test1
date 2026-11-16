import db from '../config/database';
import { EncryptionService } from '../services/encryption.service';
import { randomUUID } from 'crypto';

async function seedData() {
    try {
        console.log("Clearing existing mock data...");
        await db.query(`
            DELETE FROM users WHERE email LIKE '%@wealthmax.mock';
        `);

        console.log("Seeding mock users...");

        const users = [
            {
                id: randomUUID(),
                full_name: 'Amit Patel',
                email: 'amit@wealthmax.mock',
                mobile: '9876543210',
                pan_encrypted: EncryptionService.encrypt('ABCDE1234F'),
                kyc_status: 'Verified',
                assigned_persona: 'Strategic Wealth Builder',
                risk_class: 'Aggressive',
                dob: '1985-06-15',
                role: 'user',
                
                // Financial Profile
                gross_income: 3000000,
                fixed_expenses: 80000,
                liabilities_emi: 45000,
                existing_assets: 5000000,
                emergency_fund_amount: 500000,
                insurance_cover: 20000000,
                dependents: 2,

                // Health Score
                total_score: 85,
                savings_score: 90,
                debt_score: 80,
                liquidity_score: 85,
                diversity_score: 80,
                goals_score: 90,
                literacy_score: 85
            },
            {
                id: randomUUID(),
                full_name: 'Priya Sharma',
                email: 'priya@wealthmax.mock',
                mobile: '9876543211',
                pan_encrypted: EncryptionService.encrypt('BCDEF2345G'),
                kyc_status: 'Verified',
                assigned_persona: 'Early Career Builder',
                risk_class: 'Moderate',
                dob: '1995-11-20',
                role: 'user',

                // Financial Profile
                gross_income: 1200000,
                fixed_expenses: 40000,
                liabilities_emi: 15000,
                existing_assets: 800000,
                emergency_fund_amount: 100000,
                insurance_cover: 5000000,
                dependents: 0,

                // Health Score
                total_score: 65,
                savings_score: 70,
                debt_score: 85,
                liquidity_score: 60,
                diversity_score: 50,
                goals_score: 60,
                literacy_score: 70
            },
            {
                id: randomUUID(),
                full_name: 'Rahul Desai',
                email: 'rahul@wealthmax.mock',
                mobile: '9876543212',
                pan_encrypted: EncryptionService.encrypt('CDEFG3456H'),
                kyc_status: 'Verified',
                assigned_persona: 'Pre-Retirement Planner',
                risk_class: 'Conservative',
                dob: '1970-03-10',
                role: 'user',

                // Financial Profile
                gross_income: 4500000,
                fixed_expenses: 120000,
                liabilities_emi: 0,
                existing_assets: 25000000,
                emergency_fund_amount: 1500000,
                insurance_cover: 10000000,
                dependents: 1,

                // Health Score
                total_score: 92,
                savings_score: 95,
                debt_score: 100,
                liquidity_score: 90,
                diversity_score: 95,
                goals_score: 85,
                literacy_score: 90
            }
        ];

        for (const u of users) {
            // 1. Insert User
            await db.query(`
                INSERT INTO users (id, full_name, email, mobile, pan_encrypted, kyc_status, assigned_persona, risk_class, dob, role)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [u.id, u.full_name, u.email, u.mobile, u.pan_encrypted, u.kyc_status, u.assigned_persona, u.risk_class, u.dob, u.role]);

            // 2. Insert Financial Profile
            await db.query(`
                INSERT INTO financial_profiles (user_id, dependents, gross_income, fixed_expenses, liabilities_emi, existing_assets, emergency_fund_amount, insurance_cover)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [u.id, u.dependents, u.gross_income, u.fixed_expenses, u.liabilities_emi, u.existing_assets, u.emergency_fund_amount, u.insurance_cover]);

            // 3. Insert Health Score
            await db.query(`
                INSERT INTO health_scores (user_id, total_score, savings_score, debt_score, liquidity_score, diversity_score, goals_score, literacy_score)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [u.id, u.total_score, u.savings_score, u.debt_score, u.liquidity_score, u.diversity_score, u.goals_score, u.literacy_score]);

            // 4. Insert Action Alerts (mock a couple for each)
            if (u.risk_class === 'Conservative') {
                 await db.query(`
                    INSERT INTO action_alerts (user_id, alert_type, severity, problem_statement, action_text, linked_tool)
                    VALUES ($1, 'Low Yield Assets', 'MEDIUM', 'Some of your fixed deposits are yielding below inflation.', 'Explore our curated Debt Mutual Funds', 'Marketplace')
                `, [u.id]);
            } else if (u.risk_class === 'Aggressive') {
                await db.query(`
                    INSERT INTO action_alerts (user_id, alert_type, severity, problem_statement, action_text, linked_tool)
                    VALUES ($1, 'High EMI Burden', 'HIGH', 'Your EMI exceeds 40% of your income.', 'Review debt restructuring plan', 'ActionPlan')
                `, [u.id]);
            } else {
                 await db.query(`
                    INSERT INTO action_alerts (user_id, alert_type, severity, problem_statement, action_text, linked_tool)
                    VALUES ($1, 'Missing Emergency Fund', 'CRITICAL', 'You have less than 3 months of emergency buffer.', 'Start a Liquid Fund SIP', 'Marketplace')
                `, [u.id]);
            }

            // 5. Margin Ledgers
            await db.query(`
                INSERT INTO margin_ledgers (user_id, is_trial_mode, approved_ltv_cap, total_pledge_value, utilized_margin, margin_call_status)
                VALUES ($1, true, 80.00, 0, 0, 'Healthy')
            `, [u.id]);
        }

        console.log("Mock data inserted successfully.");
        console.log("You can log in via OTP with these mobile numbers:");
        users.forEach(u => console.log(`- ${u.full_name}: ${u.mobile} (Role: ${u.role}, Persona: ${u.assigned_persona})`));
        
        process.exit(0);

    } catch (e) {
        console.error("Mock data seeding failed:", e);
        process.exit(1);
    }
}

seedData();
