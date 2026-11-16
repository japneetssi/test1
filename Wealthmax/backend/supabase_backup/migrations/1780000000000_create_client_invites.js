import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wealthmax'
});

export async function up() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS client_invites (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                partner_id UUID REFERENCES partner_agencies(id) ON DELETE SET NULL,
                client_name VARCHAR(255),
                client_email VARCHAR(255) NOT NULL,
                invite_token VARCHAR(255) UNIQUE NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Expired')),
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_client_invites_token ON client_invites(invite_token);
        `);
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_client_invites_advisor ON client_invites(advisor_id);
        `);
        
        console.log('Migration completed: client_invites table created');
    } finally {
        client.release();
    }
}

export async function down() {
    const client = await pool.connect();
    try {
        await client.query('DROP TABLE IF EXISTS client_invites CASCADE');
        console.log('Migration rolled back: client_invites table dropped');
    } finally {
        client.release();
    }
}
