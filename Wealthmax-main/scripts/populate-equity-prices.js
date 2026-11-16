/**
 * populate-equity-prices.js
 * 
 * Run this script FROM YOUR LOCAL MACHINE to populate live equity prices into the database.
 * Yahoo Finance works on local machine but is blocked on Render.
 * 
 * Usage: node populate-equity-prices.js
 */

const path = require('path');
// Resolve modules from backend/node_modules so we don't need a separate install
const backendModules = path.join(__dirname, '..', 'backend', 'node_modules');
require('module').globalPaths.push(backendModules);

const https = require('https');
const { Client } = require(path.join(backendModules, 'pg'));

const DATABASE_URL = 'postgresql://postgres.hjljksufiquaoihgsmvq:WeathMax2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';

const YAHOO_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com',
};

function fetchYahoo(ticker) {
    return new Promise((resolve) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
        const options = { headers: YAHOO_HEADERS, timeout: 8000 };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const meta = json?.chart?.result?.[0]?.meta;
                    if (meta && meta.regularMarketPrice) {
                        resolve(meta);
                    } else {
                        resolve(null);
                    }
                } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null)).on('timeout', () => resolve(null));
    });
}

async function main() {
    const db = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await db.connect();
    console.log('✅ Connected to database');

    // Get all NSE EQ stocks from DB
    const result = await db.query(`
        SELECT trading_symbol, underlying_symbol, exchange 
        FROM iifl_instruments 
        WHERE exchange = 'NSEEQ' 
          AND instrument_type = '0' 
          AND series IN ('EQ', 'BE', 'BZ', 'SM')
          AND underlying_symbol NOT LIKE 'SGB%'
          AND underlying_symbol NOT LIKE '%-GB'
          AND underlying_symbol NOT LIKE '%-GS'
        ORDER BY formatted_name ASC
    `);

    const stocks = result.rows;
    console.log(`📊 Found ${stocks.length} NSE equity stocks to hydrate`);

    let successCount = 0;
    
    const CONCURRENT = 5; // fetch 5 at a time to reduce rate limiting
    
    for (let i = 0; i < stocks.length; i += CONCURRENT) {
        const batch = stocks.slice(i, i + CONCURRENT);
        const promises = batch.map(async (stock) => {
            const ticker = stock.underlying_symbol + '.NS';
            const meta = await fetchYahoo(ticker);
            if (meta) {
                return {
                    trading_symbol: stock.trading_symbol,
                    ltp: meta.regularMarketPrice || 0,
                    change_amount: meta.regularMarketChange || 0,
                    change_pct: meta.regularMarketChangePercent || 0,
                    market_cap: meta.marketCap || 0,
                    pe_ratio: meta.trailingPE || 0,
                    pb_ratio: meta.priceToBook || 0,
                    dividend_yield: meta.dividendYield || 0,
                    week_52_high: meta.fiftyTwoWeekHigh || 0,
                    week_52_low: meta.fiftyTwoWeekLow || 0,
                    volume: meta.regularMarketVolume || 0,
                    eps: meta.epsTrailingTwelveMonths || 0,
                };
            } else {
                if (i < 20) console.log(`Failed to fetch: ${ticker}`);
            }
            return null;
        });

        const results = await Promise.all(promises);
        const valid = results.filter(r => r !== null);
        
        for (const r of valid) {
            await db.query(`
                INSERT INTO equity_prices 
                    (trading_symbol, ltp, change_amount, change_pct, market_cap, pe_ratio, pb_ratio, dividend_yield, week_52_high, week_52_low, volume, eps, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                ON CONFLICT (trading_symbol) DO UPDATE SET
                    ltp = EXCLUDED.ltp,
                    change_amount = EXCLUDED.change_amount,
                    change_pct = EXCLUDED.change_pct,
                    market_cap = EXCLUDED.market_cap,
                    pe_ratio = EXCLUDED.pe_ratio,
                    pb_ratio = EXCLUDED.pb_ratio,
                    dividend_yield = EXCLUDED.dividend_yield,
                    week_52_high = EXCLUDED.week_52_high,
                    week_52_low = EXCLUDED.week_52_low,
                    volume = EXCLUDED.volume,
                    eps = EXCLUDED.eps,
                    updated_at = NOW()
            `, [r.trading_symbol, r.ltp, r.change_amount, r.change_pct, r.market_cap, r.pe_ratio, r.pb_ratio, r.dividend_yield, r.week_52_high, r.week_52_low, r.volume, r.eps]);
            successCount++;
        }
        
        if ((i / CONCURRENT) % 10 === 0) {
            console.log(`⏳ Progress: ${Math.min(i + CONCURRENT, stocks.length)}/${stocks.length} (${successCount} with prices)`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n✅ Done! Populated ${successCount}/${stocks.length} stocks with live prices`);
    await db.end();
}

main().catch(console.error);
