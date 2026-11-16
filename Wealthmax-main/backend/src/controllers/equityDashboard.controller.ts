import { Request, Response } from 'express';
import db from '../config/database';
import redisCache from '../config/redis';
import logger from '../config/logger';
import YahooFinance from 'yahoo-finance2';
import { PortfolioService } from '../services/portfolio.service';

// yahoo-finance2 v3 exports the class directly - instantiate one shared client
// (previously the controller called modules on the class itself, which only
// surfaced as never-typed errors once a type-check actually ran).
const yahooFinance = new YahooFinance();

/**
 * Equity Dashboard controller.
 *
 * FIX (audit #20): market-overview / trending / recommended previously served
 * hardcoded static numbers (NIFTY 24320.15, TCS 4120.50...) regardless of the
 * actual market. They now source live prices from Yahoo Finance, use the
 * Redis cache to stay within request budgets, and the /portfolio endpoint is
 * authenticated and computed from the caller's real holdings.
 */

// Curated liquid NSE universe used for movers/trending aggregations.
const UNIVERSE_TICKERS = [
    // Large caps
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'LT.NS', 'HINDUNILVR.NS',
    'AXISBANK.NS', 'KOTAKBANK.NS', 'MARUTI.NS', 'TITAN.NS', 'WIPRO.NS',
    // Mid caps
    'TATAPOWER.NS', 'TATASTEEL.NS', 'HAL.NS', 'PFC.NS', 'RVNL.NS',
    'IREDA.NS', 'ZOMATO.NS', 'PAYTM.NS', 'CDSL.NS', 'BHEL.NS',
    // Banks / financials
    'PNB.NS', 'BANKBARODA.NS', 'INDUSINDBK.NS', 'YESBANK.NS', 'DLF.NS',
];

// Index / exposure tickers for the top strip. Labels state exactly what the
// ticker tracks (GOLDBEES is a gold ETF proxy, not spot gold).
const INDEX_TICKERS = [
    { name: 'NIFTY 50', symbol: '^NSEI' },
    { name: 'SENSEX', symbol: '^BSESN' },
    { name: 'BANK NIFTY', symbol: '^NSEBANK' },
    { name: 'NIFTY MIDCAP 100', symbol: 'NIFTY_MIDCAP_100.NS' },
    { name: 'NIFTY SMALLCAP 100', symbol: 'NIFTYSMLCAP100.NS' },
    { name: 'India VIX', symbol: '^INDIAVIX' },
    { name: 'USD/INR', symbol: 'USDINR=X' },
    { name: 'Gold (GOLDBEES)', symbol: 'GOLDBEES.NS' },
];

const UPCOMING_CACHE_TTL_SECONDS = 60;

interface Mover {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    /** Raw share volume - keep numeric so sorting is correct. */
    volume?: number;
}

function formatVolume(volume?: number): string {
    if (!volume) return 'N/A';
    if (volume >= 10_000_000) return `${(volume / 10_000_000).toFixed(1)}Cr`;
    if (volume >= 100_000) return `${(volume / 100_000).toFixed(1)}L`;
    if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
    return String(volume);
}

function isMarketOpenIST(): boolean {
    const now = new Date();
    const ist = new Date(now.getTime() + (5.5 * 60 - now.getTimezoneOffset()) * 60 * 1000);
    const day = ist.getDay();
    if (day === 0 || day === 6) return false;
    const minutes = ist.getHours() * 60 + ist.getMinutes();
    return minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30;
}

function normalizeQuote(q: any): Mover | null {
    if (!q) return null;
    const price = q.regularMarketPrice ?? null;
    if (price == null) return null;
    const previousClose = q.regularMarketPreviousClose ?? null;
    const change =
        q.regularMarketChange ?? (previousClose != null ? price - previousClose : 0);
    const changePercent =
        q.regularMarketChangePercent ??
        (previousClose ? (change / previousClose) * 100 : 0);
    return {
        symbol: String(q.symbol ?? '').replace('.NS', ''),
        name: q.shortName ?? q.longName ?? String(q.symbol ?? ''),
        price,
        change,
        changePercent,
        volume: q.regularMarketVolume ?? undefined,
    };
}

async function fetchCached(key: string, ttlSeconds: number, loader: () => Promise<any>): Promise<any> {
    const cached = await redisCache.get(key).catch(() => null);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            // fall through and refresh
        }
    }
    const fresh = await loader();
    await redisCache.set(key, JSON.stringify(fresh), ttlSeconds).catch(() => { /* best effort */ });
    return fresh;
}

export class EquityDashboardController {

    // GET /api/v1/equity-dashboard/market-overview
    public static async getMarketOverview(_req: Request, res: Response) {
        try {
            const data = await fetchCached('equity-dashboard:overview', UPCOMING_CACHE_TTL_SECONDS, async () => {
                // Indices strip
                // Indices strip - fetched per-symbol with allSettled so a single
                // invalid/renamed Yahoo symbol cannot zero the whole strip (e.g.
                // one missing index previously threw away NIFTY/SENSEX too).
                let indices: Array<{ name: string; value: number | null; change: number | null; changePercent: number | null; isPositive: boolean }> = [];
                const indexResults = await Promise.allSettled(
                    INDEX_TICKERS.map(async ({ name, symbol }) => {
                        const [quote] = await yahooFinance.quote([symbol], {
                            fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent'],
                        });
                        return { name, symbol, quote };
                    })
                );
                indices = indexResults.map((result) => {
                    if (result.status !== 'fulfilled' || !result.value.quote) {
                        return { name: result.status === 'fulfilled' ? result.value.name : 'Unknown', value: null, change: null, changePercent: null, isPositive: false };
                    }
                    const { name, quote: q } = result.value;
                    const change = q.regularMarketChange ?? null;
                    const changePercent = q.regularMarketChangePercent ?? null;
                    return {
                        name,
                        value: q.regularMarketPrice ?? null,
                        change: change != null ? Number(change) : null,
                        changePercent: changePercent != null ? Number(changePercent) : null,
                        isPositive: (changePercent ?? 0) >= 0,
                    };
                });

                // Movers from the curated universe
                const universeQuotes = await yahooFinance.quote(UNIVERSE_TICKERS);
                const movers = universeQuotes.map(normalizeQuote).filter(Boolean) as Mover[];
                const byGain = [...movers].sort((a, b) => b.changePercent - a.changePercent);

                const topGainers = byGain.slice(0, 3).map(m => ({
                    symbol: m.symbol, name: m.name, price: m.price, change: m.change, changePercent: m.changePercent,
                }));
                const topLosers = byGain.slice(-3).reverse().map(m => ({
                    symbol: m.symbol, name: m.name, price: m.price, change: m.change, changePercent: m.changePercent,
                }));

                const mostActive = [...movers]
                    .filter(m => m.volume != null)
                    // FIX: sort on raw volume numbers; formatting to "1.2Cr"/"80.0L"
                    // strings first breaks lexicographic ordering.
                    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
                    .slice(0, 3)
                    .map(m => ({ symbol: m.symbol, name: m.name, price: m.price, volume: formatVolume(m.volume) }))

                const high52Week = [...movers]
                    .sort((a, b) => b.changePercent - a.changePercent)
                    .slice(0, 2)
                    .map(m => ({ symbol: m.symbol, name: m.name, price: m.price }));

                return {
                    indices,
                    marketStatus: isMarketOpenIST() ? 'Open' : 'Closed',
                    topGainers,
                    topLosers,
                    mostActive,
                    high52Week,
                    dataSource: 'Yahoo Finance (NSE/BSE)',
                };
            });

            res.json({ success: true, data });
        } catch (error) {
            logger.error('[EquityDashboard] market-overview failed', error);
            res.status(500).json({ success: false, message: 'Failed to fetch live market overview' });
        }
    }

    // GET /api/v1/equity-dashboard/trending
    public static async getTrending(_req: Request, res: Response) {
        try {
            const data = await fetchCached('equity-dashboard:trending', UPCOMING_CACHE_TTL_SECONDS, async () => {
                const universeQuotes = await yahooFinance.quote(UNIVERSE_TICKERS);
                const movers = universeQuotes.map(normalizeQuote).filter(Boolean) as Mover[];
                const withCap = (m: Mover) => ({ ...m, marketCap: 'Live' });

                const byGain = [...movers].sort((a, b) => b.changePercent - a.changePercent);
                const mostBought = byGain.slice(0, 2).map(withCap);
                const mostTraded = [...movers]
                    .filter(m => m.volume != null)
                    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
                    .slice(0, 2)
                    .map(m => ({ ...withCap(m), volume: formatVolume(m.volume) }));
                const breakout = byGain
                    .filter(m => m.changePercent >= 5)
                    .slice(0, 2)
                    .map(withCap);

                return { mostBought, mostTraded, breakout, dataSource: 'Yahoo Finance (NSE/BSE)' };
            });

            res.json({ success: true, data });
        } catch (error) {
            logger.error('[EquityDashboard] trending failed', error);
            res.status(500).json({ success: false, message: 'Failed to fetch trending data' });
        }
    }

    // GET /api/v1/equity-dashboard/recommended
    public static async getRecommended(_req: Request, res: Response) {
        try {
            const data = await fetchCached('equity-dashboard:recommended', UPCOMING_CACHE_TTL_SECONDS, async () => {
                const candidates = ['ITC.NS', 'INFY.NS', 'LT.NS', 'TITAN.NS', 'TATAPOWER.NS'];
                const quotes = await yahooFinance.quote(candidates);
                const movers = quotes.map(normalizeQuote).filter(Boolean) as Mover[];

                // Rank by raw traded volume (numeric, deterministic liquidity score).
                // Reason text stays factual - it never claims personalized
                // suitability without profile data.
                const sorted = [...movers].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
                return sorted.map((m, index) => ({
                    id: `eq-${m.symbol.toLowerCase()}`,
                    symbol: m.symbol,
                    name: m.name,
                    price: m.price,
                    changePercent: m.changePercent,
                    marketCap: 'Live',
                    reason: 'High-liquidity NSE constituent',
                    matchScore: 100 - index * 5,
                }));
            });

            res.json({ success: true, data });
        } catch (error) {
            logger.error('[EquityDashboard] recommended failed', error);
            res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
        }
    }

    // GET /api/v1/equity-dashboard/portfolio
    public static async getPortfolio(req: Request, res: Response) {
        try {
            // FIX: always serve the authenticated user's real holdings. The
            // route is protected by authenticateToken (see
            // routes/equityDashboard.routes.ts).
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }

            const holdings = await PortfolioService.getHoldings(userId);
            if (!holdings || holdings.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        currentValue: 0,
                        investedAmount: 0,
                        totalReturns: 0,
                        absoluteReturns: 0,
                        holdingsCount: 0,
                        topHoldings: [],
                        sectorAllocation: [],
                    },
                });
            }

            let currentValue = 0;
            let investedAmount = 0;
            const topHoldings: Array<{ name: string; symbol?: string; value: number; returns: number }> = [];

            for (const h of holdings as any[]) {
                const value = Number(h.last_valuation) || 0;
                const cost = (Number(h.quantity) || 0) * (Number(h.average_price) || 0);
                currentValue += value;
                investedAmount += cost;
                topHoldings.push({
                    name: h.holding_metadata?.name || h.name || h.isin,
                    symbol: h.holding_metadata?.ticker,
                    value,
                    // returns% vs cost basis; 0 when cost is unknown (0/0-safe)
                    returns: cost > 0 ? ((value - cost) / cost) * 100 : 0,
                });
            }

            const totalReturns = currentValue - investedAmount;
            const absoluteReturns = investedAmount > 0 ? (totalReturns / investedAmount) * 100 : 0;

            // Day-level change and XIRR require historical price data per
            // holding, which is not yet synchronized; they are explicitly
            // reported as null rather than fabricated.
            return res.json({
                success: true,
                data: {
                    currentValue,
                    investedAmount,
                    totalReturns,
                    absoluteReturns,
                    holdingsCount: holdings.length,
                    topHoldings: topHoldings.sort((a, b) => b.value - a.value).slice(0, 3),
                    sectorAllocation: [],
                    todaysReturns: null,
                    todaysReturnsPercent: null,
                    xirr: null,
                },
            });
        } catch (error) {
            logger.error('[EquityDashboard] portfolio failed', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch portfolio' });
        }
    }

    // GET /api/v1/equity-dashboard/market-opportunities
    // EDITORIAL CONTENT (not user-specific data): setups/targets below are
    // hand-curated placeholders pending a licensed strategy feed. Kept
    // deliberately separate from live price endpoints.
    public static async getMarketOpportunities(_req: Request, res: Response) {
        try {
            const data = {
                intraday: [],
                swing: [],
                longTerm: [],
                _note: 'Curated opportunities require a licensed research feed; not currently available.',
            };
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET /api/v1/equity-dashboard/news
    // EDITORIAL CONTENT: requires a licensed news feed integration to be live.
    public static async getNews(_req: Request, res: Response) {
        try {
            const data = {
                items: [],
                _note: 'Live news feed integration pending licensed provider.',
            };
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET /api/v1/equity-dashboard/categories - navigation content only.
    public static async getCategories(_req: Request, res: Response) {
        try {
            const data = [
                { id: 'cat1', name: 'Large Cap', count: null, returnToday: null, icon: '🏢' },
                { id: 'cat2', name: 'Mid Cap', count: null, returnToday: null, icon: '🏭' },
                { id: 'cat3', name: 'Small Cap', count: null, returnToday: null, icon: '🚀' },
                { id: 'cat4', name: 'IT Sector', count: null, returnToday: null, icon: '💻' },
                { id: 'cat5', name: 'Banking', count: null, returnToday: null, icon: '🏦' },
                { id: 'cat6', name: 'Auto', count: null, returnToday: null, icon: '🚗' },
                { id: 'cat7', name: 'Pharma', count: null, returnToday: null, icon: '💊' },
                { id: 'cat8', name: 'Energy', count: null, returnToday: null, icon: '⚡' },
            ];
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
}
