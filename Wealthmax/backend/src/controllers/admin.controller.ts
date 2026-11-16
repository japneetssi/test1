import { Request, Response } from 'express';
import db from '../config/database';
import logger from '../config/logger';

export class AdminController {
    /**
     * Get Super Admin Dashboard Data
     * GET /api/admin/dashboard
     */
    static async getDashboardData(req: Request, res: Response) {
        try {
            // 1. Fetch Latest Platform Metrics
            const metricsResult = await db.query(
                `SELECT * FROM platform_metrics ORDER BY updated_at DESC LIMIT 1`
            );
            const metrics = metricsResult.rows[0] || {
                total_aum: 0,
                active_users_count: 0,
                onboarded_partners_count: 0,
                onboarded_advisors_count: 0,
                wealth_margin: 0
            };

            // 2. Fetch Partner Agencies
            const partnersResult = await db.query(
                `SELECT id, name, admin_email, total_clients, subscription_tier, status FROM partner_agencies ORDER BY created_at DESC`
            );

            // 3. System Health - For now return empty or simple status until a monitoring system is built
            const systemHealth: any[] = [];

            res.status(200).json({
                success: true,
                data: {
                    metrics: {
                        totalAdvisors: metrics.onboarded_advisors_count || 0,
                        totalAdvisorsGrowth: "", 
                        totalClients: metrics.active_users_count || 0,
                        totalClientsGrowth: "",
                        platformAUM: metrics.total_aum || 0,
                        platformAUMGrowth: "",
                        activeOptionWealthMargin: metrics.wealth_margin || 0,
                        activeOptionWealthMarginDetails: ""
                    },
                    partners: partnersResult.rows || [],
                    systemHealth
                }
            });

        } catch (error: any) {
            logger.error('Admin Dashboard Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch admin dashboard data'
            });
        }
    }

    /**
     * Onboard a New Partner Agency
     * POST /api/admin/onboard-partner
     */
    static async onboardPartner(req: Request, res: Response) {
        const { name, admin_email, subscription_tier } = req.body;

        if (!name || !admin_email) {
            return res.status(400).json({
                success: false,
                message: 'Agency name and admin email are required'
            });
        }

        try {
            await db.query('BEGIN');

            // 1. Create Partner Agency
            const partnerResult = await db.query(
                `INSERT INTO partner_agencies (name, admin_email, subscription_tier) 
                 VALUES ($1, $2, $3) 
                 RETURNING id`,
                [name, admin_email, subscription_tier || 'Business Pro']
            );
            const partnerId = partnerResult.rows[0].id;

            // 2. Create Partner Admin User
            const userResult = await db.query(
                `INSERT INTO users (full_name, email, role, partner_id) 
                 VALUES ($1, $2, 'partner', $3) 
                 ON CONFLICT (email) DO UPDATE SET role = 'partner', partner_id = $3
                 RETURNING id`,
                [name + ' Admin', admin_email, partnerId]
            );

            // 3. Update Platform Metrics
            await db.query(
                `UPDATE platform_metrics SET onboarded_partners_count = onboarded_partners_count + 1`
            );

            await db.query('COMMIT');

            return res.status(201).json({
                success: true,
                message: 'Partner agency onboarded successfully',
                data: {
                    partnerId,
                    userId: userResult.rows[0].id
                }
            });

        } catch (error: any) {
            await db.query('ROLLBACK');
            logger.error('Onboard Partner Error', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to onboard partner agency'
            });
        }
    }
}
