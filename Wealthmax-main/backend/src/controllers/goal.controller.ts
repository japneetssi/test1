
import { Request, Response } from 'express';
import { GoalModel } from '../models/goal.model';
import { HealthService } from '../services/health.service';
import { ProfileModel } from '../models/profile.model';
import { UserModel } from '../models/user.model';

export class GoalController {

    static async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // Determine family_id if sharing with family
            let familyId: string | null = null;
            const isFamilyGoal = !!req.body.is_family_goal;

            if (isFamilyGoal) {
                const user = await UserModel.findById(userId);
                familyId = user?.family_id || null;

                if (!familyId) {
                    return res.status(400).json({
                        success: false,
                        message: 'You must be part of a family unit to share a goal with your family.'
                    });
                }
            }

            const goalData = {
                ...req.body,
                user_id: userId,
                family_id: familyId,
                is_family_goal: isFamilyGoal
            };

            const goal = await GoalModel.create(goalData);

            // Trigger score update
            const profile = await ProfileModel.findByUserId(userId);
            if (profile) {
                const user = await UserModel.findById(userId);
                await HealthService.recalculate(userId, profile, user?.risk_score || 50, user?.assigned_persona);
            }

            return res.json({ success: true, data: goal });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getAll(req: Request, res: Response) {
        try {
            const userId = (req as any).targetUserId || (req as any).user.id;

            // Fetch user's family_id to include shared family goals
            const user = await UserModel.findById(userId);
            const familyId = user?.family_id || null;

            const goals = await GoalModel.findByUserAndFamily(userId, familyId);
            return res.json({ success: true, data: goals });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await GoalModel.delete(id, userId);

            // Trigger score update
            const profile = await ProfileModel.findByUserId(userId);
            if (profile) {
                const user = await UserModel.findById(userId);
                await HealthService.recalculate(userId, profile, user?.risk_score || 50, user?.assigned_persona);
            }

            return res.json({ success: true, message: 'Goal deleted' });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
