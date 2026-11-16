import db from '../config/database';
import YahooFinance from 'yahoo-finance2';
import NodeCache from 'node-cache';
import { MarketplaceDiscoveryService } from './marketplace-discovery.service';

const yahooFinance = new YahooFinance();
const dashboardCache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

export class MarketplaceDashboardService {
    
    static async getDashboardData(userId?: string) {
        const cacheKey = `dashboard_${userId || 'guest'}`;
        const cached = dashboardCache.get(cacheKey);
        if (cached) return cached;

        try {
            const [
                marketSnapshot,
                categories,
                trending,
                opportunities,
                news
            ] = await Promise.all([
                this.getMarketSnapshot(),
                this.getExploreCategories(),
                this.getTrendingProducts(),
                this.getOpportunities(),
                this.getMarketIntelligence()
            ]);

            const dashboardData = {
                header: this.getMockHeader(userId),
                marketSnapshot,
                quickActions: this.getQuickActions(),
                continueWhereYouLeftOff: this.getContinueWhereYouLeftOff(),
                exploreCategories: categories,
                trendingAcrossWealthMax: trending,
                recommendedForYou: this.getRecommendedForYou(),
                todaysOpportunities: opportunities,
                marketIntelligence: news,
                financialHealth: this.getMockFinancialHealth(),
                calculators: this.getCalculators(),
                learningCentre: this.getLearningCentre()
            };

            dashboardCache.set(cacheKey, dashboardData);
            return dashboardData;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw new Error('Failed to load dashboard data');
        }
    }

    private static getMockHeader(userId?: string) {
        return {
            greeting: 'Good Morning',
            userName: userId ? 'Kunal' : 'Guest', // Hardcoded mock for now
            portfolioValue: '₹14,25,430',
            todaysGainLoss: { amount: '+₹12,450', percentage: '+0.88%', isPositive: true },
            netWorth: '₹28,50,000',
            investmentScore: 840,
            notificationsCount: 3
        };
    }

    private static async getMarketSnapshot() {
        const symbols = ['^NSEI', '^BSESN', '^NSEBANK', '^CNXSC', 'GC=F', 'INR=X'];
        try {
            const quotes = await yahooFinance.quote(symbols);
            return quotes.map((q: any) => ({
                symbol: q.symbol,
                name: q.shortName || q.symbol,
                price: q.regularMarketPrice,
                change: q.regularMarketChange,
                changePercent: q.regularMarketChangePercent,
                isPositive: q.regularMarketChange >= 0
            }));
        } catch (e) {
            console.error('Error fetching market snapshot:', e);
            return [
                { name: 'NIFTY 50', price: 24500.50, change: 120.40, changePercent: 0.49, isPositive: true },
                { name: 'SENSEX', price: 80500.10, change: 350.20, changePercent: 0.44, isPositive: true },
                { name: 'BANK NIFTY', price: 52100.00, change: -150.50, changePercent: -0.28, isPositive: false }
            ];
        }
    }

    private static getQuickActions() {
        return [
            { id: 'invest', title: 'Invest Now', icon: 'TrendingUp', color: 'blue' },
            { id: 'sip', title: 'Start SIP', icon: 'CalendarDays', color: 'emerald' },
            { id: 'stocks', title: 'Buy Stocks', icon: 'BarChart3', color: 'purple' },
            { id: 'compare', title: 'Compare Funds', icon: 'ArrowLeftRight', color: 'orange' },
            { id: 'goals', title: 'Goal Planning', icon: 'Target', color: 'rose' },
            { id: 'calc', title: 'Financial Calculator', icon: 'Calculator', color: 'indigo' },
            { id: 'tax', title: 'Tax Planning', icon: 'Landmark', color: 'cyan' },
            { id: 'insurance', title: 'Insurance Advisor', icon: 'ShieldCheck', color: 'pink' }
        ];
    }

    private static getContinueWhereYouLeftOff() {
        return [
            { id: 'mf-120503', type: 'Recently Viewed', name: 'Quant Small Cap Fund', category: 'MF', timestamp: '2 hours ago' },
            { id: 'iifl-2885', type: 'Watchlist', name: 'RELIANCE', category: 'Equity', timestamp: '5 hours ago' },
            { id: 'search', type: 'Last Search', name: 'HDFC Bank', category: 'Search', timestamp: '1 day ago' }
        ];
    }

    private static async getExploreCategories() {
        try {
            return await MarketplaceDiscoveryService.getCategories();
        } catch (e) {
            return [];
        }
    }

    private static async getTrendingProducts() {
        try {
            // Get top 5 MFs
            const mfRes = await db.query(`
                SELECT s.scheme_code, s.scheme_name, s.cagr_3y, s.latest_nav, s.risk_level, a.name as amc_name
                FROM mf_schemes s
                LEFT JOIN mf_amcs a ON s.amc_id = a.id
                WHERE s.cagr_3y IS NOT NULL
                ORDER BY s.cagr_3y DESC NULLS LAST
                LIMIT 5
            `);
            
            // Get top 5 Equity
            const eqRes = await db.query(`
                SELECT instrument_id, formatted_name, exchange, trading_symbol
                FROM iifl_instruments
                WHERE exchange IN ('NSEEQ', 'BSEEQ')
                LIMIT 5
            `);

            return {
                mutualFunds: mfRes.rows.map((r: any) => ({
                    id: `mf-${r.scheme_code}`,
                    name: r.scheme_name,
                    category: 'MF',
                    return: `${r.cagr_3y}%`,
                    risk: r.risk_level || 'Aggressive',
                    amc: r.amc_name
                })),
                stocks: eqRes.rows.map((r: any) => ({
                    id: `iifl-${r.instrument_id}`,
                    name: r.formatted_name,
                    category: 'Equity',
                    return: 'N/A', 
                    risk: 'Aggressive',
                    amc: r.exchange
                })),
                insurance: [],
                loans: [],
                fd: []
            };
        } catch (e) {
            console.error('Error fetching trending:', e);
            return { mutualFunds: [], stocks: [], insurance: [], loans: [], fd: [] };
        }
    }

    private static getRecommendedForYou() {
        return [
            {
                id: 'mf-118834',
                name: 'Parag Parikh Flexi Cap Fund',
                category: 'MF',
                reason: 'Matches your Aggressive risk profile and adds US equity diversification.',
                matchScore: 94
            },
            {
                id: 'iifl-3456',
                name: 'TCS',
                category: 'Equity',
                reason: 'Blue-chip IT stock to stabilize your mid-cap heavy portfolio.',
                matchScore: 88
            }
        ];
    }

    private static async getOpportunities() {
        return {
            topSIPs: [
                { id: 'mf-120503', name: 'Quant Small Cap Fund', cagr3y: '45.2%' },
                { id: 'mf-119062', name: 'Nippon India Small Cap', cagr3y: '38.1%' }
            ],
            highReturn: [
                { id: 'iifl-1234', name: 'Zomato', category: 'Equity' },
                { id: 'mf-147852', name: 'Motilal Oswal Midcap', category: 'MF' }
            ],
            taxSaving: [
                { id: 'mf-119365', name: 'Mirae Asset Tax Saver', category: 'ELSS' }
            ]
        };
    }

    private static async getMarketIntelligence() {
        try {
            const result = await yahooFinance.search('Indian Stock Market', { newsCount: 5 });
            if (result.news && result.news.length > 0) {
                return result.news.map((item: any) => ({
                    title: item.title,
                    publisher: item.publisher,
                    link: item.link,
                    providerPublishTime: item.providerPublishTime,
                    type: item.type
                }));
            }
            return [];
        } catch (e) {
            console.error('Error fetching market intelligence:', e);
            return [];
        }
    }

    private static getMockFinancialHealth() {
        return {
            riskScore: 75,
            healthStatus: 'Excellent',
            assetAllocation: [
                { name: 'Equity', value: 65, color: '#00458c' },
                { name: 'Debt', value: 25, color: '#10b981' },
                { name: 'Gold', value: 10, color: '#f59e0b' }
            ],
            emergencyFund: { current: '₹3,00,000', target: '₹5,00,000', progress: 60 },
            insuranceCoverage: { current: '₹50L', recommended: '₹1Cr', status: 'Underinsured' }
        };
    }

    private static getCalculators() {
        return [
            { id: 'sip', name: 'SIP Calculator', icon: 'TrendingUp' },
            { id: 'lumpsum', name: 'Lumpsum Calculator', icon: 'Coins' },
            { id: 'emi', name: 'EMI Calculator', icon: 'Home' },
            { id: 'retirement', name: 'Retirement Planner', icon: 'Palmtree' }
        ];
    }

    private static getLearningCentre() {
        return [
            { title: 'Understanding Mutual Funds', category: 'Beginner Guide', readTime: '5 min' },
            { title: 'How to build a resilient portfolio', category: 'Advanced Strategy', readTime: '8 min' },
            { title: 'Tax Planning for 2026', category: 'Tax', readTime: '4 min' }
        ];
    }
}
