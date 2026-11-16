import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('Tables:', res.rows.map(r => r.tablename));
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
