import { PortfolioAnalyticsResult, HoldingAnalysis } from '../types/portfolioAnalytics';
import { ProfilingResult } from './profiling.service';

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

export interface RebalancingResult {
    currentAllocation: { equity: number; debt: number; cash: number };
    targetAllocation: TargetAllocation;
    driftAnalysis: DriftAnalysis[];
    suggestions: RebalancingSuggestion[];
    overallDriftPct: number;
}

export class RebalancingService {
    // Target allocations based on Persona ID (A, B, C)
    private static TARGET_ALLOCATIONS: Record<string, TargetAllocation> = {
        'A': { equity: 80, debt: 15, cash: 5 },  // Early Career Builder
        'B': { equity: 60, debt: 30, cash: 10 }, // Growth Strategist
        'C': { equity: 30, debt: 50, cash: 20 }  // Wealth Preserver
    };

    /**
     * Compute rebalancing needs by comparing current portfolio vs target
     */
    static analyze(
        portfolio: PortfolioAnalyticsResult,
        profile: ProfilingResult
    ): RebalancingResult {
        const personaId = profile.persona.id;
        const target = this.TARGET_ALLOCATIONS[personaId] || this.TARGET_ALLOCATIONS['B'];
        const totalValue = portfolio.totalValue;

        // 1. Group current holdings into Equity, Debt, Cash
        // Note: In our current system, we have EQUITY and MUTUAL_FUND. 
        // We'll further categorize MUTUAL_FUND by its 'category' field if possible.
        const current = this.computeCurrentAllocation(portfolio.holdingDetails, totalValue);

        // 2. Compute Drift
        const driftAnalysis: DriftAnalysis[] = [
            this.computeDrift('Equity', current.equity, target.equity, totalValue),
            this.computeDrift('Debt', current.debt, target.debt, totalValue),
            this.computeDrift('Cash/Liquid', current.cash, target.cash, totalValue)
        ];

        // 3. Overall Drift (Root Mean Square of drifts)
        const overallDriftPct = Math.sqrt(
            driftAnalysis.reduce((sum, d) => sum + Math.pow(d.driftPct, 2), 0) / 3
        );

        // 4. Generate Specific Suggestions
        const suggestions = this.generateSuggestions(driftAnalysis, portfolio.holdingDetails);

        return {
            currentAllocation: {
                equity: parseFloat(current.equity.toFixed(2)),
                debt: parseFloat(current.debt.toFixed(2)),
                cash: parseFloat(current.cash.toFixed(2))
            },
            targetAllocation: target,
            driftAnalysis,
            suggestions,
            overallDriftPct: parseFloat(overallDriftPct.toFixed(2))
        };
    }

    private static computeCurrentAllocation(holdings: HoldingAnalysis[], total: number) {
        if (total === 0) return { equity: 0, debt: 0, cash: 0 };

        let eqVal = 0;
        let debtVal = 0;
        let cashVal = 0;

        holdings.forEach(h => {
            const cat = (h.category || '').toLowerCase();
            if (h.type === 'EQUITY' || cat.includes('equity') || cat.includes('growth') || cat.includes('cap')) {
                eqVal += h.currentValue;
            } else if (cat.includes('debt') || cat.includes('bond') || cat.includes('income')) {
                debtVal += h.currentValue;
            } else if (cat.includes('liquid') || cat.includes('cash') || cat.includes('savings')) {
                cashVal += h.currentValue;
            } else {
                // Default to debt if unknown but MF
                debtVal += h.currentValue;
            }
        });

        return {
            equity: (eqVal / total) * 100,
            debt: (debtVal / total) * 100,
            cash: (cashVal / total) * 100
        };
    }

    private static computeDrift(assetClass: string, current: number, target: number, total: number): DriftAnalysis {
        const driftPct = current - target;
        const driftValue = (driftPct / 100) * total;
        
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        if (driftPct > 5) action = 'SELL';
        else if (driftPct < -5) action = 'BUY';

        return {
            assetClass,
            currentPct: parseFloat(current.toFixed(2)),
            targetPct: target,
            driftPct: parseFloat(driftPct.toFixed(2)),
            driftValue: Math.round(driftValue),
            action
        };
    }

    private static generateSuggestions(drifts: DriftAnalysis[], _holdings: HoldingAnalysis[]): RebalancingSuggestion[] {
        const suggestions: RebalancingSuggestion[] = [];

        const equityDrift = drifts.find(d => d.assetClass === 'Equity');
        const debtDrift = drifts.find(d => d.assetClass === 'Debt');
        const cashDrift = drifts.find(d => d.assetClass === 'Cash/Liquid');

        if (!equityDrift || !debtDrift || !cashDrift) return [];

        // Scenario: Equity is too high, Debt/Cash are low (Common in Bull Markets)
        if (equityDrift.action === 'SELL' && (debtDrift.action === 'BUY' || cashDrift.action === 'BUY')) {
            const moveAmount = Math.abs(equityDrift.driftValue);
            suggestions.push({
                id: 'rebal-01',
                type: 'SWITCH',
                fromAsset: 'Equity Portfolio',
                toAsset: debtDrift.driftPct < 0 ? 'Debt Funds' : 'Liquid Funds',
                amount: moveAmount,
                priority: Math.abs(equityDrift.driftPct) > 15 ? 'HIGH' : 'MEDIUM',
                reason: `Your Equity allocation is ${(equityDrift.currentPct).toFixed(1)}%, which is ${(equityDrift.driftPct).toFixed(1)}% higher than your target for your persona.`
            });
        }

        // Scenario: Equity is too low (Common in Bear Markets/New Portfolios)
        if (equityDrift.action === 'BUY' && (cashDrift.currentPct > 5)) {
            const investAmount = Math.min(Math.abs(equityDrift.driftValue), Math.round((cashDrift.currentPct - 5) / 100 * (equityDrift.driftValue / (equityDrift.driftPct/100))));
            suggestions.push({
                id: 'rebal-02',
                type: 'BUY',
                toAsset: 'Diversified Equity',
                amount: Math.abs(equityDrift.driftValue),
                priority: 'MEDIUM',
                reason: `You are underweight on Equity. Increasing exposure by ${formatCurrency(Math.abs(equityDrift.driftValue))} will help you reach your long-term growth targets.`
            });
        }

        // Generic "Add more" suggestion if everything is low or portfolio is small
        if (suggestions.length === 0 && Math.abs(equityDrift.driftPct) > 5) {
            suggestions.push({
                id: 'rebal-gen',
                type: equityDrift.driftPct > 0 ? 'SELL' : 'BUY',
                amount: Math.abs(equityDrift.driftValue),
                priority: 'LOW',
                reason: `Your portfolio has drifted from the target asset allocation by ${Math.abs(equityDrift.driftPct).toFixed(1)}%.`
            });
        }

        return suggestions;
    }
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}
