import axios from 'axios';
import db from '../config/database';
import logger from '../config/logger';

// Base URL for API calls
const IIFL_API_BASE_URL = 'https://api.iiflcapital.com/v1'; 

// Credentials from environment variables or config
const APP_KEY = process.env.IIFL_APP_KEY || 'xfi92yf7ULjSxyJ';
const APP_SECRET_KEY = process.env.IIFL_APP_SECRET_KEY || 'IhkYNtmwKQ6LjvZizEYLenWSSMAKaOFWr7RbOsVnsRkaqHMFNMlElV8mcXoRSuOw2fiKuJsinwJ08jSlvw7l1pmgY1XWTJIse1za';

// Optional: State variable for a session/access token if required
let iiflAccessToken: string | null = null;

const BATCH_SIZE = 1000;

/**
 * Helper to get the Axios instance configured with IIFL headers.
 */
async function getIiflClient() {
    if (!iiflAccessToken) {
        await authenticateIifl();
    }
    
    return axios.create({
        baseURL: IIFL_API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${iiflAccessToken}`,
            'App-Key': APP_KEY,
            // Add any other required headers here based on IIFL docs
        }
    });
}

/**
 * Authenticates with IIFL to get a session/access token.
 */
async function authenticateIifl() {
    try {
        logger.info('[IIFL API] Authenticating...');
        
        // TODO: Replace with the actual authentication endpoint and payload structure when needed for orders/quotes
        const response = await axios.post(`${IIFL_API_BASE_URL}/auth/login`, {
            appKey: APP_KEY,
            appSecretKey: APP_SECRET_KEY
        });
        
        if (response.data && response.data.accessToken) {
            iiflAccessToken = response.data.accessToken;
            logger.info('[IIFL API] Authentication successful.');
        } else {
            throw new Error('Invalid response from IIFL Auth');
        }
    } catch (err: any) {
        logger.error(`[IIFL API] Authentication failed (Note: Some APIs work without auth): ${err.message}`);
    }
}


// ==========================================
// EQUITY & MARKET CONTRACTS
// ==========================================

const EXCHANGES = [
    'NSEEQ', 'NSEFO', 'NSECOMM', 'MCXCOMM', 
    'INDICES', 'NSECURR', 'BSEEQ', 'BSEFO', 'BSECURR'
];

export interface IiflInstrument {
    formattedInstrumentName: string;
    instrumentType: string;
    underlyingInstrumentName: string;
    lotSize: string;
    instrumentId: string;
    underlyingInstrumentSymbol: string;
    tickSize: string;
    optionType: string;
    series: string;
    qtyLimit: string;
    exchange: string;
    expiry: string;
    tradingSymbol: string;
    strikePrice: string;
}

/**
 * Fetches all IIFL instrument JSON files and upserts them into the database.
 * No authorization is required to make these API calls.
 */
export async function syncEquityContracts() {
    logger.info('[IIFL API] Starting Equity Contracts sync');
    let totalUpserted = 0;

    for (const exchange of EXCHANGES) {
        try {
            logger.info(`[IIFL API] Fetching contracts for ${exchange}...`);
            const response = await axios.get<IiflInstrument[]>(`${IIFL_API_BASE_URL}/contractfiles/${exchange}.json`);
            
            const instruments = response.data || [];
            logger.info(`[IIFL API] Found ${instruments.length} contracts for ${exchange}`);
            
            for (let i = 0; i < instruments.length; i += BATCH_SIZE) {
                const batch = instruments.slice(i, i + BATCH_SIZE);
                const values: any[] = [];
                const placeholders: string[] = [];
                
                batch.forEach((inst, idx) => {
                    const base = idx * 14;
                    values.push(
                        inst.instrumentId,
                        inst.exchange,
                        inst.formattedInstrumentName,
                        inst.instrumentType,
                        inst.underlyingInstrumentName,
                        inst.underlyingInstrumentSymbol,
                        inst.tradingSymbol,
                        inst.series,
                        inst.lotSize ? parseInt(inst.lotSize) : null,
                        inst.tickSize ? parseFloat(inst.tickSize) : null,
                        inst.optionType,
                        inst.expiry,
                        inst.strikePrice,
                        inst.qtyLimit ? parseInt(inst.qtyLimit) : null
                    );
                    
                    placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, NOW())`);
                });

                if (placeholders.length > 0) {
                    const sql = `
                        INSERT INTO iifl_instruments (
                            instrument_id, exchange, formatted_name, instrument_type, 
                            underlying_name, underlying_symbol, trading_symbol, series, 
                            lot_size, tick_size, option_type, expiry, strike_price, qty_limit, updated_at
                        ) VALUES ${placeholders.join(', ')}
                        ON CONFLICT (instrument_id) DO UPDATE SET
                            exchange = EXCLUDED.exchange,
                            formatted_name = EXCLUDED.formatted_name,
                            instrument_type = EXCLUDED.instrument_type,
                            underlying_name = EXCLUDED.underlying_name,
                            underlying_symbol = EXCLUDED.underlying_symbol,
                            trading_symbol = EXCLUDED.trading_symbol,
                            series = EXCLUDED.series,
                            lot_size = EXCLUDED.lot_size,
                            tick_size = EXCLUDED.tick_size,
                            option_type = EXCLUDED.option_type,
                            expiry = EXCLUDED.expiry,
                            strike_price = EXCLUDED.strike_price,
                            qty_limit = EXCLUDED.qty_limit,
                            updated_at = EXCLUDED.updated_at
                    `;
                    await db.query(sql, values);
                    totalUpserted += batch.length;
                }
            }
        } catch (err: any) {
            logger.error(`[IIFL API] Failed to fetch or save contracts for ${exchange}: ${err.message}`);
        }
    }
    logger.info(`[IIFL API] Equity Contracts sync completed. Total processed: ${totalUpserted}`);
}


// ==========================================
// INSURANCE (Life/Term, Health)
// ==========================================

export async function getInsuranceProducts(category: 'life' | 'health') {
    try {
        const client = await getIiflClient();
        // TODO: Wait for specific IIFL endpoints for Insurance
        logger.warn('[IIFL API] getInsuranceProducts endpoint not defined yet');
        return [];
    } catch (err: any) {
        logger.error(`[IIFL API] Failed to fetch Insurance Products (${category}): ${err.message}`);
        throw err;
    }
}


// ==========================================
// LOAN
// ==========================================

export async function getLoanProducts() {
    try {
        const client = await getIiflClient();
        // TODO: Wait for specific IIFL endpoints for Loans
        logger.warn('[IIFL API] getLoanProducts endpoint not defined yet');
        return [];
    } catch (err: any) {
        logger.error(`[IIFL API] Failed to fetch Loan Products: ${err.message}`);
        throw err;
    }
}


// ==========================================
// FIXED DEPOSITS (FD)
// ==========================================

export async function getFixedDeposits() {
    try {
        const client = await getIiflClient();
        // TODO: Wait for specific IIFL endpoints for FDs
        logger.warn('[IIFL API] getFixedDeposits endpoint not defined yet');
        return [];
    } catch (err: any) {
        logger.error(`[IIFL API] Failed to fetch Fixed Deposits: ${err.message}`);
        throw err;
    }
}

// ==========================================
// AIF, PMS, REAL ESTATE, OTHER ASSETS
// ==========================================

export async function getAlternativeAssets(type: 'aif' | 'pms' | 'real_estate' | 'other') {
    try {
        const client = await getIiflClient();
        // TODO: Wait for specific IIFL endpoints for Alternative Assets
        logger.warn(`[IIFL API] getAlternativeAssets (${type}) endpoint not defined yet`);
        return [];
    } catch (err: any) {
        logger.error(`[IIFL API] Failed to fetch Alternative Assets (${type}): ${err.message}`);
        throw err;
    }
}
