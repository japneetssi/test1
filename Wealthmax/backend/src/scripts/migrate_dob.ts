import db from '../config/database';

async function runMigration() {
    try {
        console.log('Adding dob column to profiles table...');

        // Add dob to profiles table
        await db.query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob DATE;`);

        console.log('Migration successful');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
