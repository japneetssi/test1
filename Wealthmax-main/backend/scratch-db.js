const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/wealthmax'
  });
  await client.connect();
  const res = await client.query("SELECT * FROM iifl_instruments WHERE trading_symbol LIKE '%3MINDIA%'");
  console.log(res.rows);
  await client.end();
}
run().catch(console.error);
