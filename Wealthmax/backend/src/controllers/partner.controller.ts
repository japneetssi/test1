import { Request, Response } from 'express';
import { PartnerModel } from '../models/partner.model';
import db from '../config/database';
import logger from '../config/logger';
import config from '../config/env';
import jwt from 'jsonwebtoken';

// Partner Controller - All partner management endpoints
export class PartnerController {
    /**
     * Get Partner Agency Settings & Advisors
     * GET /api/partner/settings
     */
    static async getSettings(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;

            if (!partnerId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: No partner ID found for user'
                });
            }

            const partner = await PartnerModel.findById(partnerId);
            const advisors = await PartnerModel.getAdvisors(partnerId);

            return res.status(200).json({
                success: true,
                data: {
                    branding: {
                        name: partner?.name,
                        logo_url: partner?.logo_url,
                        primary_color: partner?.primary_color || '#00458c',
                        action_color: partner?.action_color || '#f37920'
                    },
                    advisors: advisors || []
                }
            });

        } catch (error: any) {
            logger.error('Get Partner Settings Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch partner settings'
            });
        }
    }

    /**
     * Get Advisor Roster
     * GET /api/partner/advisors
     */
    static async getAdvisors(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;

            if (!partnerId) {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }

            // Enhanced aggregation: fetch client count and total AUM per advisor
            const result = await db.query(
                `SELECT a.id, a.full_name AS name, a.email, a.status,
                        COUNT(c.id) AS assigned_clients,
                        COALESCE(SUM(ph.last_valuation), 0) AS aum_managed
                   FROM users a
                   LEFT JOIN users c ON c.advisor_id = a.id AND c.role = 'user'
                   LEFT JOIN user_portfolios up ON up.user_id = c.id
                   LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = up.id
                   WHERE a.partner_id = $1 AND a.role = 'advisor'
                   GROUP BY a.id, a.full_name, a.email, a.status
                   ORDER BY a.full_name`,
                [partnerId]
            );
            const advisors = result.rows;
            return res.status(200).json({
                success: true,
                data: advisors
            });
        } catch (error: any) {
            logger.error('Get Advisors Roster Error', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch advisor roster' });
        }
    }

    /**
     * Update Partner Branding
     * PATCH /api/partner/branding
     */
    static async updateBranding(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;
            let { name, logo_url, primary_color, action_color } = req.body;

            if (!partnerId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: No partner ID found for user'
                });
            }

            // Handle file upload if present
            if (req.file) {
                const protocol = req.protocol === 'https' ? 'https' : 'http';
                const host = req.get('host');
                logo_url = `${protocol}://${host}/uploads/partners/${req.file.filename}`;
            }

            const updatedPartner = await PartnerModel.updateBranding(partnerId, {
                name,
                logo_url,
                primary_color,
                action_color
            });

            return res.status(200).json({
                success: true,
                message: 'Branding updated successfully',
                data: {
                    name: updatedPartner.name,
                    logo_url: updatedPartner.logo_url,
                    primary_color: updatedPartner.primary_color,
                    action_color: updatedPartner.action_color
                }
            });

        } catch (error: any) {
            logger.error('Update Branding Error', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update branding'
            });
        }
    }

    /**
     * Invite a New Advisor to the Agency
     * POST /api/partner/invite-advisor
     */
    static async inviteAdvisor(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;
            const { name, email } = req.body;

            if (!partnerId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: No partner ID found for user'
                });
            }

            const partner = await PartnerModel.findById(partnerId);

            // 1. Generate Secure Token
            const token = jwt.sign(
                { 
                    email, 
                    partnerId, 
                    role: 'advisor',
                    type: 'advisor_invite'
                }, 
                process.env.JWT_SECRET || 'dev_secret', 
                { expiresIn: '7d' }
            );

            // 2. Create User with Advisor Role and Pending Status
            const result = await db.query(
                `INSERT INTO users (full_name, email, role, partner_id, status, invitation_token) 
                 VALUES ($1, $2, 'advisor', $3, 'pending', $4) 
                 ON CONFLICT (email) DO UPDATE 
                 SET role = 'advisor', 
                     partner_id = $3, 
                     status = 'pending', 
                     invitation_token = $4
                 RETURNING id`,
                [name, email, partnerId, token]
            );

            // 3. Generate Link and Send Email
            const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || 'https://app.wealthmax.com';
            const inviteLink = `${frontendUrl}/advisor-setup?token=${token}`;
            
            const { EmailService } = await import('../services/email.service');
            await EmailService.sendAdvisorInviteEmail(email, inviteLink, partner?.name || 'WealthMax', name);

            return res.status(201).json({
                success: true,
                message: 'Advisor invited successfully',
                data: {
                    advisorId: result.rows[0].id,
                    inviteLink: process.env.NODE_ENV === 'development' ? inviteLink : undefined
                }
            });

        } catch (error: any) {
            logger.error('Invite Advisor Error', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to invite advisor'
            });
        }
    }

    /**
     * Get Public Branding for a Partner
     * GET /api/partner/public-branding/:id
     */
    static async getPublicBranding(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const partner = await PartnerModel.findById(id);

            if (!partner) {
                return res.status(404).json({
                    success: false,
                    message: 'Partner agency not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    name: partner.name,
                    logo_url: partner.logo_url,
                    primary_color: partner.primary_color || '#00458c',
                    action_color: partner.action_color || '#f37920'
                }
            });
        } catch (error: any) {
            logger.error('Get Public Branding Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch branding'
            });
        }
    }

    /**
     * Get Firm-wide Dashboard Metrics
     * GET /api/partner/dashboard-metrics
     */
    static async getDashboardMetrics(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;
            const metrics = await PartnerModel.getFirmMetrics(partnerId);

            return res.status(200).json({
                success: true,
                data: {
                    totalClients: parseInt(metrics.total_clients),
                    totalAUM: parseFloat(metrics.total_aum),
                    criticalAlerts: parseInt(metrics.critical_alerts),
                    pendingPledges: parseInt(metrics.pending_pledges)
                }
            });
        } catch (error: any) {
            logger.error('Get Firm Metrics Error', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch firm metrics' });
        }
    }

    /**
     * Get Firm-wide Client Roster
     * GET /api/partner/clients
     */
    static async getClients(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;
            const clients = await PartnerModel.getFirmClients(partnerId);

            return res.status(200).json({
                success: true,
                data: clients
            });
        } catch (error: any) {
            logger.error('Get Firm Clients Error', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch firm clients' });
        }
    }

    /**
     * Get Firm-wide Intelligence Alerts
     * GET /api/partner/alerts
     */
    static async getAlerts(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;
            const alerts = await PartnerModel.getFirmAlerts(partnerId);

            return res.status(200).json({
                success: true,
                data: alerts
            });
        } catch (error: any) {
            logger.error('Get Firm Alerts Error', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch firm alerts' });
        }
    }

    /**
     * Get Branding for current user's partner
     * GET /api/partner/my-branding
     */
    static async getMyBranding(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;
            
            if (!partnerId) {
                // If user is not linked to a partner, return default branding
                return res.status(200).json({
                    success: true,
                    data: {
                        name: 'WealthMax',
                        logo_url: null,
                        primary_color: '#00458c',
                        action_color: '#f37920'
                    }
                });
            }

            const partner = await PartnerModel.findById(partnerId);

            return res.status(200).json({
                success: true,
                data: {
                    name: partner?.name || 'WealthMax',
                    logo_url: partner?.logo_url,
                    primary_color: partner?.primary_color || '#00458c',
                    action_color: partner?.action_color || '#f37920',
                    partner_id: partnerId
                }
            });
        } catch (error: any) {
            logger.error('Get My Branding Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch branding'
            });
        }
    }

    /**
     * Get Clients for a specific Advisor
     * GET /api/partner/advisors/:advisorId/clients
     */
    static async getAdvisorClients(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;
            const { advisorId } = req.params;

            if (!partnerId) {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }

            const result = await db.query(
                "SELECT id, full_name as name, email FROM users WHERE advisor_id = $1 AND partner_id = $2 AND role = 'user' ORDER BY full_name ASC",
                [advisorId, partnerId]
            );

            return res.status(200).json({
                success: true,
                data: result.rows
            });

        } catch (error: any) {
            logger.error('Get Advisor Clients Error', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch advisor clients' });
        }
    }

    /**
     * Bulk Reassign Clients from one Advisor to another
     * POST /api/partner/advisors/reassign
     */
    static async reassignClients(req: Request, res: Response) {
        const { from_advisor_id, to_advisor_id, client_ids } = req.body;
        const partnerId = (req as any).user.partner_id;

        if (!from_advisor_id || !to_advisor_id || !Array.isArray(client_ids) || client_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid payload: from_advisor_id, to_advisor_id and client_ids are required' });
        }

        if (from_advisor_id === to_advisor_id) {
            return res.status(400).json({ success: false, message: 'Source and destination advisors must be different' });
        }

        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // 1. Verify both advisors belong to the partner's organization
            const advisorCheck = await client.query(
                `SELECT id, full_name FROM users 
                 WHERE id IN ($1, $2) AND partner_id = $3 AND role = 'advisor'`,
                [from_advisor_id, to_advisor_id, partnerId]
            );

            if (advisorCheck.rows.length !== 2) {
                throw new Error('One or both advisors do not belong to your organization. Please verify the advisor IDs.');
            }

            const fromAdvisor = advisorCheck.rows.find((a: any) => a.id === from_advisor_id);
            const toAdvisor = advisorCheck.rows.find((a: any) => a.id === to_advisor_id);

            if (!fromAdvisor || !toAdvisor) {
                throw new Error('One or both advisors do not exist in your organization.');
            }

            // 2. Verify the clients being reassigned belong to the source advisor
            const clientCheck = await client.query(
                `SELECT id FROM users 
                 WHERE id = ANY($1) AND advisor_id = $2 AND partner_id = $3 AND role = 'user'`,
                [client_ids, from_advisor_id, partnerId]
            );

            if (clientCheck.rows.length !== client_ids.length) {
                throw new Error('One or more clients do not belong to the source advisor or your organization.');
            }

            // 3. Perform the bulk update within the transaction
            const result = await client.query(
                'UPDATE users SET advisor_id = $1 WHERE id = ANY($2) AND advisor_id = $3 AND partner_id = $4 RETURNING id',
                [to_advisor_id, client_ids, from_advisor_id, partnerId]
            );

            if (result.rows.length === 0) {
                throw new Error('No valid clients found for reassignment. Ensure clients belong to the source advisor and your agency.');
            }

            await client.query('COMMIT');

            return res.status(200).json({
                success: true,
                message: `${result.rows.length} clients reassigned successfully from ${fromAdvisor.full_name} to ${toAdvisor.full_name}`,
                data: { count: result.rows.length }
            });

        } catch (error: any) {
            await client.query('ROLLBACK');
            logger.error('Bulk Reassignment Error', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to reassign clients'
            });
        } finally {
            client.release();
        }
    }

    /**
     * Get Firm Analytics Overview
     * GET /api/partner/analytics
     * 
     * OPTIMIZATION: For heavy aggregations, consider using PostgreSQL Materialized Views.
     * Example:
     * CREATE MATERIALIZED VIEW partner_monthly_aum AS
     * SELECT 
     *     partner_id,
     *     DATE_TRUNC('month', created_at) as month,
     *     COUNT(DISTINCT c.id) as total_clients,
     *     COALESCE(SUM(ph.last_valuation), 0) as total_aum
     * FROM users c
     * LEFT JOIN users a ON c.advisor_id = a.id
     * LEFT JOIN user_portfolios up ON up.user_id = c.id
     * LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = up.id
     * WHERE c.role = 'user'
     * GROUP BY partner_id, DATE_TRUNC('month', created_at);
     * 
     * -- Refresh overnight
     * REFRESH MATERIALIZED VIEW CONCURRENTLY partner_monthly_aum;
     */
    static async getAnalytics(req: Request, res: Response) {
        try {
            const partnerId = (req as any).user.partner_id;

            if (!partnerId) {
                return res.status(403).json({ success: false, message: 'Forbidden' });
            }

            // Current month and previous month for MoM calculation
            const now = new Date();
            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();

            // Simplified query - get all data in separate queries to avoid complex CTE issues
            // 1. Get total stats
            const statsResult = await db.query(
                `SELECT 
                    COUNT(DISTINCT c.id) as total_clients,
                    COALESCE(SUM(ph.last_valuation), 0) as total_aum
                FROM users c
                LEFT JOIN users a ON c.advisor_id = a.id
                LEFT JOIN user_portfolios up ON up.user_id = c.id
                LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = up.id
                WHERE a.partner_id = $1 AND c.role = 'user'`,
                [partnerId]
            );

            // 2. Get leaderboard
            const leaderboardResult = await db.query(
                `SELECT 
                    u.full_name as name,
                    COUNT(DISTINCT c.id) as client_count,
                    COALESCE(SUM(ph.last_valuation), 0) as aum_managed
                FROM users u
                LEFT JOIN users c ON c.advisor_id = u.id AND c.role = 'user'
                LEFT JOIN user_portfolios up ON up.user_id = c.id
                LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = up.id
                WHERE u.partner_id = $1 AND u.role = 'advisor'
                GROUP BY u.id, u.full_name
                ORDER BY aum_managed DESC
                LIMIT 5`,
                [partnerId]
            );

            // 3. Get current month AUM
            const currentMonthResult = await db.query(
                `SELECT COALESCE(SUM(ph.last_valuation), 0) as aum
                FROM users c
                LEFT JOIN users a ON c.advisor_id = a.id
                LEFT JOIN user_portfolios up ON up.user_id = c.id
                LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = up.id
                WHERE a.partner_id = $1 AND c.role = 'user'
                  AND c.created_at >= $2`,
                [partnerId, currentMonthStart]
            );

            // 4. Get previous month AUM
            const prevMonthResult = await db.query(
                `SELECT COALESCE(SUM(ph.last_valuation), 0) as aum
                FROM users c
                LEFT JOIN users a ON c.advisor_id = a.id
                LEFT JOIN user_portfolios up ON up.user_id = c.id
                LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = up.id
                WHERE a.partner_id = $1 AND c.role = 'user'
                  AND c.created_at >= $2 AND c.created_at < $3`,
                [partnerId, prevMonthStart, currentMonthStart]
            );

            // 5. Get historical AUM (last 6 months)
            const historicalResult = await db.query(
                `SELECT 
                    TO_CHAR(DATE_TRUNC('month', c.created_at), 'Mon') as month,
                    COUNT(DISTINCT c.id) as client_count,
                    COALESCE(SUM(ph.last_valuation), 0) as aum
                FROM users c
                LEFT JOIN users a ON c.advisor_id = a.id
                LEFT JOIN user_portfolios up ON up.user_id = c.id
                LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = up.id
                WHERE a.partner_id = $1 AND c.role = 'user'
                  AND c.created_at >= $2
                GROUP BY DATE_TRUNC('month', c.created_at)
                ORDER BY DATE_TRUNC('month', c.created_at) ASC`,
                [partnerId, sixMonthsAgo]
            );

            const totalClients = parseInt(statsResult.rows[0]?.total_clients) || 0;
            const totalAUM = parseFloat(statsResult.rows[0]?.total_aum) || 0;
            const currentMonthAUM = parseFloat(currentMonthResult.rows[0]?.aum) || 0;
            const prevMonthAUM = parseFloat(prevMonthResult.rows[0]?.aum) || 0;

            // Calculate MoM growth dynamically
            const momGrowth = prevMonthAUM > 0 
                ? ((currentMonthAUM - prevMonthAUM) / prevMonthAUM * 100) 
                : (currentMonthAUM > 0 ? 100 : 0);

            // Format historical data for frontend
            const historicalData = (historicalResult.rows || []).map((h: any) => ({
                month: h.month,
                aum: parseFloat(h.aum) || 0
            }));

            // If no historical data, generate placeholder data
            if (historicalData.length === 0) {
                const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
                historicalData.push(...months.map(m => ({ month: m, aum: totalAUM })));
            }

            return res.status(200).json({
                success: true,
                data: {
                    total_firm_aum: totalAUM,
                    total_active_clients: totalClients,
                    mom_growth: parseFloat(momGrowth.toFixed(2)),
                    leaderboard: leaderboardResult.rows || [],
                    historical_aum: historicalData
                }
            });

        } catch (error: any) {
            logger.error('Get Firm Analytics Error', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch firm analytics' });
        }
    }
}

export default PartnerController;
