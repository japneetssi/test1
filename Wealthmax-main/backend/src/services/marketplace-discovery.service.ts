import { MARKETPLACE_PRODUCTS } from '../data/products';
import {
    Product,
    ProductCategory,
    RiskLevel,
    AssetClass,
    CatalogFilters,
    CategoryInfo,
    FilterOptions
} from '../types/marketplace';
import db from '../config/database';
import axios from 'axios';

// ── Yahoo Finance v8 Chart API hydration (works from Render, unlike yahoo-finance2) ──
// Uses browser-like headers to avoid 401/429 blocks on cloud IPs.
const YAHOO_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com',
    'Origin': 'https://finance.yahoo.com',
};

/**
 * Fetches a single ticker from Yahoo Finance v8 chart API.
 * Returns null if the ticker is not found or any error occurs.
 */
async function fetchYahooChart(ticker: string): Promise<any> {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
        const res = await axios.get(url, {
            headers: YAHOO_HEADERS,
            timeout: 8000,
        });
        const meta = res.data?.chart?.result?.[0]?.meta;
        if (!meta) return null;
        return meta;
    } catch (e: any) {
        // Silently skip tickers that 404 or error
        return null;
    }
}

/**
 * Batch-fetches quotes for a list of tickers using the Yahoo v8 chart API.
 * Returns a Map<ticker, meta> for all successfully fetched tickers.
 */
async function batchFetchYahooCharts(tickers: string[]): Promise<Map<string, any>> {
    const results = await Promise.allSettled(tickers.map(t => fetchYahooChart(t)));
    const map = new Map<string, any>();
    results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value && r.value.regularMarketPrice) {
            map.set(tickers[i], r.value);
        }
    });
    console.log(`[Equity Hydration] Fetched ${map.size} quotes for ${tickers.length} tickers`);
    return map;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
    'MF': 'Mutual Funds',
    'Equity': 'Stocks and Shares',
    'Insurance': 'Life and Health Insurance',
    'Loan': 'Personal and Home Loans',
    'FD': 'Fixed Deposits',
    'AIF': 'Alternative Investment Funds',
    'PMS': 'Portfolio Management Services'
};

export class MarketplaceDiscoveryService {

    /**
     * Map a database row from mf_schemes to Product schema
     */
    private static mapDbSchemeToProduct(row: any): Product {
        return {
            id: `mf-${row.scheme_code}`,
            name: row.scheme_name,
            category: 'MF',
            riskLevel: row.risk_level as RiskLevel || 'Moderate',
            description: row.scheme_category || 'Mutual Fund Scheme',
            assetClass: 'Other' as AssetClass,
            fundHouse: row.amc_name || 'Unknown AMC',
            tags: [row.scheme_type, row.scheme_category].filter(Boolean) as string[],
            isin: row.isin_growth || undefined,
            stats: {
                nav: row.latest_nav ? parseFloat(row.latest_nav) : undefined,
                cagr3Y: row.cagr_3y ? `${row.cagr_3y}%` : undefined,
                cagr5Y: row.cagr_5y ? `${row.cagr_5y}%` : undefined
            },
            amc: row.amc_name || 'Unknown AMC',
            nav: row.latest_nav ? parseFloat(row.latest_nav) : undefined,
            cagr1y: row.cagr_1y != null ? parseFloat(row.cagr_1y) : undefined,
            cagr3y: row.cagr_3y != null ? parseFloat(row.cagr_3y) : undefined,
            cagr5y: row.cagr_5y != null ? parseFloat(row.cagr_5y) : undefined,
            aum: row.aum ? `₹${row.aum} Cr` : undefined,
            rating: row.rating ? parseInt(row.rating, 10) : undefined,
            minSIP: row.min_sip ? parseFloat(row.min_sip) : 500,
            expenseRatio: row.expense_ratio ? `${row.expense_ratio}%` : undefined,
            fundManager: row.fund_manager || undefined,
            exitLoad: row.exit_load || undefined,
            isRecommended: false
        } as any;
    }

    /**
     * Map a database row from iifl_instruments to Product schema
     */
    private static mapDbIiflToProduct(row: any): Product {
        return {
            id: `iifl-${row.instrument_id}`,
            name: row.formatted_name || row.trading_symbol,
            category: 'Equity', 
            riskLevel: 'Aggressive',
            description: row.underlying_name || row.instrument_type,
            assetClass: 'Equity' as AssetClass,
            fundHouse: row.exchange,
            tags: [row.instrument_type, row.series].filter(Boolean) as string[],
            isin: undefined,
            stats: {
                nav: 0,
            },
            amc: row.exchange,
            nav: 0,
            marketCap: 'N/A',
            peRatio: 0,
            pbRatio: 0,
            industryPe: 0,
            debtToEquity: 0,
            roe: 'N/A',
            eps: 0,
            dividendYield: 0,
            minSIP: row.lot_size ? parseInt(row.lot_size) : 1,
            isRecommended: false,
            symbol: row.trading_symbol
        } as any;
    }



    /**
     * Fetch paginated and filtered mutual funds from database
     */
    static async getCatalog(filters: CatalogFilters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const offset = (page - 1) * limit;

        // If it's a category we don't have tables for yet, return empty data
        const dbCategories = ['All', 'MF', 'Equity'];
        
        if (filters.category && !dbCategories.includes(filters.category)) {
            return {
                data: [],
                totalCount: 0,
                page,
                limit,
                hasMore: false
            };
        }

        const fetchEquity = filters.category === 'Equity';

        // ── EQUITY (IIFL) LOGIC ──
        if (fetchEquity) {
            try {
                let whereClauses: string[] = [];
                let params: any[] = [];

                // ── STRICT EQUITY FILTER ──
                // Only NSE-listed pure equity stocks (EQ/BE series).
                // Using ONLY NSEEQ avoids BSE duplicates (same company listed on both).
                // instrument_type='0' is NSE's code for pure equity (not futures/options/bonds).
                // whereClauses.push(`exchange = 'NSEEQ'`);
                // whereClauses.push(`instrument_type = '0'`);
                // whereClauses.push(`series IN ('EQ', 'BE', 'BZ', 'SM')`);

                // Exclude Sovereign Gold Bonds and Government Securities
                whereClauses.push(`trading_symbol NOT LIKE 'SGB%'`);
                whereClauses.push(`trading_symbol NOT LIKE '%-GB'`);
                whereClauses.push(`trading_symbol NOT LIKE '%-GS'`);

                if (filters.query && filters.query.length >= 2) {
                    params.push(`%${filters.query}%`);
                    whereClauses.push(`(formatted_name ILIKE $${params.length} OR trading_symbol ILIKE $${params.length})`);
                }

                let whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

                // Count Total
                const countSql = `SELECT COUNT(*) as total FROM iifl_instruments ${whereSql}`;
                const countRes = await db.query(countSql, params);
                const totalCount = parseInt(countRes.rows[0].total, 10);

                // Blue-chip priority list — these show first on page 1 regardless of sort
                const topStocks = [
                    'RELIANCE-EQ', 'TCS-EQ', 'HDFCBANK-EQ', 'ICICIBANK-EQ', 'BHARTIARTL-EQ',
                    'SBIN-EQ', 'INFY-EQ', 'LICI-EQ', 'ITC-EQ', 'HINDUNILVR-EQ',
                    'LT-EQ', 'BAJFINANCE-EQ', 'HCLTECH-EQ', 'MARUTI-EQ', 'SUNPHARMA-EQ',
                    'ADANIENT-EQ', 'KOTAKBANK-EQ', 'TITAN-EQ', 'ONGC-EQ', 'TATAMOTORS-EQ',
                    'NTPC-EQ', 'AXISBANK-EQ', 'DMART-EQ', 'ADANIGREEN-EQ', 'ADANIPORTS-EQ',
                    'ULTRACEMCO-EQ', 'ASIANPAINT-EQ', 'COALINDIA-EQ', 'BAJAJFINSV-EQ',
                    'BAJAJ-AUTO-EQ', 'POWERGRID-EQ', 'NESTLEIND-EQ', 'WIPRO-EQ', 'M&M-EQ',
                    'IOC-EQ', 'JIOFIN-EQ', 'HAL-EQ', 'DLF-EQ', 'ADANIPOWER-EQ',
                    'JSWSTEEL-EQ', 'TATASTEEL-EQ', 'SIEMENS-EQ', 'IRFC-EQ', 'VBL-EQ',
                    'ZOMATO-EQ', 'PIDILITIND-EQ', 'GRASIM-EQ', 'SBILIFE-EQ', 'BEL-EQ',
                    'LTIM-EQ', 'TRENT-EQ', 'HDFCLIFE-EQ', 'APOLLOHOSP-EQ', 'CIPLA-EQ',
                    'DRREDDY-EQ', 'DIVISLAB-EQ', 'EICHERMOT-EQ', 'HINDALCO-EQ',
                    'INDUSINDBK-EQ', 'SBICARD-EQ', 'SHREECEM-EQ', 'TATACONSUM-EQ',
                    'TECHM-EQ', 'TORNTPHARM-EQ', 'HEROMOTOCO-EQ', 'BPCL-EQ',
                    'GODREJCP-EQ', 'BRITANNIA-EQ', 'DABUR-EQ', 'MARICO-EQ',
                    'NYKAA-EQ', 'PAYTM-EQ', 'ZYDUSLIFE-EQ', 'MUTHOOTFIN-EQ',
                    'BLUEDART-EQ', 'KALYAN-EQ', 'MRSFOODSPEC-EQ', 'INDUSTOWER-EQ',
                    'AUROPHARMA-EQ', 'BANKBARODA-EQ', 'CANBK-EQ', 'PNB-EQ',
                    'IDFCFIRSTB-EQ', 'FEDERALBNK-EQ', 'JINDALSTEL-EQ', 'NMDC-EQ',
                    'SAIL-EQ', 'GAIL-EQ', 'RECLTD-EQ', 'PFC-EQ', 'TATAPOWER-EQ',
                    'CESC-EQ', 'TORNTPOWER-EQ', 'APOLLOTYRE-EQ', 'MOTHERSON-EQ',
                    'BALKRISIND-EQ', 'MRF-EQ', 'TATACHEM-EQ', 'UPL-EQ', 'PIIND-EQ'
                ];
                const prioritizeBlueChips = (!filters.query || filters.query.length < 2)
                    ? `CASE WHEN trading_symbol = ANY(ARRAY[${topStocks.map(t => `'${t}'`).join(', ')}]) THEN 0 ELSE 1 END,`
                    : '';

                let sortSql = '';
                if (filters.sortBy === 'nav') {
                    sortSql = `ORDER BY ${prioritizeBlueChips} tick_size DESC NULLS LAST`;
                } else {
                    sortSql = `ORDER BY ${prioritizeBlueChips} formatted_name ASC NULLS LAST`;
                }

                const dataSql = `
                    SELECT * FROM iifl_instruments
                    ${whereSql}
                    ${sortSql}
                    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
                `;
                params.push(limit, offset);
                
                const result = await db.query(dataSql, params);
                const data = result.rows.map(row => this.mapDbIiflToProduct(row));

                // ── Hydrate real-time data from equity_prices DB table ──
                // Prices are pre-populated by the local populate-equity-prices.js script.
                // This avoids any runtime HTTP calls to Yahoo Finance (blocked on Render).
                try {
                    const symbols = result.rows.map(r => r.trading_symbol);

                    if (symbols.length > 0) {
                        const placeholders = symbols.map((_, i) => `$${i + 1}`).join(', ');
                        const priceRes = await db.query(
                            `SELECT * FROM equity_prices WHERE trading_symbol = ANY(ARRAY[${placeholders}])`,
                            symbols
                        );

                        const priceMap = new Map<string, any>();
                        priceRes.rows.forEach(r => priceMap.set(r.trading_symbol, r));

                        console.log(`[Equity Hydration] Loaded ${priceMap.size} prices from DB for ${symbols.length} symbols`);

                        for (let i = 0; i < data.length; i++) {
                            const item = data[i] as any;
                            const row = result.rows[i];
                            const p = priceMap.get(row.trading_symbol);

                            if (p) {
                                const ltp = parseFloat(p.ltp);
                                if (ltp > 0) {
                                    item.stats.nav = ltp;
                                    item.nav = ltp;
                                }
                                if (p.change_pct !== undefined) {
                                    item.cagr1y = parseFloat(parseFloat(p.change_pct).toFixed(2));
                                }
                                if (p.change_amount !== undefined) {
                                    item.change = parseFloat(parseFloat(p.change_amount).toFixed(2));
                                }
                                const mc = parseInt(p.market_cap);
                                if (mc > 0) {
                                    item.marketCap = `₹${Math.floor(mc / 10000000).toLocaleString('en-IN')} Cr`;
                                }
                                const pe = parseFloat(p.pe_ratio);
                                if (pe > 0) item.peRatio = parseFloat(pe.toFixed(2));
                                const pb = parseFloat(p.pb_ratio);
                                if (pb > 0) item.pbRatio = parseFloat(pb.toFixed(2));
                                const dy = parseFloat(p.dividend_yield);
                                if (dy > 0) item.dividendYield = parseFloat(dy.toFixed(2));
                                const eps = parseFloat(p.eps);
                                if (eps !== 0) item.eps = parseFloat(eps.toFixed(2));
                                const vol = parseInt(p.volume);
                                if (vol > 0) item.volume = vol;
                                const h = parseFloat(p.week_52_high);
                                const l = parseFloat(p.week_52_low);
                                if (h > 0) item.week52High = h;
                                if (l > 0) item.week52Low = l;
                            }
                        }

                        // Post-sort after hydration
                        if (filters.sortBy === 'gainer') {
                            data.sort((a: any, b: any) => (b.cagr1y || 0) - (a.cagr1y || 0));
                        } else if (filters.sortBy === 'loser') {
                            data.sort((a: any, b: any) => (a.cagr1y || 0) - (b.cagr1y || 0));
                        } else if (filters.sortBy === 'volume') {
                            data.sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0));
                        } else if (filters.sortBy === 'marketCap') {
                            data.sort((a: any, b: any) => {
                                const capA = typeof a.marketCap === 'string' && a.marketCap.startsWith('₹')
                                    ? parseFloat(a.marketCap.replace(/[₹,\s]/g, '').replace(' Cr', '')) : 0;
                                const capB = typeof b.marketCap === 'string' && b.marketCap.startsWith('₹')
                                    ? parseFloat(b.marketCap.replace(/[₹,\s]/g, '').replace(' Cr', '')) : 0;
                                return capB - capA;
                            });
                        }
                    }
                } catch (e) {
                    console.error('Failed to hydrate catalog from equity_prices table:', e);
                }

                return {
                    data,
                    totalCount,
                    page,
                    limit,
                    hasMore: (offset + limit) < totalCount
                };
            } catch (error) {
                console.error('Error fetching DB IIFL instruments', error);
                return { data: [], totalCount: 0, page, limit, hasMore: false };
            }
        }

        // ── MUTUAL FUNDS LOGIC (For 'MF' or 'All') ──
        try {
            let whereClauses: string[] = [];
            let params: any[] = [];

            if (filters.query && filters.query.length >= 2) {
                params.push(`%${filters.query}%`);
                whereClauses.push(`(s.scheme_name ILIKE $${params.length} OR s.scheme_category ILIKE $${params.length} OR a.name ILIKE $${params.length})`);
            }

            if (filters.amcs && filters.amcs.length > 0) {
                // To avoid passing arrays, we dynamically build IN clause with params
                const inParams = filters.amcs.map(amc => {
                    params.push(amc);
                    return `$${params.length}`;
                });
                whereClauses.push(`a.name IN (${inParams.join(', ')})`);
            }

            // Always filter out inactive/dead funds (must have a valid NAV)
            whereClauses.push(`s.latest_nav IS NOT NULL AND s.latest_nav > 0`);
            whereClauses.push(`a.name IS NOT NULL AND a.name != ''`);

            // Note: riskLevels are deterministic based on seed (scheme_code % 3), but it's hard to filter in SQL exactly.
            // For a production app, risk_level should be a real column in `mf_schemes`.
            // We'll approximate or skip strict risk filtering at SQL level unless we add a column.
            // We can do a pseudo-filter: 'Aggressive' -> scheme_code % 3 = 0
            if (filters.riskLevels && filters.riskLevels.length > 0) {
                const modClauses: string[] = [];
                if (filters.riskLevels.includes('Aggressive')) modClauses.push(`s.scheme_code % 3 = 0`);
                if (filters.riskLevels.includes('Moderate')) modClauses.push(`s.scheme_code % 3 = 1 OR s.scheme_code % 2 = 0 AND s.scheme_code % 3 != 0`); // Pseudo logic matching frontend
                if (filters.riskLevels.includes('Conservative')) modClauses.push(`s.scheme_code % 3 != 0 AND s.scheme_code % 2 != 0`);
                if (modClauses.length > 0) {
                    whereClauses.push(`(${modClauses.join(' OR ')})`);
                }
            }

            let whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            // Count Total
            const countSql = `
                SELECT COUNT(*) as total 
                FROM mf_schemes s 
                LEFT JOIN mf_amcs a ON s.amc_id = a.id 
                ${whereSql}
            `;
            const countRes = await db.query(countSql, params);
            const totalCount = parseInt(countRes.rows[0].total, 10);

            // Fetch Data
            let sortSql = `ORDER BY s.latest_nav_date DESC NULLS LAST`;
            if (filters.sortBy === 'cagr3y') {
                sortSql = `ORDER BY s.cagr_3y DESC NULLS LAST`;
            } else if (filters.sortBy === 'nav') {
                sortSql = `ORDER BY s.latest_nav DESC NULLS LAST`;
            } else if (filters.sortBy === 'rating') {
                sortSql = `ORDER BY s.rating DESC NULLS LAST`;
            }

            const dataSql = `
                SELECT s.*, a.name as amc_name
                FROM mf_schemes s
                LEFT JOIN mf_amcs a ON s.amc_id = a.id
                ${whereSql}
                ${sortSql}
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;
            params.push(limit, offset);

            const result = await db.query(dataSql, params);

            // Lazy hydration: check risk_level instead of aum/cagr_3y because some funds legitimately lack aum/cagr in the API
            const unhydratedSchemes = result.rows.filter(r => r.risk_level === null);
            if (unhydratedSchemes.length > 0) {
                try {
                    const { hydrateSchemeData } = await import('./mfapi.service');
                    await Promise.allSettled(unhydratedSchemes.map(r => hydrateSchemeData(r.scheme_code, true)));
                    
                    // Re-fetch to get updated values
                    const schemeCodes = result.rows.map(r => r.scheme_code);
                    const refreshedResult = await db.query(`
                        SELECT s.*, a.name as amc_name
                        FROM mf_schemes s
                        LEFT JOIN mf_amcs a ON s.amc_id = a.id
                        WHERE s.scheme_code = ANY($1)
                    `, [schemeCodes]);
                    
                    const map = new Map();
                    refreshedResult.rows.forEach(r => map.set(r.scheme_code, r));
                    for (let i = 0; i < result.rows.length; i++) {
                        const fresh = map.get(result.rows[i].scheme_code);
                        if (fresh) result.rows[i] = fresh;
                    }
                } catch (e) {
                    console.error('Lazy hydration failed', e);
                }
            }

            const data = result.rows.map(this.mapDbSchemeToProduct);

            return {
                data,
                totalCount,
                page,
                limit,
                hasMore: (offset + limit) < totalCount
            };
        } catch (error) {
            console.error('Error fetching DB mutual funds', error);
            return {
                data: [],
                totalCount: 0,
                page,
                limit,
                hasMore: false
            };
        }
    }

    /**
     * Get single product by ID
     */
    static async getProductById(id: string): Promise<Product | null> {
        if (id.startsWith('mf-')) {
            const schemeCode = parseInt(id.replace('mf-', ''), 10);
            if (!isNaN(schemeCode)) {
                let res = await db.query(`
                    SELECT s.*, a.name as amc_name
                    FROM mf_schemes s
                    LEFT JOIN mf_amcs a ON s.amc_id = a.id
                    WHERE s.scheme_code = $1
                `, [schemeCode]);
                
                if (res.rows.length > 0 && res.rows[0].rating === null) {
                    try {
                        const { hydrateSchemeData } = await import('./mfapi.service');
                        await hydrateSchemeData(schemeCode, true);
                        
                        res = await db.query(`
                            SELECT s.*, a.name as amc_name
                            FROM mf_schemes s
                            LEFT JOIN mf_amcs a ON s.amc_id = a.id
                            WHERE s.scheme_code = $1
                        `, [schemeCode]);
                    } catch (hydrateErr) {
                        console.error('On-demand product hydration failed:', hydrateErr);
                    }
                }

                if (res.rows.length > 0) {
                    return this.mapDbSchemeToProduct(res.rows[0]);
                }
            }
        }
        if (id.startsWith('iifl-')) {
            const instId = id.replace('iifl-', '');
            const res = await db.query(`SELECT * FROM iifl_instruments WHERE instrument_id = $1`, [instId]);
            if (res.rows.length > 0) {
                const product: any = this.mapDbIiflToProduct(res.rows[0]);
                try {
                    const row = res.rows[0];
                    const priceRes = await db.query(
                        `SELECT * FROM equity_prices WHERE trading_symbol = $1`,
                        [row.trading_symbol]
                    );

                    if (priceRes.rows.length > 0) {
                        const p = priceRes.rows[0];
                        const ltp = parseFloat(p.ltp);
                        if (ltp > 0) {
                            product.stats.nav = ltp;
                            product.nav = ltp;
                        }
                        if (p.change_amount) product.change = parseFloat(p.change_amount);
                        if (p.change_pct) product.previousClose = ltp - parseFloat(p.change_amount);
                        if (p.volume > 0) product.volume = parseInt(p.volume);
                        if (parseFloat(p.week_52_high) > 0) product.week52High = parseFloat(p.week_52_high);
                        if (parseFloat(p.week_52_low) > 0) product.week52Low = parseFloat(p.week_52_low);
                        const mc = parseInt(p.market_cap);
                        if (mc > 0) product.marketCap = `₹${Math.floor(mc / 10000000).toLocaleString('en-IN')} Cr`;
                        const pe = parseFloat(p.pe_ratio);
                        if (pe > 0) product.peRatio = parseFloat(pe.toFixed(2));
                        const pb = parseFloat(p.pb_ratio);
                        if (pb > 0) product.pbRatio = parseFloat(pb.toFixed(2));
                        const dy = parseFloat(p.dividend_yield);
                        if (dy > 0) product.dividendYield = parseFloat(dy.toFixed(2));
                        const eps = parseFloat(p.eps);
                        if (eps !== 0) product.eps = parseFloat(eps.toFixed(2));
                    }
                } catch (e) {
                    console.error(`Failed to fetch equity data from DB for product ${id}:`, e);
                }
                return product;
            }
            return null;
        }

        return null;
    }

    /**
     * Get product by ISIN code
     */
    static async getProductByIsin(isin: string): Promise<Product | null> {
        const upperIsin = isin.toUpperCase();
        let res = await db.query(`
            SELECT s.*, a.name as amc_name
            FROM mf_schemes s
            LEFT JOIN mf_amcs a ON s.amc_id = a.id
            WHERE s.isin_growth = $1 OR s.isin_div_reinvestment = $1
        `, [upperIsin]);

        if (res.rows.length > 0 && res.rows[0].rating === null) {
            try {
                const schemeCode = res.rows[0].scheme_code;
                const { hydrateSchemeData } = await import('./mfapi.service');
                await hydrateSchemeData(schemeCode, true);
                
                res = await db.query(`
                    SELECT s.*, a.name as amc_name
                    FROM mf_schemes s
                    LEFT JOIN mf_amcs a ON s.amc_id = a.id
                    WHERE s.isin_growth = $1 OR s.isin_div_reinvestment = $1
                `, [upperIsin]);
            } catch (hydrateErr) {
                console.error('On-demand product hydration failed:', hydrateErr);
            }
        }

        if (res.rows.length > 0) {
            return this.mapDbSchemeToProduct(res.rows[0]);
        }
        return null;
    }

    /**
     * Get available categories with product counts
     */
    static async getCategories(): Promise<CategoryInfo[]> {
        const categories: CategoryInfo[] = [];

        // Get count from DB for MF
        try {
            const res = await db.query('SELECT COUNT(*) as count FROM mf_schemes');
            categories.push({
                name: 'MF' as ProductCategory,
                count: parseInt(res.rows[0].count, 10),
                description: CATEGORY_DESCRIPTIONS['MF']
            });
        } catch (e) {
            categories.push({
                name: 'MF' as ProductCategory,
                count: 0,
                description: CATEGORY_DESCRIPTIONS['MF']
            });
        }

        // Get count from DB for Equity (only actual stocks)
        try {
            const res = await db.query("SELECT COUNT(*) as count FROM iifl_instruments WHERE exchange IN ('NSEEQ', 'BSEEQ')");
            categories.push({
                name: 'Equity' as ProductCategory,
                count: parseInt(res.rows[0].count, 10),
                description: CATEGORY_DESCRIPTIONS['Equity']
            });
        } catch (e) {
            categories.push({
                name: 'Equity' as ProductCategory,
                count: 0,
                description: CATEGORY_DESCRIPTIONS['Equity']
            });
        }

        // Add 0 counts for other categories so UI tabs are preserved
        const mockCategoriesList = ['Insurance (Life/Term)', 'Insurance (Health)', 'Loan', 'FD', 'AIF', 'PMS', 'Real Estate', 'Other Assets'];
        for (const cat of mockCategoriesList) {
            categories.push({ name: cat as ProductCategory, count: 0, description: CATEGORY_DESCRIPTIONS[cat] || cat });
        }

        return categories;
    }

    /**
     * Get all available filter options for UI dropdowns
     */
    static async getFilterOptions(): Promise<FilterOptions> {
        const fundHouses = new Set<string>();

        // Add DB amcs
        try {
            const res = await db.query('SELECT name FROM mf_amcs ORDER BY name ASC');
            res.rows.forEach(r => fundHouses.add(r.name));
        } catch (e) {}

        return {
            categories: ['MF', 'Equity', 'FD', 'Insurance', 'Loan', 'AIF', 'PMS'] as ProductCategory[],
            riskLevels: ['Conservative', 'Moderate', 'Aggressive'] as RiskLevel[],
            assetClasses: ['Other'] as AssetClass[],
            fundHouses: Array.from(fundHouses),
            tags: []
        };
    }

    /**
     * Get historical NAV data for a mutual fund scheme or mock data for Equity
     */
    static async getHistory(schemeCode: string, timeframe: string = '1Y'): Promise<Array<{ date: string, value: number, volume?: number }>> {
        if (schemeCode.startsWith('iifl-')) {
            const instId = schemeCode.replace('iifl-', '');
            // Fetch instrument to get its name for the hash
            const res = await db.query(`SELECT exchange, formatted_name, trading_symbol FROM iifl_instruments WHERE instrument_id = $1`, [instId]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                
                // Try fetching real history from Yahoo Finance v8 chart API
                try {
                    const suffix = row.exchange === 'NSEEQ' ? '.NS' : (row.exchange === 'BSEEQ' ? '.BO' : '.NS');
                    let baseTicker = (row.trading_symbol as string).replace(/-(EQ|BE|BZ|SM)$/i, '');
                    const ticker = baseTicker + suffix;

                    let rangeParam = '1y';
                    let intervalParam = '1d';
                    switch (timeframe) {
                        case '1D': rangeParam = '1d';  intervalParam = '5m';  break;
                        case '5D': rangeParam = '5d';  intervalParam = '15m'; break;
                        case '1M': rangeParam = '1mo'; intervalParam = '1d';  break;
                        case '3M': rangeParam = '3mo'; intervalParam = '1d';  break;
                        case '6M': rangeParam = '6mo'; intervalParam = '1d';  break;
                        case '1Y': rangeParam = '1y';  intervalParam = '1d';  break;
                        case '3Y': rangeParam = '3y';  intervalParam = '1wk'; break;
                        case '5Y': rangeParam = '5y';  intervalParam = '1wk'; break;
                        case 'MAX': rangeParam = 'max'; intervalParam = '1mo'; break;
                    }

                    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${intervalParam}&range=${rangeParam}`;
                    const chartRes = await axios.get(url, { headers: YAHOO_HEADERS, timeout: 10000 });
                    const result = chartRes.data?.chart?.result?.[0];

                    if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
                        const timestamps: number[] = result.timestamp;
                        const closes: (number | null)[] = result.indicators.quote[0].close;
                        const volumes: (number | null)[] = result.indicators.quote[0].volume || [];

                        const history = timestamps
                            .map((ts: number, i: number) => ({
                                date: new Date(ts * 1000).toISOString(),
                                value: closes[i] !== null && closes[i] !== undefined ? parseFloat((closes[i] as number).toFixed(2)) : null,
                                volume: volumes[i] ?? undefined
                            }))
                            .filter((p: any) => p.value !== null) as Array<{ date: string, value: number, volume?: number }>;

                        if (history.length > 0) return history;
                    }
                } catch (e) {
                    console.error(`Yahoo finance history error for ${instId}:`, e);
                }

                // If history fails, just return empty array instead of fake data
                return [];
            }
            return [];
        }

        const numericCode = parseInt(schemeCode.replace('mf-', ''), 10);
        if (isNaN(numericCode)) return [];
        try {
            let res = await db.query(
                'SELECT nav_date, nav_value FROM mf_nav_history WHERE scheme_code = $1 ORDER BY nav_date ASC',
                [numericCode]
            );

            // Fetch on-demand if history is completely missing
            if (res.rows.length === 0) {
                try {
                    const { hydrateSchemeData } = await import('./mfapi.service');
                    await hydrateSchemeData(numericCode, false);
                    
                    // Re-query after hydration
                    res = await db.query(
                        'SELECT nav_date, nav_value FROM mf_nav_history WHERE scheme_code = $1 ORDER BY nav_date ASC',
                        [numericCode]
                    );
                } catch (hydrateErr) {
                    console.error('On-demand history hydration failed:', hydrateErr);
                }
            }

            return res.rows.map(r => ({
                date: r.nav_date.toISOString().split('T')[0],
                value: parseFloat(r.nav_value)
            }));
        } catch (e) {
            console.error('Error fetching history:', e);
            return [];
        }
    }
}
