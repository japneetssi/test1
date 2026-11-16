/**
 * sync-nav.ts  —  WealthMax Management Command
 *
 * Manually triggers the AMFI NAV sync engine from the terminal.
 * Equivalent to a Django management command for local testing / ad-hoc runs.
 *
 * Usage:
 *   npm run nav:sync
 *   — or —
 *   npx ts-node -r tsconfig-paths/register src/scripts/sync-nav.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env before importing anything that reads config
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { syncAmfiData } from '../services/navSync.service';
import db from '../config/database';
import logger from '../config/logger';

async function main() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║   WealthMax — AMFI NAV Sync (Manual Trigger)  ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        console.log('⏳  Fetching and syncing AMFI NAV data...\n');

        const result = await syncAmfiData();

        console.log('✅  Sync complete!\n');
        console.log('┌─────────────────────────────────┐');
        console.log(`│  Records parsed   : ${String(result.parsed).padEnd(11)}│`);
        console.log(`│  Records upserted : ${String(result.upserted).padEnd(11)}│`);
        console.log(`│  Records skipped  : ${String(result.skipped).padEnd(11)}│`);
        console.log(`│  Duration         : ${String(result.durationMs + 'ms').padEnd(11)}│`);
        console.log('└─────────────────────────────────┘\n');

        process.exit(0);
    } catch (err) {
        const message = (err as Error).message || String(err);
        console.error(`\n❌  Sync failed: ${message}`);
        logger.error('Manual NAV sync failed', { error: message });
        process.exit(1);
    } finally {
        // Close the DB pool so node exits cleanly
        await db.close();
    }
}

main();
