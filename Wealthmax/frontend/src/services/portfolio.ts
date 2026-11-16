import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Holding {
    id: string;
    scrip_name: string;
    asset_type: 'MUTUAL_FUND' | 'EQUITY' | 'GOLD' | 'DEBT' | string;
    quantity: number;
    avg_price: number;
    current_nav: number;
    haircut: number;
    status: 'free' | 'pledged' | string;
    invested: number;
    current_value: number;
    pnl: number;
    pnl_pct: number;
    one_day_pnl: number;
    owner_name?: string;
    created_at: string;
    updated_at: string;
}

export interface PortfolioSummary {
    totalInvested: number;
    totalCurrentValue: number;
    totalPnL: number;
    pnlPercent: number;
    oneDayPnL: number;
    xirr?: number;
    netWorth?: number;
}

export interface AnalyticsSnapshot {
    totalValue: any;
    unrealizedPnL: any;
    unrealizedPnLPct: any;
    assetAllocation: any;
    meta: { userName: string };
    summary: {
        totalInvested: number;
        netWorth: number;
        xirr: number;
        pnl: number;
        pnlPercent: number;
        oneDayPnL: number;
    };
    charts: {
        assetAllocation: { name: string; value: number; fill: string }[];
        performance: { date: string; value: number }[];
    };
    topHoldings: { name: string; type: string; value: number; percent: number }[];
    risk: { score: number; flags: { message: string }[] };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch all portfolio holdings for the authenticated user (or a specific client if userId provided) */
export async function getHoldings(userId?: string): Promise<{ holdings: Holding[]; summary: PortfolioSummary }> {
    const url = userId ? `/portfolio/holdings?userId=${userId}` : '/portfolio/holdings';
    const { data } = await api.get(url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawHoldings = data?.data?.holdings ?? [];

    // Map backend output to frontend expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedHoldings = rawHoldings.map((h: any) => {
        const qty = parseFloat(h.quantity || '0');
        const avgPrice = h.average_price ? parseFloat(h.average_price) : 0;
        const currentNav = h.current_nav ? parseFloat(h.current_nav) : 0;
        const invested = avgPrice * qty;
        const currentValue = h.last_valuation ? parseFloat(h.last_valuation) : (currentNav * qty);
        const pnl = currentValue - invested;
        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

        return {
            ...h,
            id: h.id,
            scrip_name: h.name || h.isin,
            asset_type: h.type || 'EQUITY',
            quantity: qty,
            avg_price: avgPrice,
            current_nav: currentNav,
            invested: h.invested ? parseFloat(h.invested) : invested,
            current_value: currentValue,
            pnl: h.pnl ? parseFloat(h.pnl) : pnl,
            pnl_pct: h.pnl_pct ? parseFloat(h.pnl_pct) : pnlPct,
            one_day_pnl: h.one_day_pnl ? parseFloat(h.one_day_pnl) : 0,
            status: h.status || 'free',
        };
    });

    return {
        holdings: mappedHoldings,
        summary: data?.data?.summary ?? {
            totalInvested: 0, totalCurrentValue: 0, totalPnL: 0,
            pnlPercent: 0, oneDayPnL: 0,
        },
    };
}

/** Fetch the portfolio analytics snapshot (or a specific client if userId provided) */
export async function getAnalyticsSnapshot(userId?: string): Promise<AnalyticsSnapshot> {
    const url = userId ? `/portfolio/analytics-snapshot?userId=${userId}` : '/portfolio/analytics-snapshot';
    const { data } = await api.get(url);
    return data?.data;
}

/** Add a single holding manually */
export async function addManualHolding(params: {
    isin: string;
    asset_type: string;
    quantity: number;
}) {
    const { data } = await api.post('/portfolio/manual', params);
    return data?.data;
}

/** Delete a holding by ID */
export async function deleteHolding(id: string) {
    const { data } = await api.delete(`/portfolio/holdings/${id}`);
    return data?.data;
}

/** Upload a CSV of holdings */
export async function uploadCSV(csv: string) {
    const { data } = await api.post('/portfolio/upload-csv', { csv });
    return data?.data;
}
