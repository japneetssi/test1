import { Router, Response, Request } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateActionItemStatusSchema } from '../validation/profile.validation';
import db from '../config/database';
import logger from '../config/logger';

// Extend Express Request type to include user property added by authenticateToken middleware
declare global {
    namespace Express {
        interface Request {
            user?: { id: string; email: string; };
        }
    }
}

const router = Router();


router.get('/', authenticateToken, ProfileController.getProfile);
router.post('/update', authenticateToken, ProfileController.updateProfile);
router.put('/action-items/:id/status', authenticateToken, validateRequest(updateActionItemStatusSchema), ProfileController.updateActionItemStatus);
router.get('/score-history', authenticateToken, ProfileController.getScoreHistory);
router.get('/next-best-action', authenticateToken, ProfileController.getNextBestAction);
router.get('/audit-logs', authenticateToken, ProfileController.getAuditLogs);

/**
 * ✅ GET /api/v1/profile/gap-analysis
 * Returns user's gap analysis vs 30-30-30-10 rule
 * Fetches actual financial data from database
 */
router.get('/gap-analysis', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Query user profile metrics.
        // FIX: the table is `profiles` (the previous route queried an alias that
        // does not exist in this schema), and monthly EMI
        // lives on `profiles.liabilities_emi`. The earlier query also counted
        // EMIs from a transactions table with an 'emi' type that never existed -
        // `relation does not exist` on every call.
        const { rows: profileRows } = await db.query(`
            SELECT
                gross_income,
                fixed_expenses,
                total_liabilities,
                liabilities_emi,
                emergency_fund_amount
            FROM profiles
            WHERE user_id = $1
        `, [userId]);

        if (!profileRows || profileRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found. Complete your financial snapshot first.'
            });
        }

        const profile = profileRows[0];
        const monthlyGrossIncome = (profile.gross_income || 0) / 12;
        const totalEmi = profile.liabilities_emi || 0;

        // Calculate actual percentages
        const expensesPercent = monthlyGrossIncome > 0 ? Math.round((profile.fixed_expenses / monthlyGrossIncome) * 100) : 0;
        const liabilitiesPercent = monthlyGrossIncome > 0 ? Math.round((totalEmi / monthlyGrossIncome) * 100) : 0;

        // FIX: "Investment %" is the share of monthly income invested in the
        // last 30 days, measured from actual portfolio transactions (SIP/BUY)
        // - the previous formula divided total portfolio value by 10950,
        // which produced a financially meaningless number.
        const { rows: monthlyInvestRows } = await db.query(`
            SELECT COALESCE(SUM(pt.amount), 0) AS monthly_invested
            FROM portfolio_transactions pt
            JOIN user_portfolios up ON up.id = pt.portfolio_id
            WHERE up.user_id = $1
              AND pt.transaction_type IN ('BUY', 'SIP')
              AND pt.transaction_date >= (CURRENT_DATE - INTERVAL '30 days')
        `, [userId]);

        const { rows: investedValueRows } = await db.query(`
            SELECT COALESCE(SUM(ph.quantity * ph.current_nav), 0) AS portfolio_value
            FROM portfolio_holdings ph
            WHERE ph.user_id = $1
        `, [userId]);

        const monthlyInvested = Number(monthlyInvestRows[0]?.monthly_invested) || 0;
        const investmentMonthly = monthlyGrossIncome > 0
            ? Math.max(0, Math.round((monthlyInvested / monthlyGrossIncome) * 100))
            : 0;
        const portfolioValue = Number(investedValueRows[0]?.portfolio_value) || 0;

        const emergencyPercent = monthlyGrossIncome > 0 ?
            Math.round(((profile.emergency_fund_amount || 0) / (profile.fixed_expenses || 1)) * 100) : 0;

        const gapAnalysis = [
            {
                id: 'expenses',
                label: 'Expenses',
                actual: Math.min(expensesPercent, 100),
                ideal: 30,
                deviation: expensesPercent - 30,
                status: expensesPercent <= 35 ? 'on-track' : (expensesPercent <= 45 ? 'warning' : 'critical')
            },
            {
                id: 'liabilities',
                label: 'Liabilities (EMI)',
                actual: Math.min(liabilitiesPercent, 100),
                ideal: 30,
                deviation: liabilitiesPercent - 30,
                status: liabilitiesPercent <= 35 ? 'on-track' : (liabilitiesPercent <= 45 ? 'warning' : 'critical')
            },
            {
                id: 'investments',
                label: 'Investments',
                actual: Math.max(investmentMonthly, 0),
                ideal: 30,
                deviation: investmentMonthly - 30,
                status: investmentMonthly >= 25 ? 'on-track' : (investmentMonthly >= 15 ? 'warning' : 'critical')
            },
            {
                id: 'emergency',
                label: 'Emergency Fund (Months)',
                actual: Math.round(emergencyPercent / 100),  // Convert to months
                ideal: 6,
                deviation: Math.round(emergencyPercent / 100) - 6,
                status: Math.round(emergencyPercent / 100) >= 6 ? 'on-track' : (Math.round(emergencyPercent / 100) >= 3 ? 'warning' : 'critical')
            }
        ];

        return res.json({
            success: true,
            data: {
                gapAnalysis,
                portfolioValue,
                monthlyInvested,
                lastUpdated: new Date().toISOString(),
                source: 'database'  // ✅ Indicate this is real data
            }
        });

    } catch (error) {
        logger.error('Error fetching gap analysis', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch gap analysis'
        });
    }
});

/**
 * ✅ GET /api/v1/profile/action-items
 * Returns AI-generated priority action items for user
 */
router.get('/action-items', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Query existing action items from database
        const { rows } = await db.query(`
            SELECT 
                id,
                priority,
                title,
                description,
                status,
                category,
                created_at
            FROM action_items
            WHERE user_id = $1
            ORDER BY priority ASC, created_at DESC
            LIMIT 10
        `, [userId]);

        if (!rows || rows.length === 0) {
            // If no action items exist, generate default ones based on profile
            const defaultActions = [
                { priority: 1, title: "Complete Financial Profile", description: "Provide detailed income, expenses, and insurance information to get personalized insights.", status: "critical", category: "profile" },
                { priority: 2, title: "Review Insurance Coverage", description: "Ensure you have adequate life and health insurance coverage.", status: "high", category: "protection" },
                { priority: 3, title: "Build Emergency Fund", description: "Aim to set aside 6 months of expenses for emergencies.", status: "high", category: "liquidity" }
            ];

            return res.json({
                success: true,
                data: {
                    actionItems: defaultActions,
                    source: 'default'  // Not from database yet
                }
            });
        }

        return res.json({
            success: true,
            data: {
                actionItems: rows,
                source: 'database'  // ✅ Real user action items
            }
        });

    } catch (error) {
        logger.error('Error fetching action items', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch action items'
        });
    }
});

export default router;
