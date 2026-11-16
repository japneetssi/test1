import db from './src/config/database';
async function run() {
    const res = await db.query("SELECT * FROM iifl_instruments WHERE trading_symbol LIKE '%POWERINDIA%'");
    console.log(res.rows);
}
run();
