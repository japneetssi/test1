import db from '../config/database';

async function alterTable() {
    try {
        await db.query(`ALTER TABLE profiles ALTER COLUMN pan_number TYPE VARCHAR(255);`);
        await db.query(`ALTER TABLE profiles ALTER COLUMN employment_type TYPE VARCHAR(255);`);
        console.log("Altered successfully");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
alterTable();
