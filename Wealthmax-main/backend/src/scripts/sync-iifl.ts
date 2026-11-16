import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { syncEquityContracts } from '../services/iiflapi.service';
import db from '../config/database';

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   WealthMax — IIFL Equity Data Sync           ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        console.log('⏳ Syncing Equity Contracts from IIFL Market API...');
        await syncEquityContracts();

        console.log('\n✅ Sync complete!\n');
        process.exit(0);
    } catch (err) {
        console.error(`\n❌ Sync failed: ${(err as Error).message}`);
        process.exit(1);
    } finally {
        await db.close();
    }
}

main();
