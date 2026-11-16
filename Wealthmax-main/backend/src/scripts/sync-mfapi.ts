import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { syncAllSchemesList, hydrateSchemeData } from '../services/mfapi.service';
import db from '../config/database';

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   WealthMax — MFAPI Data Sync (Manual Run)    ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        const args = process.argv.slice(2);
        
        if (args.includes('--hydrate')) {
            const schemeIdx = args.indexOf('--hydrate') + 1;
            const code = parseInt(args[schemeIdx]);
            if (isNaN(code)) {
                console.error("Please provide a valid scheme code: --hydrate 120503");
                process.exit(1);
            }
            console.log(`⏳ Hydrating scheme ${code}...`);
            await hydrateSchemeData(code);
        } else {
            console.log('⏳ Syncing base schemes list from MFAPI...');
            await syncAllSchemesList();
        }

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
