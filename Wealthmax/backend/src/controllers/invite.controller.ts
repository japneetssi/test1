import { Request, Response } from 'express';
import database from '../config/database';
import logger from '../config/logger';

export class InviteController {
    static async validateInvite(req: Request, res: Response) {
        try {
            const { token } = req.params;
            
            const result = await database.query(
                `SELECT advisor_id, partner_id, status, expires_at, client_name, client_email 
                 FROM client_invites 
                 WHERE invite_token = $1`,
                [token]
            );

            if (result.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid invitation token'
                });
            }

            const invite = result.rows[0];

            if (invite.status === 'Accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'This invitation has already been used'
                });
            }

            const expiresAt = new Date(invite.expires_at);
            if (expiresAt < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'This invitation has expired'
                });
            }

            return res.json({
                success: true,
                data: {
                    advisor_id: invite.advisor_id,
                    partner_id: invite.partner_id,
                    client_name: invite.client_name,
                    client_email: invite.client_email
                }
            });
        } catch (err) {
            logger.error('Error validating invite:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async markAsAccepted(token: string) {
        try {
            await database.query(
                `UPDATE client_invites 
                 SET status = 'Accepted', accepted_at = NOW()
                 WHERE invite_token = $1`,
                [token]
            );
        } catch (err) {
            logger.error('Error marking invite as accepted:', err);
            throw err;
        }
    }

    static async sendInvite(req: Request, res: Response) {
        try {
            // Implementation would go here
            return res.json({
                success: true,
                message: 'Invite sent (placeholder)'
            });
        } catch (err) {
            logger.error('Error sending invite:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    static async getInvites(req: Request, res: Response) {
        try {
            // Implementation would go here
            return res.json({
                success: true,
                data: []
            });
        } catch (err) {
            logger.error('Error getting invites:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
