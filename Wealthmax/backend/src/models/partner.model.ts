import db from '../config/database';

export interface PartnerAgency {
    id: string;
    name: string;
    admin_email: string;
    total_clients: number;
    subscription_tier: string;
    status: string;
    logo_url?: string;
    primary_color?: string;
    action_color?: string;
    created_at: Date;
    updated_at: Date;
}

export class PartnerModel {
    static async findById(id: string): Promise<PartnerAgency | null> {
        const result = await db.query('SELECT * FROM partner_agencies WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async updateBranding(id: string, updates: { name?: string, logo_url?: string, primary_color?: string, action_color?: string }): Promise<PartnerAgency> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(updates.name);
        }
        if (updates.logo_url !== undefined) {
            fields.push(`logo_url = $${paramIndex++}`);
            values.push(updates.logo_url);
        }
        if (updates.primary_color) {
            fields.push(`primary_color = $${paramIndex++}`);
            values.push(updates.primary_color);
        }
        if (updates.action_color) {
            fields.push(`action_color = $${paramIndex++}`);
            values.push(updates.action_color);
        }

        if (fields.length === 0) throw new Error('No branding fields to update');

        fields.push(`updated_at = NOW()`);

        values.push(id);
        const query = `UPDATE partner_agencies SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await db.query(query, values);

        if (!result.rows[0]) throw new Error('Partner agency not found');
        return result.rows[0];
    }

    static async getAdvisors(partnerId: string) {
        // Optimized query using JOINs instead of correlated subqueries
        const query = `
            SELECT 
                u.id, 
                u.full_name as name, 
                u.email,
                u.status,
                COUNT(DISTINCT c.id) as assigned_clients,
                COALESCE(SUM(ph.last_valuation), 0) as aum_managed
            FROM users u
            LEFT JOIN users c ON c.advisor_id = u.id AND c.role = 'user'
            LEFT JOIN user_portfolios up ON up.user_id = c.id
            LEFT JOIN portfolio_holdings ph ON ph.portfolio_id = up.id
            WHERE u.partner_id = $1 AND u.role = 'advisor'
            GROUP BY u.id, u.full_name, u.email, u.status
            ORDER BY aum_managed DESC
        `;
        const result = await db.query(query, [partnerId]);
        return result.rows;
    }

    static async getFirmMetrics(partnerId: string) {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM users WHERE partner_id = $1 AND role = 'user') as total_clients,
                COALESCE((
                    SELECT SUM(ph.last_valuation) 
                    FROM portfolio_holdings ph
                    JOIN user_portfolios up ON ph.portfolio_id = up.id
                    JOIN users u ON up.user_id = u.id
                    WHERE u.partner_id = $1
                ), 0) as total_aum,
                (
                    SELECT COUNT(*) 
                    FROM action_alerts aa
                    JOIN users u ON aa.user_id = u.id
                    WHERE u.partner_id = $1 AND aa.status = 'PENDING' AND aa.severity = 'CRITICAL'
                ) as critical_alerts,
                (
                    SELECT COUNT(*) 
                    FROM pledge_requests pr
                    JOIN users u ON pr.user_id = u.id
                    WHERE u.partner_id = $1 AND pr.status = 'PENDING'
                ) as pending_pledges
        `;
        const result = await db.query(query, [partnerId]);
        return result.rows[0];
    }

    static async getFirmClients(partnerId: string) {
        const query = `
            SELECT 
                u.id, u.full_name as name, u.email, u.persona, u.health_score,
                COALESCE((
                    SELECT SUM(ph.last_valuation) 
                    FROM portfolio_holdings ph
                    JOIN user_portfolios up ON ph.portfolio_id = up.id
                    WHERE up.user_id = u.id
                ), 0) as total_assets,
                u.updated_at as last_synced
            FROM users u
            WHERE u.partner_id = $1 AND u.role = 'user'
            ORDER BY u.full_name ASC
        `;
        const result = await db.query(query, [partnerId]);
        return result.rows;
    }

    static async getFirmAlerts(partnerId: string) {
        const query = `
            SELECT 
                aa.*, u.full_name as client_name
            FROM action_alerts aa
            JOIN users u ON aa.user_id = u.id
            WHERE u.partner_id = $1 AND aa.status = 'PENDING'
            ORDER BY aa.created_at DESC
            LIMIT 20
        `;
        const result = await db.query(query, [partnerId]);
        return result.rows;
    }
}
