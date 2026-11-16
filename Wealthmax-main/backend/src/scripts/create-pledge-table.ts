import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function runSQL() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS pledge_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        amount numeric(15,2) DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT current_timestamp,
        updated_at timestamptz NOT NULL DEFAULT current_timestamp
      );
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pledge_user ON pledge_requests(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pledge_status ON pledge_requests(status);`);

    console.log('pledge_requests table created or verified.');
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runSQL();
