import app from './app';
import config from './config/env';
import database from './config/database';
import logger from './config/logger';
import cron from 'node-cron';
import { syncAmfiData } from './services/navSync.service';
import { syncAllSchemesList } from './services/mfapi.service';
import { syncEquityContracts } from './services/iiflapi.service';

const PORT = config.get('PORT');

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await database.testConnection();
        if (!dbConnected) {
            logger.warn('Database connection failed, but server will start anyway');
        } else {
            // Auto-migrate missing tables
            database.query(`
                CREATE TABLE IF NOT EXISTS iifl_instruments (
                    id SERIAL PRIMARY KEY,
                    instrument_id varchar(50) NOT NULL UNIQUE,
                    exchange varchar(20),
                    formatted_name varchar(255),
                    instrument_type varchar(50),
                    underlying_name varchar(255),
                    underlying_symbol varchar(255),
                    trading_symbol varchar(255),
                    series varchar(20),
                    lot_size integer,
                    tick_size decimal,
                    option_type varchar(10),
                    expiry varchar(50),
                    strike_price varchar(50),
                    qty_limit bigint,
                    updated_at timestamp NOT NULL DEFAULT current_timestamp
                );
                CREATE INDEX IF NOT EXISTS idx_iifl_instruments_exchange ON iifl_instruments (exchange);
                CREATE INDEX IF NOT EXISTS idx_iifl_instruments_trading_symbol ON iifl_instruments (trading_symbol);
            `).then(async () => {
                logger.info('Database tables verified/created successfully');
                
                // Trigger initial background sync for IIFL if table is empty
                const countRes = await database.query('SELECT COUNT(*) FROM iifl_instruments');
                if (parseInt(countRes.rows[0].count, 10) === 0) {
                    logger.info('[IIFLSync] Table is empty. Triggering initial background sync...');
                    syncEquityContracts().catch(err => logger.error('[IIFLSync] Initial sync failed', err));
                }
            }).catch(e => logger.error('Failed to auto-migrate database', e));
        }

        // Start server
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${config.get('NODE_ENV')} mode`);
            logger.info(`Health check available at http://localhost:${PORT}/api/v1/health`);

            // ──────────────────────────────────────────────────────────────
            // Celery-Beat equivalent: Daily AMFI NAV sync at 11:00 PM IST
            //
            // IST is UTC+5:30, so 23:00 IST = 17:30 UTC.
            // Cron expression: '30 17 * * *'  →  every day at 17:30 UTC
            //
            // To test locally, temporarily change to '* * * * *' (every minute).
            // ──────────────────────────────────────────────────────────────
            cron.schedule('30 17 * * *', async () => {
                logger.info('[NavSync] Scheduled job triggered — starting daily AMFI NAV sync');
                try {
                    const result = await syncAmfiData();
                    logger.info('[NavSync] Scheduled sync complete', {
                        upserted: result.upserted,
                        skipped: result.skipped,
                        durationMs: result.durationMs,
                    });
                } catch (err) {
                    // Catch all errors so a sync failure never crashes the server
                    logger.error('[NavSync] Scheduled sync failed', {
                        error: (err as Error).message,
                    });
                }
            }, {
                timezone: 'UTC', // cron expression is already in UTC
            });

            logger.info('[NavSync] Daily NAV sync scheduled at 23:00 IST (17:30 UTC)');

            // ──────────────────────────────────────────────────────────────
            // Daily FinAPI Master Scheme List sync at 2:00 AM IST
            //
            // IST is UTC+5:30, so 02:00 IST = 20:30 UTC (previous day).
            // Cron expression: '30 20 * * *'  →  every day at 20:30 UTC
            // ──────────────────────────────────────────────────────────────
            cron.schedule('30 20 * * *', async () => {
                logger.info('[MFApiSync] Scheduled job triggered — starting daily FinAPI scheme list sync');
                try {
                    await syncAllSchemesList();
                } catch (err) {
                    logger.error('[MFApiSync] Scheduled FinAPI sync failed', {
                        error: (err as Error).message,
                    });
                }
            }, {
                timezone: 'UTC',
            });

            logger.info('[MFApiSync] Daily FinAPI Master List sync scheduled at 02:00 IST (20:30 UTC)');

            // ──────────────────────────────────────────────────────────────
            // Daily Active NAV & Details Sync at 3:00 AM IST
            // Hydrates full details (AUM, expense ratio, managers) for top funds
            // ──────────────────────────────────────────────────────────────
            cron.schedule('30 21 * * *', async () => {
                logger.info('[MFApiSync] Starting daily active NAV and details sync');
                try {
                    const { hydrateSchemeData } = await import('./services/mfapi.service');
                    // Fetch up to 5,000 active schemes to update their details
                    const res = await database.query(`
                        SELECT scheme_code FROM mf_schemes 
                        ORDER BY latest_nav_date DESC NULLS LAST
                        LIMIT 5000
                    `);
                    logger.info(`[MFApiSync] Found ${res.rows.length} active schemes to hydrate`);
                    for (const s of res.rows) {
                        try {
                            await hydrateSchemeData(s.scheme_code, true);
                        } catch (err) {
                            logger.error(`[MFApiSync] Failed to hydrate ${s.scheme_code}`, err);
                        }
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    logger.info('[MFApiSync] Daily active NAV and details sync complete');
                } catch (err) {
                    logger.error('[MFApiSync] Daily active NAV sync failed', err);
                }
            }, { timezone: 'UTC' });
            logger.info('[MFApiSync] Daily Active Details sync scheduled at 03:00 IST (21:30 UTC)');

            // ──────────────────────────────────────────────────────────────
            // Daily IIFL Equity Contracts Sync at 4:00 AM IST
            //
            // IST is UTC+5:30, so 04:00 IST = 22:30 UTC (previous day).
            // Cron expression: '30 22 * * *'  →  every day at 22:30 UTC
            // ──────────────────────────────────────────────────────────────
            cron.schedule('30 22 * * *', async () => {
                logger.info('[IIFLSync] Scheduled job triggered — starting daily IIFL Equity Contracts sync');
                try {
                    await syncEquityContracts();
                } catch (err) {
                    logger.error('[IIFLSync] Scheduled IIFL sync failed', {
                        error: (err as Error).message,
                    });
                }
            }, {
                timezone: 'UTC',
            });

            logger.info('[IIFLSync] Daily IIFL Equity Contracts sync scheduled at 04:00 IST (22:30 UTC)');

        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await database.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await database.close();
    process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();

