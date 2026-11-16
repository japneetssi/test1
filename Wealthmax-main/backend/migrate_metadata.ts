import db from './src/config/database';

async function migrate() {
    try {
        console.log('Migrating existing metadata...');

        // Get Nifty 50 ID
        const res = await db.query("SELECT id FROM market_indices WHERE name = 'Nifty 50'");
        const niftyId = res.rows[0]?.id;

        if (!niftyId) throw new Error('Nifty 50 not found in market_indices');

        // Update EQUITIES
        await db.query(`
            UPDATE holding_metadata 
            SET category = 'Equity', benchmark_index_id = $1 
            WHERE type = 'EQUITY' AND (category IS NULL OR category = 'Uncategorized')
        `, [niftyId]);

        // Update MUTUAL_FUNDS
        await db.query(`
            UPDATE holding_metadata 
            SET category = 'Mutual Fund', benchmark_index_id = $1 
            WHERE type = 'MUTUAL_FUND' AND (category IS NULL OR category = 'Uncategorized')
        `, [niftyId]);

        console.log('Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
