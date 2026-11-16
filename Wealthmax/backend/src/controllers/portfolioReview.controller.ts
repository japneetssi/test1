import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioAlignmentService } from '../services/portfolioAlignment.service';
import { UserModel } from '../models/user.model';
import logger from '../config/logger';

export class PortfolioReviewController {
    /**
     * GET /api/advisor/portfolio-review/:clientId
     * 
     * Returns current allocation, target allocation (by persona),
     * deviation analysis, and actionable rebalancing plan.
     */
    static async getPortfolioReview(req: Request, res: Response): Promise<void> {
        try {
            const advisorId = (req as any).user.id;
            const { clientId } = req.params;

            if (!clientId) {
                res.status(400).json({ success: false, message: 'Client ID is required' });
                return;
            }

            // ── Ownership verification ────────────────────────────────────
            const client = await UserModel.findById(clientId);
            if (!client) {
                res.status(404).json({ success: false, message: 'Client not found' });
                return;
            }

            if (client.advisor_id !== advisorId) {
                res.status(403).json({ success: false, message: 'Unauthorized: client does not belong to this advisor' });
                return;
            }

            // ── Fetch portfolio and alignment ─────────────────────────────
            const persona = client.assigned_persona || client.risk_class || 'General';
            const alignment = await PortfolioAlignmentService.analyzeAlignment(clientId, persona, client.risk_class);

            const { actualAllocation, idealAllocation, deviation, alignmentScore, advisoryFlags, summary } = alignment;

            // ── Generate Rebalancing Action Plan ──────────────────────────
            const actionPlan: Array<{
                action: 'BUY' | 'SELL' | 'HOLD';
                assetClass: string;
                currentPercent: number;
                targetPercent: number;
                deviationPercent: number;
                amount: number;
                rationale: string;
            }> = [];

            const totalValue = actualAllocation.totalValue;

            if (totalValue > 0) {
                // Equity deviation
                const equityDev = deviation.equity; // positive = overweight
                if (Math.abs(equityDev) > 2) {
                    const equityAmount = Math.abs(Math.round((equityDev / 100) * totalValue));
                    actionPlan.push({
                        action: equityDev > 0 ? 'SELL' : 'BUY',
                        assetClass: 'Equity',
                        currentPercent: Math.round(actualAllocation.equity * 10) / 10,
                        targetPercent: idealAllocation.equity,
                        deviationPercent: Math.round(equityDev * 10) / 10,
                        amount: equityAmount,
                        rationale: equityDev > 0
                            ? `Equity allocation is ${equityDev.toFixed(1)}% above the ${persona} target. Reduce exposure to lower volatility risk.`
                            : `Equity allocation is ${Math.abs(equityDev).toFixed(1)}% below the ${persona} target. Increase exposure for growth potential.`
                    });
                }

                // Debt / Mutual Fund deviation
                const debtDev = deviation.mutualFund; // positive = overweight
                if (Math.abs(debtDev) > 2) {
                    const debtAmount = Math.abs(Math.round((debtDev / 100) * totalValue));
                    actionPlan.push({
                        action: debtDev > 0 ? 'SELL' : 'BUY',
                        assetClass: 'Debt / Mutual Funds',
                        currentPercent: Math.round(actualAllocation.mutualFund * 10) / 10,
                        targetPercent: idealAllocation.mutualFund,
                        deviationPercent: Math.round(debtDev * 10) / 10,
                        amount: debtAmount,
                        rationale: debtDev > 0
                            ? `Debt/MF allocation is ${debtDev.toFixed(1)}% above the ${persona} target. Consider shifting to equity for better returns.`
                            : `Debt/MF allocation is ${Math.abs(debtDev).toFixed(1)}% below the ${persona} target. Increase for stability and income.`
                    });
                }

                // If both within tolerance
                if (actionPlan.length === 0) {
                    actionPlan.push({
                        action: 'HOLD',
                        assetClass: 'All',
                        currentPercent: 100,
                        targetPercent: 100,
                        deviationPercent: 0,
                        amount: 0,
                        rationale: `Portfolio is well-aligned with the ${persona} target. No rebalancing needed.`
                    });
                }
            }

            // ── Response ──────────────────────────────────────────────────
            res.status(200).json({
                success: true,
                data: {
                    client: {
                        id: client.id,
                        name: client.full_name,
                        persona,
                        riskClass: client.risk_class || 'Not assessed'
                    },
                    currentAllocation: {
                        equity: Math.round(actualAllocation.equity * 10) / 10,
                        debt: Math.round(actualAllocation.mutualFund * 10) / 10,
                        equityValue: actualAllocation.equityValue,
                        debtValue: actualAllocation.mutualFundValue,
                        totalValue: actualAllocation.totalValue
                    },
                    targetAllocation: {
                        equity: idealAllocation.equity,
                        debt: idealAllocation.mutualFund
                    },
                    alignmentScore,
                    summary,
                    actionPlan,
                    advisoryFlags
                }
            });

        } catch (error: any) {
            logger.error('[PortfolioReview] Error', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate portfolio review'
            });
        }
    }
}
