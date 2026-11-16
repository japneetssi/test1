const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://master_admin:5T$L8!mN2@ep-silent-smoke-a51k1u22-pooler.us-east-2.aws.neon.tech/wealthmax_prod?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'iifl_instruments'`);
    console.log(res.rows.map(r => r.column_name));
  } catch (e) {
    console.log(e);
  } finally {
    pool.end();
  }
}
run();
