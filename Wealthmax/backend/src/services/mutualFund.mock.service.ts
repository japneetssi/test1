export class MutualFundMockService {
    static async getCategories() {
        return [
            { id: 'c1', name: 'Large Cap', return: '18.4%', risk: 'Moderately High', count: 42, trending: true },
            { id: 'c2', name: 'Mid Cap', return: '24.2%', risk: 'High', count: 35, trending: true },
            { id: 'c3', name: 'Small Cap', return: '32.1%', risk: 'Very High', count: 28, trending: false },
            { id: 'c4', name: 'Flexi Cap', return: '20.5%', risk: 'High', count: 40, trending: true },
            { id: 'c5', name: 'ELSS', return: '19.8%', risk: 'High', count: 38, trending: false },
            { id: 'c6', name: 'Debt', return: '7.5%', risk: 'Low', count: 120, trending: false },
            { id: 'c7', name: 'Hybrid', return: '12.4%', risk: 'Moderate', count: 65, trending: false },
            { id: 'c8', name: 'International', return: '22.1%', risk: 'Very High', count: 20, trending: true },
            { id: 'c9', name: 'Gold', return: '14.2%', risk: 'Moderately High', count: 15, trending: true },
            { id: 'c10', name: 'Index Funds', return: '15.6%', risk: 'High', count: 45, trending: true },
        ];
    }

    static async getTrending() {
        return [
            { id: 't1', name: 'Parag Parikh Flexi Cap Fund', amc: 'PPFAS', category: 'Flexi Cap', risk: 'Very High', nav: 78.45, cagr1y: 28.5, cagr3y: 22.4, cagr5y: 20.1, minSip: 1000, rating: 5, aum: '60,450 Cr', expenseRatio: 0.65 },
            { id: 't2', name: 'Nippon India Small Cap Fund', amc: 'Nippon India', category: 'Small Cap', risk: 'Very High', nav: 145.2, cagr1y: 45.2, cagr3y: 35.8, cagr5y: 30.2, minSip: 500, rating: 4, aum: '45,230 Cr', expenseRatio: 0.72 },
            { id: 't3', name: 'Quant Active Fund', amc: 'Quant', category: 'Multi Cap', risk: 'Very High', nav: 564.3, cagr1y: 38.4, cagr3y: 28.9, cagr5y: 26.5, minSip: 1000, rating: 5, aum: '12,400 Cr', expenseRatio: 0.58 },
            { id: 't4', name: 'HDFC Mid-Cap Opportunities Fund', amc: 'HDFC', category: 'Mid Cap', risk: 'Very High', nav: 182.4, cagr1y: 42.1, cagr3y: 29.5, cagr5y: 24.8, minSip: 500, rating: 4, aum: '65,800 Cr', expenseRatio: 0.81 },
            { id: 't5', name: 'SBI Large & Midcap Fund', amc: 'SBI', category: 'Large & Mid Cap', risk: 'Very High', nav: 452.1, cagr1y: 32.5, cagr3y: 24.1, cagr5y: 20.5, minSip: 500, rating: 4, aum: '22,500 Cr', expenseRatio: 0.75 },
        ];
    }

    static async getRecommended(riskProfile: string) {
        return [
            { id: 'r1', name: 'ICICI Prudential Bluechip Fund', amc: 'ICICI Prudential', category: 'Large Cap', risk: 'Very High', nav: 98.5, cagr1y: 24.5, cagr3y: 18.2, cagr5y: 16.5, minSip: 100, rating: 5, aum: '45,000 Cr', expenseRatio: 0.9, reason: 'Stable growth matching your profile' },
            { id: 'r2', name: 'Mirae Asset Emerging Bluechip Fund', amc: 'Mirae Asset', category: 'Large & Mid Cap', risk: 'Very High', nav: 125.4, cagr1y: 30.2, cagr3y: 22.5, cagr5y: 21.0, minSip: 1000, rating: 5, aum: '32,100 Cr', expenseRatio: 0.68, reason: 'High growth potential' },
            { id: 'r3', name: 'Kotak Equity Arbitrage Fund', amc: 'Kotak', category: 'Arbitrage', risk: 'Low', nav: 34.2, cagr1y: 8.5, cagr3y: 6.8, cagr5y: 6.5, minSip: 500, rating: 4, aum: '28,000 Cr', expenseRatio: 0.45, reason: 'Low volatility, stable returns' }
        ];
    }

    static async getTopCollections() {
        return [
            { id: 'col1', title: 'Best SIP Funds', subtitle: 'Consistent performers for monthly SIPs', fundCount: 12, icon: '📈' },
            { id: 'col2', title: 'High Growth Funds', subtitle: 'Aggressive funds for maximum returns', fundCount: 8, icon: '🚀' },
            { id: 'col3', title: 'Tax Saving (ELSS)', subtitle: 'Save tax under section 80C', fundCount: 15, icon: '🛡️' },
            { id: 'col4', title: 'Low Risk Funds', subtitle: 'Stable returns with lower volatility', fundCount: 20, icon: '📉' },
            { id: 'col5', title: 'Best for Beginners', subtitle: 'Handpicked funds to start your journey', fundCount: 5, icon: '🌱' },
            { id: 'col6', title: 'Index Funds', subtitle: 'Low cost market tracking funds', fundCount: 18, icon: '📊' },
        ];
    }

    static async getNews() {
        return [
            { id: 'n1', title: 'SEBI mandates new disclosure norms for AMC expenses', date: '2 hours ago', source: 'LiveMint', category: 'SEBI Updates' },
            { id: 'n2', title: 'HDFC AMC launches new Defence Fund NFO', date: '5 hours ago', source: 'Economic Times', category: 'NFO Launches' },
            { id: 'n3', title: 'Small Cap funds see record inflows in Q2', date: '1 day ago', source: 'MoneyControl', category: 'Market Trends' },
            { id: 'n4', title: 'Sankaran Naren comments on current market valuations', date: '2 days ago', source: 'CNBC TV18', category: 'Fund Manager Insights' },
        ];
    }

    static async getPortfolioInsights() {
        return {
            currentValue: 845230,
            investedAmount: 620000,
            totalReturns: 225230,
            absoluteReturns: 36.32,
            xirr: 18.5,
            todaysReturns: 4520,
            todaysReturnsPercent: 0.54,
            allocation: {
                equity: 75,
                debt: 20,
                gold: 5
            },
            topHoldings: [
                { name: 'Parag Parikh Flexi Cap', value: 250000, returns: 45.2 },
                { name: 'Nippon India Small Cap', value: 180000, returns: 62.4 },
                { name: 'HDFC Balanced Advantage', value: 150000, returns: 22.1 }
            ]
        };
    }
}
