import { Request, Response } from 'express';
import db from '../config/database';
import logger from '../config/logger';

export class OnboardingController {
    /**
     * Get all prospects for RM
     * GET /api/rm/onboarding
     */
    static async getProspects(req: Request, res: Response) {
        const rmId = (req as any).user.id;
        try {
            const sql = `
                SELECT * 
                FROM onboarding_prospects 
                WHERE rm_id = $1 
                ORDER BY created_at DESC
            `;
            const result = await db.query(sql, [rmId]);
            return res.status(200).json({ success: true, data: result.rows });
        } catch (error) {
            logger.error('Fetch Prospects Error', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch prospects' });
        }
    }

    /**
     * Create a new prospect
     * POST /api/rm/onboarding
     */
    static async createProspect(req: Request, res: Response) {
        const rmId = (req as any).user.id;
        const { full_name, email, mobile, estimated_aum, notes } = req.body;

        try {
            const sql = `
                INSERT INTO onboarding_prospects (rm_id, full_name, email, mobile, estimated_aum, notes, stage)
                VALUES ($1, $2, $3, $4, $5, $6, 'Prospect')
                RETURNING *
            `;
            const result = await db.query(sql, [
                rmId, full_name, email, mobile, estimated_aum || 0, notes
            ]);

            return res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            logger.error('Create Prospect Error', error);
            return res.status(500).json({ success: false, message: 'Failed to add prospect' });
        }
    }

    /**
     * Update prospect stage
     * PATCH /api/rm/onboarding/:id
     */
    static async updateStage(req: Request, res: Response) {
        const { id } = req.params;
        const { stage } = req.body;
        const rmId = (req as any).user.id;

        const validStages = ['Prospect', 'Documentation', 'KYC', 'Funded'];
        if (!validStages.includes(stage)) {
            return res.status(400).json({ success: false, message: 'Invalid onboarding stage' });
        }

        try {
            // Verify ownership and update
            const sql = `
                UPDATE onboarding_prospects 
                SET stage = $1, last_contact = CURRENT_TIMESTAMP
                WHERE id = $2 AND rm_id = $3
                RETURNING *
            `;
            const result = await db.query(sql, [stage, id, rmId]);

            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'Prospect not found or unauthorized' });
            }

            return res.status(200).json({ success: true, data: result.rows[0] });
        } catch (error) {
            logger.error('Update Prospect Stage Error', error);
            return res.status(500).json({ success: false, message: 'Failed to update stage' });
        }
    }

    /**
     * Delete a prospect
     * DELETE /api/rm/onboarding/:id
     */
    static async deleteProspect(req: Request, res: Response) {
        const { id } = req.params;
        const rmId = (req as any).user.id;

        try {
            const sql = `DELETE FROM onboarding_prospects WHERE id = $1 AND rm_id = $2`;
            const result = await db.query(sql, [id, rmId]);

            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'Prospect not found or unauthorized' });
            }

            return res.status(200).json({ success: true, message: 'Prospect removed from pipeline' });
        } catch (error) {
            logger.error('Delete Prospect Error', error);
            return res.status(500).json({ success: false, message: 'Failed to delete prospect' });
        }
    }
}
