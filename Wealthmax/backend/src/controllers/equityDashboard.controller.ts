import { Request, Response } from 'express';

export class EquityDashboardController {
    
    // GET /api/v1/equity-dashboard/market-overview
    public static async getMarketOverview(req: Request, res: Response) {
        try {
            const data = {
                indices: [
                    { name: 'NIFTY 50', value: 24320.15, change: 115.40, changePercent: 0.48, isPositive: true },
                    { name: 'SENSEX', value: 80112.55, change: 350.25, changePercent: 0.44, isPositive: true },
                    { name: 'BANK NIFTY', value: 52400.10, change: -120.30, changePercent: -0.23, isPositive: false },
                    { name: 'MIDCAP 100', value: 57120.50, change: 450.80, changePercent: 0.80, isPositive: true },
                    { name: 'SMALLCAP 100', value: 18560.20, change: 185.10, changePercent: 1.01, isPositive: true },
                    { name: 'India VIX', value: 14.20, change: -0.45, changePercent: -3.07, isPositive: false },
                    { name: 'USD/INR', value: 83.55, change: 0.05, changePercent: 0.06, isPositive: true },
                    { name: 'Gold', value: 74200.00, change: 250.00, changePercent: 0.34, isPositive: true }
                ],
                marketStatus: 'Open',
                topGainers: [
                    { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4120.50, change: 120.50, changePercent: 3.01 },
                    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 3120.80, change: 85.20, changePercent: 2.80 },
                    { symbol: 'INFY', name: 'Infosys', price: 1650.20, change: 42.10, changePercent: 2.62 }
                ],
                topLosers: [
                    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1620.40, change: -25.60, changePercent: -1.55 },
                    { symbol: 'SBIN', name: 'State Bank of India', price: 840.10, change: -12.40, changePercent: -1.45 },
                    { symbol: 'ITC', name: 'ITC Ltd', price: 430.50, change: -4.20, changePercent: -0.96 }
                ],
                mostActive: [
                    { symbol: 'ZOMATO', name: 'Zomato Ltd', price: 215.40, volume: '4.5Cr' },
                    { symbol: 'YESBANK', name: 'Yes Bank', price: 24.50, volume: '12.1Cr' }
                ],
                high52Week: [
                    { symbol: 'HAL', name: 'Hindustan Aeronautics', price: 5420.10 },
                    { symbol: 'BHEL', name: 'Bharat Heavy Electricals', price: 315.60 }
                ]
            };
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET /api/v1/equity-dashboard/categories
    public static async getCategories(req: Request, res: Response) {
        try {
            const data = [
                { id: 'cat1', name: 'Large Cap', count: 100, returnToday: '0.45%', icon: '🏢' },
                { id: 'cat2', name: 'Mid Cap', count: 150, returnToday: '0.85%', icon: '🏭' },
                { id: 'cat3', name: 'Small Cap', count: 250, returnToday: '1.20%', icon: '🚀' },
                { id: 'cat4', name: 'IT Sector', count: 45, returnToday: '2.10%', icon: '💻' },
                { id: 'cat5', name: 'Banking', count: 38, returnToday: '-0.50%', icon: '🏦' },
                { id: 'cat6', name: 'Auto', count: 32, returnToday: '0.75%', icon: '🚗' },
                { id: 'cat7', name: 'Pharma', count: 48, returnToday: '0.20%', icon: '💊' },
                { id: 'cat8', name: 'Energy', count: 25, returnToday: '1.15%', icon: '⚡' }
            ];
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET /api/v1/equity-dashboard/trending
    public static async getTrending(req: Request, res: Response) {
        try {
            const data = {
                mostBought: [
                    { id: 'eq-tcs', symbol: 'TCS', name: 'Tata Consultancy Services', price: 4120.50, change: 120.50, changePercent: 3.01, marketCap: '14.5L Cr' },
                    { id: 'eq-zomato', symbol: 'ZOMATO', name: 'Zomato Ltd', price: 215.40, change: 8.20, changePercent: 3.96, marketCap: '1.8L Cr' }
                ],
                mostTraded: [
                    { id: 'eq-hdfc', symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1620.40, change: -25.60, changePercent: -1.55, marketCap: '12.4L Cr' },
                    { id: 'eq-reliance', symbol: 'RELIANCE', name: 'Reliance Industries', price: 3120.80, change: 85.20, changePercent: 2.80, marketCap: '21.1L Cr' }
                ],
                breakout: [
                    { id: 'eq-rvnl', symbol: 'RVNL', name: 'Rail Vikas Nigam', price: 420.50, change: 40.10, changePercent: 10.54, marketCap: '87K Cr' },
                    { id: 'eq-ireda', symbol: 'IREDA', name: 'Indian Renewable Energy', price: 195.20, change: 9.20, changePercent: 4.95, marketCap: '52K Cr' }
                ]
            };
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET /api/v1/equity-dashboard/recommended
    public static async getRecommended(req: Request, res: Response) {
        try {
            const data = [
                { id: 'eq-itc', symbol: 'ITC', name: 'ITC Ltd', price: 430.50, changePercent: -0.96, marketCap: '5.4L Cr', reason: 'High Dividend Yield, Matches your defensive profile', matchScore: 92 },
                { id: 'eq-infosys', symbol: 'INFY', name: 'Infosys', price: 1650.20, changePercent: 2.62, marketCap: '6.8L Cr', reason: 'Undervalued IT pick, good for long term', matchScore: 88 },
                { id: 'eq-lt', symbol: 'LT', name: 'Larsen & Toubro', price: 3580.40, changePercent: 1.25, marketCap: '4.9L Cr', reason: 'Strong infrastructure growth theme', matchScore: 85 }
            ];
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET /api/v1/equity-dashboard/market-opportunities
    public static async getMarketOpportunities(req: Request, res: Response) {
        try {
            const data = {
                intraday: [
                    { symbol: 'TATASTEEL', target: 180, stopLoss: 165, current: 172.50, action: 'BUY' },
                    { symbol: 'M&M', target: 3000, stopLoss: 2850, current: 2910.20, action: 'BUY' }
                ],
                swing: [
                    { symbol: 'BHEL', timeframe: '1-2 Weeks', potentialReturn: '8-12%', current: 315.60, setup: 'Cup and Handle Breakout' },
                    { symbol: 'CDSL', timeframe: '2-4 Weeks', potentialReturn: '15-20%', current: 2450.80, setup: 'Moving Average Support' }
                ],
                longTerm: [
                    { symbol: 'HDFCBANK', thesis: 'Currently undervalued compared to historical PB. Merger synergies to play out over next 2 years.', current: 1620.40 },
                    { symbol: 'RELIANCE', thesis: 'Retail and Jio monetization unlocking value. New energy capex to drive next decade growth.', current: 3120.80 }
                ]
            };
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET /api/v1/equity-dashboard/news
    public static async getNews(req: Request, res: Response) {
        try {
            const data = [
                { id: 'n1', title: 'TCS beats street estimates, reports 9% YoY PAT growth', time: '10 mins ago', source: 'CNBC TV18', type: 'Earnings', impact: 'Positive' },
                { id: 'n2', title: 'HDFC Bank management commentary on NIMs worries investors', time: '1 hour ago', source: 'ET Now', type: 'Corporate', impact: 'Negative' },
                { id: 'n3', title: 'Government likely to increase capital outlay for railways', time: '2 hours ago', source: 'Moneycontrol', type: 'Macro', impact: 'Positive' },
                { id: 'n4', title: 'Vedanta announces ₹20/share interim dividend', time: '3 hours ago', source: 'BSE', type: 'Corporate Action', impact: 'Positive' }
            ];
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }

    // GET /api/v1/equity-dashboard/portfolio
    public static async getPortfolio(req: Request, res: Response) {
        try {
            const data = {
                currentValue: 1254300.50,
                investedAmount: 980000.00,
                totalReturns: 274300.50,
                absoluteReturns: 27.98,
                xirr: 22.4,
                todaysReturns: 12500.40,
                todaysReturnsPercent: 1.01,
                topHoldings: [
                    { symbol: 'RELIANCE', value: 250000, returns: 45.2 },
                    { symbol: 'TCS', value: 180000, returns: 32.4 },
                    { symbol: 'HDFCBANK', value: 150000, returns: 5.1 }
                ],
                sectorAllocation: [
                    { name: 'Financials', value: 35, color: '#00458c' },
                    { name: 'IT', value: 25, color: '#10b981' },
                    { name: 'Energy', value: 20, color: '#f59e0b' },
                    { name: 'Others', value: 20, color: '#8b5cf6' }
                ],
                diversificationScore: 85,
                riskScore: 'Moderate'
            };
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
}
