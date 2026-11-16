import db from './src/config/database';
import logger from './src/config/logger';

async function seed() {
    try {
        console.log('Seeding market indices...');

        // 1. Create Indices
        const indices = [
            { name: 'Nifty 50', symbol: '^NSEI', type: 'Equity', description: 'NSE Nifty 50 Index' },
            { name: 'S&P BSE Sensex', symbol: '^BSESN', type: 'Equity', description: 'BSE Sensex Index' },
            { name: 'Nifty Midcap 100', symbol: 'NIFTY_MID_100.NS', type: 'Equity', description: 'Midcap Index' },
            { name: 'MCX Gold', symbol: 'GOLD', type: 'Commodity', description: 'Gold Prices' },
            { name: 'CRISIL Composite Bond Fund Index', symbol: 'DEBT_BENCH', type: 'Debt', description: 'Debt Benchmark' }
        ];

        for (const idx of indices) {
            await db.query(
                `INSERT INTO market_indices (name, symbol, type, description) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (name) DO NOTHING`,
                [idx.name, idx.symbol, idx.type, idx.description]
            );
        }

        // 2. Fetch IDs
        const res = await db.query('SELECT id, name FROM market_indices');
        const indexMap = new Map();
        res.rows.forEach(r => indexMap.set(r.name, r.id));

        // 3. Seed Mock History (Last 12 months)
        console.log('Seeding historical data...');
        const today = new Date();

        for (const [name, id] of indexMap.entries()) {
            let baseValue = 100; // Normalized start
            if (name === 'Nifty 50') baseValue = 18000;
            if (name === 'MCX Gold') baseValue = 50000;

            for (let i = 12; i >= 0; i--) {
                const date = new Date(today);
                date.setMonth(date.getMonth() - i);
                date.setDate(1);

                // Add some random walk
                const randomChange = (Math.random() - 0.45) * 0.02; // Roughly 5-10% annual growth
                baseValue = baseValue * (1 + randomChange);

                await db.query(
                    `INSERT INTO market_index_history (index_id, date, value)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (index_id, date) DO UPDATE SET value = EXCLUDED.value`,
                    [id, date.toISOString().slice(0, 10), baseValue]
                );
            }
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
