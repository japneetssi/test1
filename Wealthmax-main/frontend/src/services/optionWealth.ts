import api from '@/lib/api';

export interface MarginBreakdownItem {
    isin: string;
    name: string;
    asset_type: string;
    current_value: number;
    ltv_rate: number;
    eligible_margin: number;
}

export interface YieldOpportunity {
    isin: string;
    stock_name: string;
    holding_value: number;
    estimated_monthly_premium: number;
    covered_call_eligible: boolean;
    reason: string;
}

export interface OptionWealthResponse {
    user_id: string;
    total_portfolio_value: number;
    las_margin: {
        total_eligible_margin: number;
        margin_utilization_rate: number;
        summary_by_asset_class: {
            equity: { value: number; margin: number };
            mutual_fund_equity: { value: number; margin: number };
            mutual_fund_debt: { value: number; margin: number };
        };
        breakdown: MarginBreakdownItem[];
    };
    yield_enhancement: {
        strategy: string;
        total_equity_value: number;
        eligible_holdings_count: number;
        total_monthly_yield_potential: number;
        annual_yield_potential: number;
        yield_opportunities: YieldOpportunity[];
    };
}

export const getOptionWealthAnalysis = async (userId: string): Promise<OptionWealthResponse> => {
    try {
        const response = await api.get(`/advisor/option-wealth/${userId}`);
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch option wealth analysis');
    }
};
