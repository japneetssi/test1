import { Request, Response } from 'express';
import db from '../config/database';
import logger from '../config/logger';

export class RMController {
    /**
     * Search Clients for RM Dropdown
     * GET /api/rm/search?q={query}
     */
    static async searchClients(req: Request, res: Response) {
        const rmId = (req as any).user.id;
        const query = req.query.q as string;

        if (!query || query.length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }

        try {
            // Search users where role is 'user' (client) and managed by this RM (advisor_id)
            const sql = `
                SELECT id, full_name, email 
                FROM users 
                WHERE role = 'user' 
                AND advisor_id = $1 
                AND (full_name ILIKE $2 OR email ILIKE $2)
                ORDER BY full_name ASC
                LIMIT 5
            `;
            const values = [rmId, `%${query}%`];
            const result = await db.query(sql, values);

            return res.status(200).json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            logger.error('RM Client Search Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to search clients'
            });
        }
    }

    /**
     * Get Dashboard Metrics for RM
     * GET /api/rm/dashboard-metrics
     */
    static async getDashboardMetrics(req: Request, res: Response) {
        const rmId = (req as any).user.id;

        try {
            // 1. Total Active Clients
            const clientsQuery = `SELECT COUNT(*) as count FROM users WHERE advisor_id = $1 AND role = 'user'`;
            
            // 2. Total AUM (across all clients)
            const aumQuery = `
                SELECT COALESCE(SUM(ph.last_valuation), 0) as total_aum
                FROM portfolio_holdings ph
                JOIN user_portfolios up ON ph.portfolio_id = up.id
                JOIN users u ON up.user_id = u.id
                WHERE u.advisor_id = $1
            `;

            // 3. Pending Pledge Requests
            const pledgesQuery = `
                SELECT COUNT(*) as count 
                FROM pledge_requests pr
                JOIN users u ON pr.user_id = u.id
                WHERE u.advisor_id = $1 AND pr.status = 'pending'
            `;

            // 4. Critical Alerts (Action Items with High Severity)
            const alertsQuery = `
                SELECT COUNT(*) as count
                FROM action_items ai
                JOIN users u ON ai.user_id = u.id
                WHERE u.advisor_id = $1 AND ai.severity = 'High'
            `;

            const [clientsRes, aumRes, pledgesRes, alertsRes] = await Promise.all([
                db.query(clientsQuery, [rmId]),
                db.query(aumQuery, [rmId]),
                db.query(pledgesQuery, [rmId]),
                db.query(alertsQuery, [rmId])
            ]);

            const totalAum = parseFloat(aumRes.rows[0].total_aum);
            const aumInCrores = (totalAum / 10000000).toFixed(2);

            return res.status(200).json({
                success: true,
                data: {
                    activeClients: parseInt(clientsRes.rows[0].count),
                    aumTracked: `${aumInCrores} Cr`,
                    pendingPledges: parseInt(pledgesRes.rows[0].count),
                    criticalAlerts: parseInt(alertsRes.rows[0].count)
                }
            });
        } catch (error) {
            logger.error('RM Metrics Fetch Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard metrics'
            });
        }
    }

    /**
     * Get Client Roster for RM
     * GET /api/rm/clients?page=1&limit=20&sortBy=name&sortOrder=ASC
     */
    static async getClients(req: Request, res: Response) {
        const rmId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const sortBy = (req.query.sortBy as string) || 'name';
        const sortOrder = (req.query.sortOrder as string) || 'ASC';
        const offset = (page - 1) * limit;

        // Map frontend sort keys to DB columns
        const sortMap: any = {
            'name': 'u.full_name',
            'healthScore': 'hs.total_score',
            'totalAssets': 'total_assets'
        };
        const orderBy = sortMap[sortBy] || 'u.full_name';

        try {
            const sql = `
                SELECT 
                    u.id, 
                    u.full_name as name, 
                    u.assigned_persona as persona,
                    hs.total_score as "healthScore",
                    COALESCE((
                        SELECT SUM(last_valuation) 
                        FROM portfolio_holdings ph
                        JOIN user_portfolios up ON ph.portfolio_id = up.id
                        WHERE up.user_id = u.id
                    ), 0) as "totalAssets",
                    u.created_at as "lastSynced"
                FROM users u
                LEFT JOIN (
                    SELECT DISTINCT ON (user_id) user_id, total_score 
                    FROM health_scores 
                    ORDER BY user_id, calculated_at DESC
                ) hs ON hs.user_id = u.id
                WHERE u.advisor_id = $1 AND u.role = 'user'
                ORDER BY ${orderBy} ${sortOrder}
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(sql, [rmId, limit, offset]);

            // Get total count for pagination
            const countRes = await db.query(
                `SELECT COUNT(*) FROM users WHERE advisor_id = $1 AND role = 'user'`, 
                [rmId]
            );

            return res.status(200).json({
                success: true,
                data: {
                    clients: result.rows,
                    total: parseInt(countRes.rows[0].count),
                    page,
                    limit
                }
            });
        } catch (error) {
            logger.error('RM Roster Fetch Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch client roster'
            });
        }
    }

    /**
     * Generate PDF Report for Client
     * POST /api/rm/generate-pdf/:clientId
     */
    static async generatePDF(req: Request, res: Response) {
        const clientId = req.params.clientId;
        try {
            // Placeholder: Return a mock success and status
            // In real app, call PDFService.generateAdvisoryReport(clientId)
            logger.info(`Generating RM Report for Client: ${clientId}`);
            
            // Simulating a small wait
            await new Promise(resolve => setTimeout(resolve, 500));

            return res.status(200).json({
                success: true,
                message: 'PDF Report Generated Successfully',
                data: {
                    downloadUrl: `/api/pdf/download/${clientId}` // Placeholder or actual buffer later
                }
            });
        } catch (error) {
            logger.error('RM PDF Generation Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate PDF'
            });
        }
    }

    /**
     * Send Nudge to Client
     * POST /api/rm/nudge/:clientId
     */
    static async sendNudge(req: Request, res: Response) {
        const clientId = req.params.clientId;
        const { message } = req.body;

        try {
            logger.info(`🚨 RM NUDGE [Client ${clientId}]: ${message}`);
            
            // Placeholder for real notification logic (WhatsApp/Email)
            
            return res.status(200).json({
                success: true,
                message: 'Nudge sent successfully to client dashboard'
            });
        } catch (error) {
            logger.error('RM Nudge Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send nudge'
            });
        }
    }

    /**
     * Get Recent Intelligence Alerts across all clients managed by RM
     * GET /api/rm/recent-alerts
     */
    static async getRecentAlerts(req: Request, res: Response) {
        const rmId = (req as any).user.id;

        try {
            const sql = `
                SELECT 
                    ai.id,
                    ai.user_id as "clientId",
                    u.full_name as "clientName",
                    u.assigned_persona as persona,
                    u.risk_class as "riskClass",
                    ai.risk_type as type,
                    ai.severity,
                    ai.gap_amount as "gapAmount",
                    ai.estimated_score_impact as "impact",
                    ai.created_at as "timestamp"
                FROM action_items ai
                JOIN users u ON ai.user_id = u.id
                WHERE u.advisor_id = $1
                ORDER BY ai.created_at DESC
                LIMIT 50
            `;
            
            const result = await db.query(sql, [rmId]);

            return res.status(200).json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            logger.error('RM Recent Alerts Fetch Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch intelligence alerts'
            });
        }
    }
}
