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

        // Query user profile metrics
        const { rows: profileRows } = await db.query(`
            SELECT 
                gross_income,
                fixed_expenses,
                emergency_fund_amount,
                COALESCE(
                    (SELECT SUM(amount) FROM financial_transactions WHERE user_id = $1 AND transaction_type = 'emi'),
                    0
                ) as total_emi
            FROM user_profiles
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

        // Calculate actual percentages
        const expensesPercent = monthlyGrossIncome > 0 ? Math.round((profile.fixed_expenses / monthlyGrossIncome) * 100) : 0;
        const liabilitiesPercent = monthlyGrossIncome > 0 ? Math.round((profile.total_emi / monthlyGrossIncome) * 100) : 0;
        
        // Calculate investment percentage (inferred from portfolio)
        const { rows: investmentRows } = await db.query(`
            SELECT SUM(ph.quantity * ph.current_nav) as total_invested
            FROM portfolio_holdings ph
            WHERE ph.user_id = $1
        `, [userId]);

        const investmentMonthly = investmentRows && investmentRows[0]?.total_invested ? 
            Math.round((investmentRows[0].total_invested / 365 / 30 / monthlyGrossIncome) * 100) : 0;

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
