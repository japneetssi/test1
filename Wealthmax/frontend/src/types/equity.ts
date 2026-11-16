export interface LiveMarketData {
    currentPrice: number | null;
    absoluteChange: number | null;
    percentageChange: number | null;
    previousClose: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    week52High: number | null;
    week52Low: number | null;
    volume: number | null;
    averageVolume: number | null;
    vwap: number | null;
    bidPrice: number | null;
    askPrice: number | null;
    marketDepth: {
        buyers: { price: number; qty: number }[];
        sellers: { price: number; qty: number }[];
    };
    lowerCircuit: number | null;
    upperCircuit: number | null;
    marketCap: number | string | null;
    enterpriseValue: number | string | null;
    freeFloatMarketCap: number | string | null;
}

export interface PerformanceMetrics {
    todayReturn: number | null;
    weeklyReturn: number | null;
    monthlyReturn: number | null;
    threeMonthReturn: number | null;
    sixMonthReturn: number | null;
    ytdReturn: number | null;
    oneYearReturn: number | null;
    threeYearCAGR: number | null;
    fiveYearCAGR: number | null;
    sinceListingReturn: number | null;
}

export interface Fundamentals {
    marketCap: string | null;
    enterpriseValue: string | null;
    peRatio: number | null;
    forwardPe: number | null;
    pbRatio: number | null;
    eps: number | null;
    bookValue: number | null;
    faceValue: number | null;
    dividendYield: number | null;
    dividendPayout: number | null;
    roe: number | null;
    roce: number | null;
    roa: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    quickRatio: number | null;
    interestCoverage: number | null;
    netProfitMargin: number | null;
    operatingMargin: number | null;
    ebitdaMargin: number | null;
    cashFlow: string | null;
    freeCashFlow: string | null;
}

export interface FinancialPeriod {
    period: string; // e.g., 'Q1 2024', 'FY 2023'
    revenue: number;
    operatingIncome: number;
    ebitda: number;
    pat: number;
    eps: number;
}

export interface BalanceSheetPeriod {
    period: string;
    assets: number;
    liabilities: number;
    equity: number;
    debt: number;
    cash: number;
}

export interface CashFlowPeriod {
    period: string;
    operating: number;
    investing: number;
    financing: number;
    freeCashFlow: number;
}

export interface FinancialStatements {
    quarterly: {
        incomeStatement: FinancialPeriod[];
        balanceSheet: BalanceSheetPeriod[];
        cashFlow: CashFlowPeriod[];
    };
    yearly: {
        incomeStatement: FinancialPeriod[];
        balanceSheet: BalanceSheetPeriod[];
        cashFlow: CashFlowPeriod[];
    };
}

export interface ShareholdingPattern {
    quarters: string[];
    promoters: number[];
    fii: number[];
    dii: number[];
    mutualFunds: number[];
    retail: number[];
    others: number[];
}

export interface CorporateAction {
    id: string;
    type: 'Dividend' | 'Bonus' | 'Split' | 'Rights' | 'Buyback' | 'Results' | 'AGM' | 'Board Meeting';
    date: string;
    description: string;
}

export interface NewsArticle {
    id: string;
    thumbnail?: string;
    headline: string;
    source: string;
    publishedTime: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export interface AnalystRatings {
    buy: number;
    hold: number;
    sell: number;
    consensusTargetPrice: number;
    upsidePct: number;
}

export interface Peer {
    symbol: string;
    name: string;
    marketCap: string;
    pe: number;
    roe: number;
    roce: number;
    revenue: string;
    profit: string;
    eps: number;
    dividendYield: number;
    pricePerformance1Y: number;
}

export interface FundHolding {
    fundName: string;
    holdingPct: number;
    value: string;
    latestChange: number; // positive or negative
}

export interface InstitutionalHoldings {
    fii: string; // e.g. '12.4%'
    dii: string;
    insuranceCompanies: string;
    pensionFunds: string;
}

export interface CompanyOverview {
    businessDescription: string;
    productsAndServices: string[];
    sector: string;
    industry: string;
    ceo: string;
    chairman: string;
    headquarters: string;
    founded: string;
    employees: string;
    website: string;
}

export interface RiskAnalysis {
    volatility: 'Low' | 'Medium' | 'High';
    beta: number;
    sharpeRatio: number;
    alpha: number;
    maxDrawdown: number;
    riskScore: number; // out of 100
    esgScore: number | null;
}

export interface AIInsights {
    companyOverview: string;
    financialHealth: string;
    technicalOutlook: string;
    valuationAnalysis: string;
    risks: string;
    growthOpportunities: string;
}

export interface UserPortfolioItem {
    quantityHeld: number;
    averageBuyPrice: number;
    currentValue: number;
    profitOrLoss: number;
    profitOrLossPct: number;
    xirr: number | null;
    portfolioAllocation: number;
}

export interface ExtendedEquityProduct {
    id: string;
    name: string;
    symbol: string;
    exchange: 'NSE' | 'BSE';
    logoUrl?: string;
    industry?: string;
    liveData?: LiveMarketData;
    performance?: PerformanceMetrics;
    fundamentals?: Fundamentals;
    financials?: FinancialStatements;
    shareholding?: ShareholdingPattern;
    corporateActions?: CorporateAction[];
    news?: NewsArticle[];
    analystRatings?: AnalystRatings;
    peers?: Peer[];
    mutualFundHoldings?: FundHolding[];
    institutionalHoldings?: InstitutionalHoldings;
    overview?: CompanyOverview;
    risk?: RiskAnalysis;
    aiInsights?: AIInsights;
    relatedStocks?: Peer[]; // Simplified to reuse Peer structure for related stocks
    userPortfolio?: UserPortfolioItem;
    isInWatchlist?: boolean;
}
