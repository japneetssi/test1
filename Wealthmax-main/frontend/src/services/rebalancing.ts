import { api } from "@/lib/api";

export interface TargetAllocation {
    equity: number;
    debt: number;
    cash: number;
}

export interface DriftAnalysis {
    assetClass: string;
    currentPct: number;
    targetPct: number;
    driftPct: number;
    driftValue: number;
    action: 'BUY' | 'SELL' | 'HOLD';
}

export interface RebalancingSuggestion {
    id: string;
    type: 'SWITCH' | 'BUY' | 'SELL';
    fromAsset?: string;
    toAsset?: string;
    amount: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
}

export interface HoldingAnalysis {
    isin: string;
    name: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    category: string;
    quantity: number;
    currentValue: number;
    percentage: number;
}

export interface RebalancingResult {
    currentAllocation: { equity: number; debt: number; cash: number };
    targetAllocation: TargetAllocation;
    driftAnalysis: DriftAnalysis[];
    suggestions: RebalancingSuggestion[];
    overallDriftPct: number;
    holdings: HoldingAnalysis[];
    personaName?: string;
    strategyName?: string;
}

export const getRebalancingAnalysis = async (clientId?: string): Promise<RebalancingResult> => {
    const url = clientId 
        ? `/rebalancing/analyze?clientId=${clientId}` 
        : "/rebalancing/analyze";
    const response = await api.get(url);
    return response.data.data;
};
