import db from '../config/database';
import logger from '../config/logger';

async function seedAdvisors() {
    try {
        // 1. Get the Partner ID for 'Next Curve Financials'
        const partnerRes = await db.query(
            "SELECT id FROM partner_agencies WHERE name = 'Next Curve Financials' LIMIT 1"
        );
        
        if (partnerRes.rows.length === 0) {
            console.error("❌ Partner 'Next Curve Financials' not found. Please run migrations first.");
            process.exit(1);
        }
        
        const partnerId = partnerRes.rows[0].id;
        console.log(`✅ Found Partner ID: ${partnerId}`);

        // 2. Data for 5 Advisors
        const advisors = [
            { name: 'Rajesh Kumar', email: 'rajesh.k@nextcurve.in', mobile: '9988776655' },
            { name: 'Anjali Sharma', email: 'anjali.s@nextcurve.in', mobile: '9988776656' },
            { name: 'Vikram Mehta', email: 'vikram.m@nextcurve.in', mobile: '9988776657' },
            { name: 'Sneha Patil', email: 'sneha.p@nextcurve.in', mobile: '9988776658' },
            { name: 'Amit Singh', email: 'amit.s@nextcurve.in', mobile: '9988776659' }
        ];

        console.log("🚀 Seeding 5 advisors...");

        for (const adv of advisors) {
            // Check if advisor already exists
            const existing = await db.query("SELECT id FROM users WHERE email = $1", [adv.email]);
            
            if (existing.rows.length > 0) {
                console.log(`⏩ Advisor ${adv.name} already exists, updating role and partner_id...`);
                await db.query(
                    "UPDATE users SET role = 'advisor', partner_id = $1 WHERE email = $2",
                    [partnerId, adv.email]
                );
            } else {
                console.log(`➕ Creating Advisor: ${adv.name}`);
                await db.query(
                    "INSERT INTO users (full_name, email, mobile, role, partner_id) VALUES ($1, $2, $3, 'advisor', $4)",
                    [adv.name, adv.email, adv.mobile, partnerId]
                );
            }
        }

        // 3. Update Platform Metrics
        await db.query(
            "UPDATE platform_metrics SET onboarded_advisors_count = onboarded_advisors_count + 5"
        );

        console.log("✨ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seedAdvisors();
