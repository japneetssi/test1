const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'iifl_instruments'`);
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}
run();
