import db from './src/config/database';

async function runStaticMigration() {
    try {
        console.log("Running static migration to add advisor management fields...");
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'active',
            ADD COLUMN IF NOT EXISTS invitation_token TEXT;
        `);
        console.log("Columns added successfully.");
        
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users (invitation_token);
        `);
        console.log("Index created successfully.");
        
        process.exit(0);
    } catch (error) {
        console.error("Migration Error:", error);
        process.exit(1);
    }
}

runStaticMigration();
