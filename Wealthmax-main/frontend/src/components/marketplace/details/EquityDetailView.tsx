import React, { useState, useEffect } from 'react';
import { ExtendedEquityProduct } from '@/types/equity';
import { EquityHeader } from './equity/EquityHeader';
import { InteractivePriceChart } from './equity/InteractivePriceChart';
import { LiveMarketData } from './equity/LiveMarketData';
import { TechnicalAndPerformance } from './equity/TechnicalAndPerformance';
import { FundamentalsGrid } from './equity/FundamentalsGrid';
import { FinancialStatementsView } from './equity/FinancialStatements';
import {
    ShareholdingView,
    CorporateActionsView,
    NewsAndInsightsView,
    CompanyOverviewView
} from './equity/AdditionalSections';

interface Props {
    product: any;
    history: any[];
}

const API_BASE = 'https://wealthmax-og-backend.onrender.com/api/v1/marketplace/equity';

const fmt = (n: number | null | undefined, decimals = 2) =>
    n != null ? parseFloat(n.toFixed(decimals)) : null;

const fmtCr = (n: number | null | undefined) => {
    if (n == null) return null;
    if (n >= 1e12) return `₹${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `₹${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
    return `₹${n.toFixed(2)}`;
};

export const EquityDetailView: React.FC<Props> = ({ product, history }) => {
    const productId = product.id as string;

    // --- State for all API modules ---
    const [marketData, setMarketData] = useState<any>(null);
    const [valuation, setValuation] = useState<any>(null);
    const [financials, setFinancials] = useState<any>(null);
    const [shareholding, setShareholding] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [newsData, setNewsData] = useState<any[] | null>(null);
    const [insightsData, setInsightsData] = useState<any>(null);
    const [companyProfile, setCompanyProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        if (!productId) return;

        const fetchAll = async () => {
            setLoading(true);
            try {
                const [mdRes, valRes, finRes, shRes, perfRes, newsRes, companyRes, insightsRes] = await Promise.allSettled([
                    fetch(`${API_BASE}/${productId}/market-data`).then(r => r.json()),
                    fetch(`${API_BASE}/${productId}/valuation`).then(r => r.json()),
                    fetch(`${API_BASE}/${productId}/financials`).then(r => r.json()),
                    fetch(`${API_BASE}/${productId}/shareholding`).then(r => r.json()),
                    fetch(`${API_BASE}/${productId}/performance`).then(r => r.json()),
                    fetch(`${API_BASE}/${productId}/news`).then(r => r.json()),
                    fetch(`${API_BASE}/${productId}/company`).then(r => r.json()),
                    fetch(`${API_BASE}/${productId}/insights`).then(r => r.json()),
                ]);

                if (mdRes.status === 'fulfilled' && mdRes.value?.success) setMarketData(mdRes.value.data);
                if (valRes.status === 'fulfilled' && valRes.value?.success) setValuation(valRes.value.data);
                if (finRes.status === 'fulfilled' && finRes.value?.success) setFinancials(finRes.value.data);
                if (shRes.status === 'fulfilled' && shRes.value?.success) setShareholding(shRes.value.data);
                if (perfRes.status === 'fulfilled' && perfRes.value?.success) setPerformance(perfRes.value.data);
                if (newsRes.status === 'fulfilled' && newsRes.value?.success) setNewsData(newsRes.value.data);
                if (companyRes.status === 'fulfilled' && companyRes.value?.success) setCompanyProfile(companyRes.value.data);
                if (insightsRes.status === 'fulfilled' && insightsRes.value?.success) setInsightsData(insightsRes.value.data);
                setLastUpdated(new Date().toISOString());
            } catch (e) {
                console.error('Error fetching equity data:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        // Refresh market data every 60 seconds
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/${productId}/market-data`).then(r => r.json());
                if (res.success) { setMarketData(res.data); setLastUpdated(new Date().toISOString()); }
            } catch (_) {}
        }, 60000);

        return () => clearInterval(interval);
    }, [productId]);

    // --- Compose liveData from API response (fallback to product props) ---
    const liveDataComposed = {
        currentPrice: marketData?.currentPrice || product.nav || product.stats?.nav,
        previousClose: marketData?.previousClose || product.previousClose,
        open: marketData?.open || product.open,
        high: marketData?.dayHigh || product.dayHigh,
        low: marketData?.dayLow || product.dayLow,
        volume: marketData?.volume || product.volume,
        averageVolume: marketData?.averageVolume || product.averageVolume,
        week52High: marketData?.week52High || product.week52High,
        week52Low: marketData?.week52Low || product.week52Low,
        vwap: marketData?.vwap,
        upperCircuit: marketData?.upperCircuit,
        lowerCircuit: marketData?.lowerCircuit,
        circuitSource: marketData?.circuitSource,
        marketCap: marketData?.marketCap || product.marketCap,
    };

    // --- Compose fundamentals from API response ---
    const fundamentalsComposed = {
        marketCap: fmtCr(marketData?.marketCap) || product.marketCap,
        enterpriseValue: valuation?.enterpriseValue ? fmtCr(valuation.enterpriseValue) : null,
        peRatio: fmt(valuation?.trailingPE) || product.peRatio,
        forwardPe: fmt(valuation?.forwardPE),
        pbRatio: fmt(valuation?.priceToBook) || product.pbRatio,
        industryPE: valuation?.industryPE,
        eps: fmt(financials?.eps) || product.eps,
        bookValue: fmt(valuation?.bookValue),
        faceValue: financials?.faceValue,
        dividendYield: fmt(financials?.dividendYield),
        roe: fmt(financials?.roe),
        roce: fmt(financials?.roce),
        roa: fmt(financials?.roa),
        debtToEquity: fmt(financials?.debtToEquity),
        dividendPayout: fmt(financials?.dividendPayout),
        currentRatio: fmt(financials?.currentRatio),
        quickRatio: fmt(financials?.quickRatio),
        interestCoverage: financials?.interestCoverage,
        netProfitMargin: fmt(financials?.netProfitMargin),
        operatingMargin: fmt(financials?.operatingMargin),
    };

    // --- Compose performance from API response ---
    const performanceComposed = {
        todayReturn: fmt(performance?.return1D),
        weeklyReturn: fmt(performance?.return1W),
        monthlyReturn: fmt(performance?.return1M),
        threeMonthReturn: fmt(performance?.return3M),
        sixMonthReturn: fmt(performance?.return6M),
        ytdReturn: null,
        oneYearReturn: fmt(performance?.return1Y),
        threeYearCAGR: fmt(performance?.cagr3Y),
        fiveYearCAGR: fmt(performance?.cagr5Y),
    };

    // --- Compose shareholding ---
    const shareholdingComposed = shareholding ? {
        promoters: fmt(shareholding.promoters),
        institutions: fmt(shareholding.institutions),
        retail: fmt(shareholding.retail),
        fii: shareholding.fii,
        dii: shareholding.dii,
        mutualFunds: shareholding.mutualFunds,
    } : undefined;

    const extendedData: ExtendedEquityProduct = {
        ...product,
        liveData: liveDataComposed,
        performance: performanceComposed,
        fundamentals: fundamentalsComposed,
        financials: undefined,
        shareholding: shareholdingComposed,
        corporateActions: undefined,
        news: newsData || undefined,
        overview: companyProfile || undefined,
        risk: undefined,
        aiInsights: insightsData || undefined
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-20">
            {/* Last Updated Bar */}
            {lastUpdated && (
                <div className="flex items-center justify-end gap-2 mb-2 px-1">
                    <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                    <span className="text-xs text-gray-400">
                        {loading ? 'Refreshing...' : `Live • Updated ${new Date(lastUpdated).toLocaleTimeString()}`}
                    </span>
                </div>
            )}

            {/* Header Section */}
            <EquityHeader product={product} extendedData={extendedData} />

            {/* Top Tier: Chart & Live Market Data */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2">
                    <InteractivePriceChart history={history} productId={product.id} />
                </div>
                <div className="xl:col-span-1">
                    <LiveMarketData data={extendedData.liveData} loading={loading} />
                </div>
            </div>

            {/* Second Tier: Fundamentals & Technicals */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2">
                    <FundamentalsGrid product={product} fundamentals={extendedData.fundamentals} loading={loading} />
                </div>
                <div className="xl:col-span-1">
                    <TechnicalAndPerformance performance={extendedData.performance} loading={loading} />
                </div>
            </div>

            {/* Third Tier: Financial Statements */}
            <FinancialStatementsView financials={extendedData.financials} />

            {/* Fourth Tier: Shareholding & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ShareholdingView data={extendedData.shareholding} loading={loading} />
                <CorporateActionsView actions={extendedData.corporateActions} />
            </div>

            {/* Fifth Tier: News & AI */}
            <NewsAndInsightsView news={extendedData.news} insights={extendedData.aiInsights} loading={loading} />

            {/* Bottom Tier: Company Overview */}
            <CompanyOverviewView overview={extendedData.overview} loading={loading} />
        </div>
    );
};
