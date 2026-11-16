import db from '../config/database';
import { EncryptionService } from '../services/encryption.service';
import { randomUUID } from 'crypto';

async function seedDemoRoles() {
    try {
        console.log("Seeding Demo Roles (Super Admin, Partner, Advisor)...");

        // 1. Super Admin
        const superAdminEmail = 'superadmin@wealthmax.com';
        const existingAdmin = await db.query('SELECT id FROM users WHERE email = $1', [superAdminEmail]);
        if (existingAdmin.rows.length === 0) {
            await db.query(`
                INSERT INTO users (id, full_name, email, mobile, role, kyc_status)
                VALUES ($1, $2, $3, $4, 'admin', 'Verified')
            `, [randomUUID(), 'WealthMax Master', superAdminEmail, '9999999999']);
            console.log("Super Admin seeded.");
        } else {
            console.log("Super Admin already exists.");
        }

        // 2. Partner Agency
        let partnerId;
        const partnerRes = await db.query("SELECT id FROM partner_agencies WHERE name = 'Next Curve Financials' LIMIT 1");
        if (partnerRes.rows.length > 0) {
            partnerId = partnerRes.rows[0].id;
            console.log("Using existing partner: Next Curve Financials");
        } else {
            partnerId = randomUUID();
            await db.query(`
                INSERT INTO partner_agencies (id, name, admin_email, total_clients, subscription_tier, status)
                VALUES ($1, 'Next Curve Financials', 'rajesh@nextcurve.in', 142, 'Business Pro', 'Active')
            `, [partnerId]);
            console.log("Partner Agency seeded.");
        }

        // 3. Partner User
        const partnerEmail = 'partner@nextcurve.in';
        const existingPartnerUser = await db.query('SELECT id FROM users WHERE email = $1', [partnerEmail]);
        if (existingPartnerUser.rows.length === 0) {
            await db.query(`
                INSERT INTO users (id, full_name, email, mobile, role, partner_id, kyc_status)
                VALUES ($1, $2, $3, $4, 'partner', $5, 'Verified')
            `, [randomUUID(), 'Rajesh Kumar (Partner)', partnerEmail, '8888888888', partnerId]);
            console.log("Partner User seeded.");
        } else {
            console.log("Partner User already exists.");
        }

        // 4. Advisor User
        const advisorEmail = 'advisor@nextcurve.in';
        let advisorId;
        const existingAdvisor = await db.query('SELECT id FROM users WHERE email = $1', [advisorEmail]);
        if (existingAdvisor.rows.length === 0) {
            advisorId = randomUUID();
            await db.query(`
                INSERT INTO users (id, full_name, email, mobile, role, partner_id, kyc_status)
                VALUES ($1, $2, $3, $4, 'advisor', $5, 'Verified')
            `, [advisorId, 'Suresh Advisor', advisorEmail, '7777777777', partnerId]);
            console.log("Advisor seeded.");
        } else {
            advisorId = existingAdvisor.rows[0].id;
            console.log("Advisor already exists.");
        }

        // 5. Seed Holding Metadata
        const isin = 'INE001A01036'; // Standard ISIN for mock
        const existingMetadata = await db.query('SELECT isin FROM holding_metadata WHERE isin = $1', [isin]);
        if (existingMetadata.rows.length === 0) {
            await db.query(`
                INSERT INTO holding_metadata (isin, name, type, ticker, current_nav)
                VALUES ($1, 'HDFC Top 100 Fund', 'MUTUAL_FUND', 'HDFCT100', 750.00)
            `, [isin]);
            console.log("Holding Metadata seeded.");
        }

        // 6. Mock Clients for Advisor
        const mockClients = [
            { name: 'John Doe', email: 'john@example.mock', mobile: '9000000001' },
            { name: 'Jane Smith', email: 'jane@example.mock', mobile: '9000000002' }
        ];

        for (const client of mockClients) {
            const existingClient = await db.query('SELECT id FROM users WHERE email = $1', [client.email]);
            if (existingClient.rows.length === 0) {
                const clientId = randomUUID();
                await db.query(`
                    INSERT INTO users (id, full_name, email, mobile, role, advisor_id, partner_id, kyc_status)
                    VALUES ($1, $2, $3, $4, 'user', $5, $6, 'Verified')
                `, [clientId, client.name, client.email, client.mobile, advisorId, partnerId]);
                
                // Add a sample portfolio holding for AUM managed calculation
                const portfolioId = randomUUID();
                await db.query(`INSERT INTO user_portfolios (id, user_id, portfolio_alias) VALUES ($1, $2, 'Main Portfolio')`, [portfolioId, clientId]);
                await db.query(`
                    INSERT INTO portfolio_holdings (portfolio_id, isin, quantity, average_price, last_valuation)
                    VALUES ($1, $2, 100, 500, 75000)
                `, [portfolioId, isin]);
            }
        }
        console.log("Mock Clients and Holdings seeded.");

        console.log("Seeding Success!");
        console.log("\nLogin Details for Demo:");
        console.log("Super Admin: 9999999999 / superadmin@wealthmax.com");
        console.log("Partner: 8888888888 / partner@nextcurve.in");
        console.log("Advisor: 7777777777 / advisor@nextcurve.in");
        console.log("OTP: 123456 (Mocked)");

        process.exit(0);
    } catch (e) {
        console.error("Seeding failed:", e);
        process.exit(1);
    }
}

seedDemoRoles();
