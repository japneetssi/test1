const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seed() {
  try {
    const partnerRes = await pool.query("SELECT id FROM partner_agencies WHERE name = 'Next Curve Financials' LIMIT 1");
    if (partnerRes.rows.length === 0) {
      console.error("Next Curve Financials partner not found");
      return;
    }
    const partnerId = partnerRes.rows[0].id;

    const email = 'demo_partner@nextcurve.in';
    const mobile = '9988776654';
    const fullName = 'Next Curve Admin';
    
    // Check if user exists
    const userRes = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userRes.rows.length > 0) {
      await pool.query("UPDATE users SET role = 'partner', partner_id = $1 WHERE email = $2", [partnerId, email]);
      console.log(`User ${email} updated to partner role.`);
    } else {
      await pool.query(
        "INSERT INTO users (email, mobile, full_name, role, partner_id, kyc_status) VALUES ($1, $2, $3, 'partner', $4, 'Verified')",
        [email, mobile, fullName, partnerId]
      );
      console.log(`Partner user ${email} created.`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

seed();
