const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/wealthmax'
  });
  try {
      await client.connect();
      const res = await client.query("SELECT * FROM iifl_instruments WHERE trading_symbol LIKE '%POWERINDIA%'");
      console.log(res.rows);
  } catch (err) {
      console.error(err);
  } finally {
      await client.end();
  }
}
run();
