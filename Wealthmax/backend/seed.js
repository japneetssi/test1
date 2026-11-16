const { faker } = require('@faker-js/faker');
const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase')
        ? { rejectUnauthorized: false }
        : false,
});

async function truncateTables() {
    console.log('🧹 Cleaning existing data (TRUNCATE)...');
    await pool.query('TRUNCATE TABLE portfolio_holdings CASCADE');
    await pool.query('TRUNCATE TABLE user_portfolios CASCADE');
    await pool.query('TRUNCATE TABLE profiles CASCADE');
    await pool.query('TRUNCATE TABLE users CASCADE');
    await pool.query('TRUNCATE TABLE partner_agencies CASCADE');
    console.log('   ✓ Data tables truncated\n');
}

async function seedPartnerAgencies() {
    console.log('1️⃣  Seeding 2 Partner Agencies...');
    const partnerIds = [];
    const partners = [
        { name: 'Apex Financial Services', admin_email: 'admin@apexfinancial.in' },
        { name: 'Zenith Wealth Management', admin_email: 'admin@zenithwealth.in' },
    ];

    for (const partner of partners) {
        const result = await pool.query(
            `INSERT INTO partner_agencies (name, admin_email, total_clients, subscription_tier, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [partner.name, partner.admin_email, 0, 'Business Pro', 'Active']
        );
        partnerIds.push(result.rows[0].id);
        console.log(`   ✓ Created: ${partner.name}`);
    }
    console.log('');
    return partnerIds;
}

async function seedAdvisors(partnerIds) {
    console.log('2️⃣  Seeding 5 Advisors...');
    const advisorIds = [];
    const advisorPassword = 'Advisor@123';

    for (let i = 1; i <= 5; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = `advisor${i}@wealthmax.in`;
        const mobile = '+91' + faker.string.numeric(10);
        const passwordHash = await bcrypt.hash(advisorPassword, 10);
        const randomPartnerId = partnerIds[Math.floor(Math.random() * partnerIds.length)];

        const result = await pool.query(
            `INSERT INTO users (email, mobile, full_name, role, password_hash, is_email_verified, is_mobile_verified, partner_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [email, mobile, `${firstName} ${lastName}`, 'advisor', passwordHash, true, true, randomPartnerId]
        );
        advisorIds.push(result.rows[0].id);
        console.log(`   ✓ Created Advisor ${i}: ${email}`);

        const healthScore = faker.number.int({ min: 50, max: 90 });
        const grossIncome = faker.number.int({ min: 1000000, max: 5000000 });
        
        await pool.query(
            `INSERT INTO profiles (user_id, health_score, gross_income, fixed_expenses, liabilities_emi, existing_assets, emergency_fund_amount, insurance_cover, total_liabilities, dependents)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [result.rows[0].id, healthScore, grossIncome, faker.number.int({ min: 30000, max: 150000 }), 0, faker.number.int({ min: 500000, max: 5000000 }), faker.number.int({ min: 100000, max: 1000000 }), faker.number.int({ min: 2000000, max: 10000000 }), 0, 0]
        );
    }
    console.log('');
    return advisorIds;
}

async function seedClients(advisorIds) {
    console.log('3️⃣  Seeding 50 Clients...');
    const clientIds = [];

    for (let i = 1; i <= 50; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName });
        const mobile = '+91' + faker.string.numeric(10);
        const healthScore = faker.number.int({ min: 0, max: 100 });
        const randomAdvisorId = advisorIds[Math.floor(Math.random() * advisorIds.length)];

        const userResult = await pool.query(
            `INSERT INTO users (email, mobile, full_name, role, advisor_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [email, mobile, `${firstName} ${lastName}`, 'user', randomAdvisorId]
        );
        const userId = userResult.rows[0].id;

        const grossIncome = faker.number.int({ min: 500000, max: 5000000 });
        const fixedExpenses = faker.number.int({ min: 20000, max: 100000 });
        const liabilitiesEmi = faker.number.int({ min: 0, max: 50000 });
        const existingAssets = faker.number.int({ min: 100000, max: 5000000 });
        const emergencyFundAmount = faker.number.int({ min: 50000, max: 500000 });
        const insuranceCover = faker.number.int({ min: 1000000, max: 10000000 });
        const totalLiabilities = faker.number.int({ min: 0, max: 2000000 });

        await pool.query(
            `INSERT INTO profiles (user_id, health_score, gross_income, fixed_expenses, liabilities_emi, existing_assets, emergency_fund_amount, insurance_cover, total_liabilities, dependents)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [userId, healthScore, grossIncome, fixedExpenses, liabilitiesEmi, existingAssets, emergencyFundAmount, insuranceCover, totalLiabilities, faker.number.int({ min: 0, max: 4 })]
        );

        await pool.query(
            `INSERT INTO score_history (user_id, health_score, savings_score, debt_score, liquidity_score, diversity_score, protection_score, goals_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                userId,
                healthScore,
                faker.number.int({ min: 5, max: 20 }),
                faker.number.int({ min: 5, max: 20 }),
                faker.number.int({ min: 5, max: 15 }),
                faker.number.int({ min: 5, max: 15 }),
                faker.number.int({ min: 5, max: 15 }),
                faker.number.int({ min: 3, max: 10 })
            ]
        );

        await pool.query(
            `INSERT INTO action_items (user_id, risk_type, severity, problem_statement)
             VALUES ($1, $2, $3, $4)`,
            [
                userId,
                'Review Insurance Coverage',
                faker.helpers.arrayElement(['Critical', 'High', 'Medium']),
                'Ensure you have adequate life and health insurance coverage for your family.'
            ]
        );

        clientIds.push(userId);
        if (i % 10 === 0) {
            console.log(`   ✓ Created ${i} clients...`);
        }
    }
    console.log(`   ✓ Created 50 clients total\n`);
    return clientIds;
}

async function seedHoldingMetadata() {
    console.log('4️⃣  Seeding Holding Metadata...');
    const isins = ['INF123456789', 'INF234567890', 'INF345678901'];
    
    for (const isin of isins) {
        await pool.query(
            `INSERT INTO holding_metadata (isin, name, type, current_nav, nav_date, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (isin) DO NOTHING`,
            [isin, `Mutual Fund ${isin.slice(-3)}`, 'MUTUAL_FUND', 100.00, new Date(), 'Seed Fund']
        );
    }
    console.log('   ✓ Holding metadata seeded\n');
}

async function seedPortfolioMetrics(clientIds) {
    console.log('5️⃣  Seeding Portfolio Metrics for 50 Clients...');

    const minAssets = 500000;  // ₹5 Lakhs
    const maxAssets = 50000000; // ₹5 Crores

    for (let i = 0; i < clientIds.length; i++) {
        const userId = clientIds[i];
        const totalAssets = faker.number.float({
            min: minAssets,
            max: maxAssets,
            fractionDigits: 2,
        });

        const portfolioResult = await pool.query(
            `INSERT INTO user_portfolios (user_id, portfolio_alias, source)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [userId, 'Main Portfolio', 'MANUAL']
        );
        const portfolioId = portfolioResult.rows[0].id;

        await pool.query(
            `INSERT INTO portfolio_holdings (portfolio_id, isin, quantity, average_price, last_valuation, source)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                portfolioId,
                'INF123456789',
                faker.number.float({ min: 100, max: 5000, fractionDigits: 4 }),
                totalAssets * 0.8,
                totalAssets,
                'MANUAL'
            ]
        );

        if ((i + 1) % 10 === 0) {
            console.log(`   ✓ Seeded portfolio for ${i + 1} clients...`);
        }
    }
    console.log(`   ✓ Portfolio metrics seeded for 50 clients\n`);
}

async function main() {
    console.log('========================================');
    console.log('   QA TESTING DATABASE SEED SCRIPT');
    console.log('========================================\n');

    try {
        await truncateTables();

        const partnerIds = await seedPartnerAgencies();
        const advisorIds = await seedAdvisors(partnerIds);
        const clientIds = await seedClients(advisorIds);
        await seedHoldingMetadata();
        await seedPortfolioMetrics(clientIds);

        console.log('========================================');
        console.log('   ✅ SEEDING COMPLETE!');
        console.log('========================================\n');

        console.log('📋 QA TEAM LOGIN CREDENTIALS:');
        console.log('   (Advisors - Use these to login)\n');

        const advisorPassword = 'Advisor@123';
        const advisorEmails = [
            'advisor1@wealthmax.in',
            'advisor2@wealthmax.in',
            'advisor3@wealthmax.in',
        ];

        for (const email of advisorEmails) {
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${advisorPassword}`);
            console.log('');
        }

        console.log('========================================\n');
        console.log('📊 Summary:');
        console.log('   - 2 Partner Agencies created');
        console.log('   - 5 Advisors created (assigned to partners)');
        console.log('   - 50 Clients created (assigned to advisors)');
        console.log('   - Financial Health Scores: 0-100 (randomized)');
        console.log('   - Total Assets: ₹5 Lakhs - ₹5 Crores (randomized)');
        console.log('');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

main()
    .then(() => {
        console.log('✨ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });