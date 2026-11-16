import { PortfolioHoldingModel, PortfolioHoldingWithMetadata } from '../models/portfolioHolding.model';
import logger from '../config/logger';

// LTV (Loan-to-Value) limits by asset category
const LTV_RATES = {
    EQUITY: 0.50,           // Direct Equity & Equity Mutual Funds → 50%
    DEBT_MUTUAL_FUND: 0.80, // Debt Mutual Funds → 80%
    MUTUAL_FUND: 0.50,      // Default for unclassified Mutual Funds → 50%
};

// Minimum holding value (in INR) to qualify for F&O Covered Call strategy
const COVERED_CALL_MIN_VALUE = 500_000; // ₹5,00,000

// Conservative monthly premium yield estimate for Covered Calls
const MONTHLY_PREMIUM_RATE = 0.015; // 1.5%

export interface MarginBreakdownItem {
    isin: string;
    name: string;
    asset_type: string;
    current_value: number;
    ltv_rate: number;
    eligible_margin: number;
}

export interface PortfolioLiquidityAnalysis {
    total_portfolio_value: number;
    total_eligible_margin: number;
    breakdown: MarginBreakdownItem[];
    summary_by_asset_class: {
        equity: { value: number; margin: number };
        mutual_fund_equity: { value: number; margin: number };
        mutual_fund_debt: { value: number; margin: number };
    };
}

export interface YieldOpportunity {
    isin: string;
    stock_name: string;
    holding_value: number;
    estimated_monthly_premium: number;
    covered_call_eligible: boolean;
    reason: string;
}

export interface YieldDiscoveryResult {
    total_equity_value: number;
    eligible_holdings_count: number;
    total_monthly_yield_potential: number;
    yield_opportunities: YieldOpportunity[];
}

/**
 * Determines if a holding is a Debt Mutual Fund based on the metadata.
 * Uses the `ticker` field as a proxy for sub-type (DEBT prefix convention).
 * In a production system, this would query a dedicated `subtype` column.
 */
function isDebtMutualFund(holding: PortfolioHoldingWithMetadata): boolean {
    const ticker = (holding.ticker || '').toLowerCase();
    // Convention: debt fund tickers start with 'DEBT' or 'BD' or 'LIQUID'
    return ticker.startsWith('debt') || ticker.startsWith('bd') || ticker.startsWith('liquid');
}

/**
 * Calculates the current value of a holding.
 * Prefers live last_valuation; falls back to quantity * current_nav.
 */
function getHoldingCurrentValue(holding: PortfolioHoldingWithMetadata): number {
    const lastVal = parseFloat(holding.last_valuation as any);
    if (!isNaN(lastVal) && lastVal > 0) {
        return lastVal;
    }
    const nav = parseFloat(holding.current_nav as any);
    const qty = parseFloat(holding.quantity as any);
    if (!isNaN(nav) && !isNaN(qty)) {
        return nav * qty;
    }
    return 0;
}

/**
 * Analyzes a user's portfolio to calculate the total eligible LAS (Loan Against Securities) margin.
 */
export async function analyzePortfolioLiquidity(userId: string): Promise<PortfolioLiquidityAnalysis> {
    logger.info(`[OptionWealth] Analyzing portfolio liquidity for user: ${userId}`);

    const holdings = await PortfolioHoldingModel.findByUserIdWithMetadata(userId);

    let total_portfolio_value = 0;
    let total_eligible_margin = 0;
    const breakdown: MarginBreakdownItem[] = [];

    const summary = {
        equity: { value: 0, margin: 0 },
        mutual_fund_equity: { value: 0, margin: 0 },
        mutual_fund_debt: { value: 0, margin: 0 },
    };

    for (const holding of holdings) {
        const current_value = getHoldingCurrentValue(holding);
        if (current_value <= 0) continue;

        total_portfolio_value += current_value;

        let ltv_rate: number;
        let asset_label: string;

        if (holding.type === 'EQUITY') {
            ltv_rate = LTV_RATES.EQUITY;
            asset_label = 'Direct Equity';
            summary.equity.value += current_value;
            summary.equity.margin += current_value * ltv_rate;
        } else if (holding.type === 'MUTUAL_FUND') {
            if (isDebtMutualFund(holding)) {
                ltv_rate = LTV_RATES.DEBT_MUTUAL_FUND;
                asset_label = 'Debt Mutual Fund';
                summary.mutual_fund_debt.value += current_value;
                summary.mutual_fund_debt.margin += current_value * ltv_rate;
            } else {
                ltv_rate = LTV_RATES.MUTUAL_FUND;
                asset_label = 'Equity Mutual Fund';
                summary.mutual_fund_equity.value += current_value;
                summary.mutual_fund_equity.margin += current_value * ltv_rate;
            }
        } else {
            // Unknown type: use conservative equity rate
            ltv_rate = LTV_RATES.EQUITY;
            asset_label = 'Other';
        }

        const eligible_margin = current_value * ltv_rate;
        total_eligible_margin += eligible_margin;

        breakdown.push({
            isin: holding.isin,
            name: holding.name,
            asset_type: asset_label,
            current_value: Math.round(current_value),
            ltv_rate: ltv_rate * 100, // Store as percentage (e.g., 50 or 80)
            eligible_margin: Math.round(eligible_margin),
        });
    }

    return {
        total_portfolio_value: Math.round(total_portfolio_value),
        total_eligible_margin: Math.round(total_eligible_margin),
        breakdown,
        summary_by_asset_class: {
            equity: {
                value: Math.round(summary.equity.value),
                margin: Math.round(summary.equity.margin),
            },
            mutual_fund_equity: {
                value: Math.round(summary.mutual_fund_equity.value),
                margin: Math.round(summary.mutual_fund_equity.margin),
            },
            mutual_fund_debt: {
                value: Math.round(summary.mutual_fund_debt.value),
                margin: Math.round(summary.mutual_fund_debt.margin),
            },
        },
    };
}

/**
 * Identifies equity holdings eligible for a Yield Enhancement (Covered Call) strategy.
 * A holding qualifies if it is of type EQUITY and its current value exceeds ₹5,00,000
 * (simulating F&O lot size requirement).
 */
export async function identifyYieldOpportunities(userId: string): Promise<YieldDiscoveryResult> {
    logger.info(`[OptionWealth] Identifying yield opportunities for user: ${userId}`);

    const holdings = await PortfolioHoldingModel.findByUserIdWithMetadata(userId);
    const equityHoldings = holdings.filter(h => h.type === 'EQUITY');

    let total_equity_value = 0;
    let total_monthly_yield_potential = 0;
    const yield_opportunities: YieldOpportunity[] = [];

    for (const holding of equityHoldings) {
        const current_value = getHoldingCurrentValue(holding);
        if (current_value <= 0) continue;

        total_equity_value += current_value;
        const is_eligible = current_value > COVERED_CALL_MIN_VALUE;

        if (is_eligible) {
            const estimated_monthly_premium = current_value * MONTHLY_PREMIUM_RATE;
            total_monthly_yield_potential += estimated_monthly_premium;

            yield_opportunities.push({
                isin: holding.isin,
                stock_name: holding.name,
                holding_value: Math.round(current_value),
                estimated_monthly_premium: Math.round(estimated_monthly_premium),
                covered_call_eligible: true,
                reason: `Holding value ₹${(current_value / 100_000).toFixed(1)}L exceeds ₹5L F&O lot threshold. Estimated premium at 1.5%/month.`,
            });
        }
    }

    return {
        total_equity_value: Math.round(total_equity_value),
        eligible_holdings_count: yield_opportunities.length,
        total_monthly_yield_potential: Math.round(total_monthly_yield_potential),
        yield_opportunities,
    };
}
