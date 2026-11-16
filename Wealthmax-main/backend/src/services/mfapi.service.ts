import axios from 'axios';
import db from '../config/database';
import logger from '../config/logger';

const MFAPI_BASE_URL = 'https://finapi.upvaly.com/api/mf';
const BATCH_SIZE = 500; // Optimal for postgres batch inserts

export interface FinapiListResponse {
    status: string;
    data: Array<{
        schemeCode: string;
        schemeName: string;
        fundHouse?: string;
        schemeCategoryLabel?: string;
        latestNav?: number;
        latestNavDate?: string;
    }>;
}

export interface FinapiDetailResponse {
    status: string;
    data: {
        schemeCode: string;
        schemeName: string;
        fundHouse: string;
        schemeCategoryLabel: string;
        latestNav?: number;
        latestNavDate?: string;
        cagr?: {
            '1y'?: string | number;
            '3y'?: string | number;
            '5y'?: string | number;
        };
        aum?: string;
        expenseRatio?: string;
        schemeFundManagers?: string;
        exitLoadMessage?: string;
        isSIF?: string;
        riskMetrics?: {
            returns?: {
                timeframes?: Array<{
                    timeframe: string;
                    value: string;
                    categoryAverage?: string;
                    conclusion?: string;
                }>;
            };
        };
    }
}

export interface MfNavResponse {
    data: Array<{
        date: string; // "DD-MM-YYYY"
        nav: string;
    }>;
}

/**
 * Parses DD-MM-YYYY string into a valid Postgres YYYY-MM-DD string
 */
function parseDate(dateStr: string): string | null {
    if (!dateStr || !dateStr.includes('-')) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
}

/**
 * 1. Sync All Schemes Metadata (Base List)
 * Fetches the entire directory from mfapi.in and upserts into mf_schemes.
 * Note: AMC and Category will be NULL until hydrateSchemeData is called on specific schemes.
 */
export async function syncAllSchemesList() {
    logger.info('[MFAPI] Starting full meta sync from /mf');
    const syncLogId = await createSyncLog('FULL_META');

    try {
        const response = await axios.get<FinapiListResponse>(`${MFAPI_BASE_URL}`);
        const schemes = response.data.data || [];
        logger.info(`[MFAPI] Fetched ${schemes.length} schemes`);

        // Step 1: Pre-populate AMCs to avoid foreign key issues
        const uniqueAmcs = new Set<string>();
        schemes.forEach(s => {
            if (s.fundHouse && s.fundHouse.trim() !== '') uniqueAmcs.add(s.fundHouse.trim());
        });
        
        logger.info(`[MFAPI] Found ${uniqueAmcs.size} unique AMCs. Upserting to mf_amcs...`);
        for (const amc of Array.from(uniqueAmcs)) {
            await db.query(`INSERT INTO mf_amcs (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [amc]);
        }
        
        // Step 2: Build AMC map for fast lookup
        const amcMap = new Map<string, number>();
        const amcRes = await db.query(`SELECT id, name FROM mf_amcs`);
        amcRes.rows.forEach(r => amcMap.set(r.name, r.id));

        // Step 3: Bulk upsert schemes
        let upserted = 0;
        const validSchemes = schemes.filter(s => /^\d+$/.test(s.schemeCode));
        
        for (let i = 0; i < validSchemes.length; i += BATCH_SIZE) {
            const batch = validSchemes.slice(i, i + BATCH_SIZE);
            const values: (string | number)[] = [];
            const placeholders = batch.map((s, idx) => {
                const base = idx * 6;
                const amcId = (s.fundHouse && amcMap.has(s.fundHouse.trim())) ? amcMap.get(s.fundHouse.trim())! : null;
                const nav = s.latestNav ? Number(s.latestNav) : null;
                const navDate = s.latestNavDate ? s.latestNavDate.split('T')[0] : null;

                values.push(
                    Number(s.schemeCode), 
                    s.schemeName,
                    amcId as any,
                    s.schemeCategoryLabel || null as any,
                    nav as any,
                    navDate as any
                );
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, NOW())`;
            });

            const sql = `
                INSERT INTO mf_schemes (scheme_code, scheme_name, amc_id, scheme_category, latest_nav, latest_nav_date, updated_at)
                VALUES ${placeholders.join(', ')}
                ON CONFLICT (scheme_code) DO UPDATE SET
                    scheme_name = EXCLUDED.scheme_name,
                    amc_id = COALESCE(EXCLUDED.amc_id, mf_schemes.amc_id),
                    scheme_category = COALESCE(EXCLUDED.scheme_category, mf_schemes.scheme_category),
                    latest_nav = COALESCE(EXCLUDED.latest_nav, mf_schemes.latest_nav),
                    latest_nav_date = COALESCE(EXCLUDED.latest_nav_date, mf_schemes.latest_nav_date),
                    updated_at = EXCLUDED.updated_at
            `;

            try {
                await db.query(sql, values);
                upserted += batch.length;
            } catch (batchErr: any) {
                logger.warn(`[MFAPI] Batch failed, attempting one-by-one... Error: ${batchErr.message}`);
                for (const s of batch) {
                    try {
                        const amcId = (s.fundHouse && amcMap.has(s.fundHouse.trim())) ? amcMap.get(s.fundHouse.trim())! : null;
                        const nav = s.latestNav ? Number(s.latestNav) : null;
                        const navDate = s.latestNavDate ? s.latestNavDate.split('T')[0] : null;
                        
                        await db.query(`
                            INSERT INTO mf_schemes (scheme_code, scheme_name, amc_id, scheme_category, latest_nav, latest_nav_date, updated_at)
                            VALUES ($1, $2, $3, $4, $5, $6, NOW())
                            ON CONFLICT (scheme_code) DO UPDATE SET
                                scheme_name = EXCLUDED.scheme_name,
                                amc_id = COALESCE(EXCLUDED.amc_id, mf_schemes.amc_id),
                                scheme_category = COALESCE(EXCLUDED.scheme_category, mf_schemes.scheme_category),
                                latest_nav = COALESCE(EXCLUDED.latest_nav, mf_schemes.latest_nav),
                                latest_nav_date = COALESCE(EXCLUDED.latest_nav_date, mf_schemes.latest_nav_date),
                                updated_at = EXCLUDED.updated_at
                        `, [Number(s.schemeCode), s.schemeName, amcId as any, s.schemeCategoryLabel || null as any, nav as any, navDate as any]);
                        upserted++;
                    } catch (singleErr: any) {
                        logger.error(`[MFAPI] Failed to insert scheme ${s.schemeCode}: ${singleErr.message}`);
                    }
                }
            }
        }

        // Force re-hydration for schemes missing data that might have it now
        logger.info('[MFAPI] Resetting risk_level for schemes needing re-hydration...');
        await db.query(`
            UPDATE mf_schemes 
            SET risk_level = NULL 
            WHERE cagr_3y IS NULL 
        `);

        await updateSyncLog(syncLogId, 'SUCCESS', upserted);
        logger.info(`[MFAPI] Sync complete. Upserted ${upserted} schemes.`);
        
        // Step 4: Fire off a background hydration for a chunk of prominent schemes so UI looks great instantly
        setTimeout(async () => {
            try {
                logger.info(`[MFAPI] Starting auto-hydration for top schemes...`);
                // Get 100 schemes that have NAV but no AUM yet (sort by latest_nav DESC to get older, established funds first)
                const topRes = await db.query(`
                    SELECT scheme_code FROM mf_schemes 
                    WHERE latest_nav > 0 AND aum IS NULL 
                    ORDER BY latest_nav DESC LIMIT 100
                `);
                for (const row of topRes.rows) {
                    try {
                        await hydrateSchemeData(row.scheme_code);
                    } catch (err) {
                        logger.error(`[MFAPI] Failed to hydrate ${row.scheme_code}`, err);
                    }
                    await new Promise(r => setTimeout(r, 200)); // Sleep 200ms to avoid rate limits
                }
                logger.info(`[MFAPI] Finished auto-hydration for top schemes.`);
            } catch (err) {
                logger.error('[MFAPI] Auto-hydration failed', err);
            }
        }, 1000);

    } catch (err: any) {
        logger.error('[MFAPI] Sync failed', { error: err.message });
        await updateSyncLog(syncLogId, 'FAILED', 0, err.message);
    }
}

/**
 * 2. Hydrate Scheme Data & History
 * Fetches the complete metadata (AMC, Category) and historical NAVs for a specific scheme.
 */
export async function hydrateSchemeData(schemeCode: number, skipHistory: boolean = false) {
    logger.info(`[MFAPI] Hydrating scheme ${schemeCode}`);
    
    let finapiDataFound = false;

    try {
        const response = await axios.get<FinapiDetailResponse>(`${MFAPI_BASE_URL}/scheme-code/${schemeCode}`);
        const data = response.data.data;
        if (data) {

        // 1. Upsert AMC
        let amcId: number | null = null;
        if (data.fundHouse) {
            const amcSql = `
                INSERT INTO mf_amcs (name) VALUES ($1)
                ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
                RETURNING id
            `;
            const amcRes = await db.query(amcSql, [data.fundHouse]);
            if (amcRes.rows.length > 0) {
                amcId = amcRes.rows[0].id;
            } else {
                const fetchRes = await db.query('SELECT id FROM mf_amcs WHERE name = $1', [data.fundHouse]);
                if (fetchRes.rows.length > 0) amcId = fetchRes.rows[0].id;
            }
        }

        // 2. Parse Data
        const latestNav = data.latestNav ? Number(data.latestNav) : null;
        const latestDate = data.latestNavDate ? data.latestNavDate.split('T')[0] : null; // Ensure YYYY-MM-DD
        
        // Use provided values or fallback
        const aumStr = data.aum ? String(data.aum).replace(/,/g, '') : null;
        const aum = aumStr ? parseFloat(aumStr) : null;
        const expenseRatio = data.expenseRatio ? parseFloat(data.expenseRatio) : null;
        const fundManager = data.schemeFundManagers ? (data.schemeFundManagers.length > 250 ? data.schemeFundManagers.substring(0, 250) + '...' : data.schemeFundManagers) : null;
        const exitLoad = data.exitLoadMessage ? (data.exitLoadMessage.length > 250 ? data.exitLoadMessage.substring(0, 250) + '...' : data.exitLoadMessage) : null;
        
        // Deterministic Risk/Rating for now until we have it from finapi
        const seed = schemeCode;
        const riskLevel = seed % 3 === 0 ? 'Aggressive' : seed % 2 === 0 ? 'Moderate' : 'Conservative';
        const rating = 3 + (seed % 3);
        const minSip = 500; // Default

        let cagr1y = data.cagr?.['1y'] ? parseFloat(data.cagr['1y'].toString()) : null;
        let cagr3y = data.cagr?.['3y'] ? parseFloat(data.cagr['3y'].toString()) : null;
        let cagr5y = data.cagr?.['5y'] ? parseFloat(data.cagr['5y'].toString()) : null;

        // Fallback to riskMetrics.returns if cagr is missing at the root level
        if (cagr1y === null && cagr3y === null && data.riskMetrics?.returns?.timeframes) {
            const timeframes = data.riskMetrics.returns.timeframes;
            const t1y = timeframes.find((t: any) => t.timeframe === '1y');
            const t3y = timeframes.find((t: any) => t.timeframe === '3y');
            const t5y = timeframes.find((t: any) => t.timeframe === '5y');
            if (t1y?.value && !isNaN(parseFloat(t1y.value))) cagr1y = parseFloat(t1y.value);
            if (t3y?.value && !isNaN(parseFloat(t3y.value))) cagr3y = parseFloat(t3y.value);
            if (t5y?.value && !isNaN(parseFloat(t5y.value))) cagr5y = parseFloat(t5y.value);
        }

        // 3. Update Scheme Record
        const schemeSql = `
            UPDATE mf_schemes SET 
                amc_id = $1,
                scheme_category = $2,
                latest_nav = $3,
                latest_nav_date = $4,
                aum = $5,
                expense_ratio = $6,
                risk_level = $7,
                fund_manager = $8,
                exit_load = $9,
                min_sip = $10,
                cagr_1y = $11,
                cagr_3y = $12,
                cagr_5y = $13,
                rating = $14,
                updated_at = NOW()
            WHERE scheme_code = $15
        `;
        
            await db.query(schemeSql, [
                amcId, 
                data.schemeCategoryLabel, 
                latestNav, 
                latestDate, 
                aum, 
                expenseRatio, 
                riskLevel, 
                fundManager, 
                exitLoad, 
                minSip,
                cagr1y, 
                cagr3y, 
                cagr5y, 
                rating, 
                schemeCode
            ]);
            
            finapiDataFound = true;
        }
    } catch (finapiErr: any) {
        logger.warn(`[MFAPI] FinAPI details fetch failed for ${schemeCode}. Setting defaults. (${finapiErr.message})`);
    }

    // Fallback: If FinAPI fails or has no data, remove the product from the marketplace
    if (!finapiDataFound) {
        logger.warn(`[MFAPI] Removing scheme ${schemeCode} from marketplace because FinAPI data is missing.`);
        await db.query(`DELETE FROM mf_schemes WHERE scheme_code = $1`, [schemeCode]);
        return; // Exit early, no need to fetch historical NAV for a deleted scheme
    }

        
        // 4. Fetch and Upsert Historical NAVs from mfapi.in
        if (!skipHistory) {
            try {
                const histResponse = await axios.get<MfNavResponse>(`https://api.mfapi.in/mf/${schemeCode}`);
                const histData = histResponse.data.data;
                if (histData && histData.length > 0) {
                    let historyUpserted = 0;
                    for (let i = 0; i < histData.length; i += BATCH_SIZE) {
                        const batch = histData.slice(i, i + BATCH_SIZE);
                        const values: (string | number)[] = [];
                        let validCount = 0;
                        
                        const placeholders: string[] = [];
                        batch.forEach((d) => {
                            const parsedDate = parseDate(d.date);
                            const parsedNav = parseFloat(d.nav);
                            if (parsedDate && !isNaN(parsedNav)) {
                                const base = validCount * 3;
                                values.push(schemeCode, parsedDate, parsedNav);
                                placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
                                validCount++;
                            }
                        });

                        if (placeholders.length > 0) {
                            const histSql = `
                                INSERT INTO mf_nav_history (scheme_code, nav_date, nav_value)
                                VALUES ${placeholders.join(', ')}
                                ON CONFLICT (scheme_code, nav_date) DO UPDATE SET
                                    nav_value = EXCLUDED.nav_value
                            `;
                            await db.query(histSql, values);
                            historyUpserted += placeholders.length;
                        }
                    }
                    logger.info(`[MFAPI] Scheme ${schemeCode} hydrated with ${historyUpserted} historical NAV records`);
                }
            } catch (histErr: any) {
                logger.warn(`[MFAPI] Failed to fetch historical NAV for ${schemeCode} from mfapi.in: ${histErr.message}`);
            }
        }
        logger.info(`[MFAPI] Successfully hydrated scheme ${schemeCode}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createSyncLog(syncType: string): Promise<number> {
    const res = await db.query(
        `INSERT INTO mf_sync_logs (sync_type, status) VALUES ($1, 'RUNNING') RETURNING id`,
        [syncType]
    );
    return res.rows[0].id;
}

async function updateSyncLog(id: number, status: string, records: number = 0, errorMsg: string = '') {
    await db.query(
        `UPDATE mf_sync_logs SET status = $1, records_processed = $2, error_message = $3, completed_at = NOW() WHERE id = $4`,
        [status, records, errorMsg, id]
    );
}
