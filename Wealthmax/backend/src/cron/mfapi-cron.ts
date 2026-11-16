import cron from 'node-cron';
import { syncAllSchemesList, hydrateSchemeData } from '../services/mfapi.service';
import db from '../config/database';
import logger from '../config/logger';

// ---------------------------------------------------------------------------
// MFAPI.in Cron Jobs
// ---------------------------------------------------------------------------

/**
 * Weekly Meta Sync
 * Runs every Sunday at 2 AM
 * Fetches the base list of all mutual funds to discover new ones.
 */
cron.schedule('0 2 * * 0', async () => {
    logger.info('[CRON] Starting weekly MFAPI full meta sync');
    try {
        await syncAllSchemesList();
    } catch (err) {
        logger.error('[CRON] Weekly sync failed', err);
    }
});

/**
 * Daily Active NAV Sync
 * Runs every Mon-Fri at 8 PM (after market close and NAV updates)
 * Hydrates data (Latest NAV + Meta) for the top/active schemes.
 */
cron.schedule('0 20 * * 1-5', async () => {
    logger.info('[CRON] Starting daily MFAPI active NAV sync');
    try {
        // Fetch up to 5,000 active schemes that we care about tracking daily.
        // In a real scenario, this could be filtered by schemes users hold in portfolios.
        const res = await db.query(`
            SELECT scheme_code FROM mf_schemes 
            ORDER BY latest_nav_date DESC NULLS LAST
            LIMIT 5000
        `);
        const schemes = res.rows;

        logger.info(`[CRON] Found ${schemes.length} active schemes to hydrate`);

        // Process sequentially to avoid hammering the API
        for (const s of schemes) {
            await hydrateSchemeData(s.scheme_code);
            // Wait 200ms between calls to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        logger.info('[CRON] Daily active NAV sync complete');
    } catch (err) {
        logger.error('[CRON] Daily active NAV sync failed', err);
    }
});

logger.info('[CRON] MFAPI scheduled jobs initialized');
