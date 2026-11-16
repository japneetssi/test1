
import db from '../config/database';

export interface Goal {
    id: string;
    user_id: string;
    family_id?: string | null;
    is_family_goal: boolean;
    name: string;
    target_amount: number;
    target_date: Date;
    current_amount: number;
    monthly_contribution: number;
    priority: 'High' | 'Medium' | 'Low';
    time_horizon?: string;
    category?: string;
    step_up_percentage?: number;
    created_at: Date;
}

export class GoalModel {

    static async create(goal: Partial<Goal>): Promise<Goal> {
        const query = `
            INSERT INTO goals (user_id, family_id, is_family_goal, name, target_amount, target_date, current_amount, monthly_contribution, priority, time_horizon, category, step_up_percentage)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const values = [
            goal.user_id,
            goal.is_family_goal ? goal.family_id : null,
            goal.is_family_goal || false,
            goal.name,
            goal.target_amount,
            goal.target_date,
            goal.current_amount || 0,
            goal.monthly_contribution || 0,
            goal.priority || 'Medium',
            goal.time_horizon || null,
            goal.category || null,
            goal.step_up_percentage || 0
        ];
        const { rows } = await db.query(query, values);
        return rows[0];
    }

    /**
     * Fetch all goals for a user, including family-shared goals if user belongs to a family.
     * Personal goals: user_id = userId
     * Shared goals: is_family_goal = true AND family_id = familyId (even if created by another member)
     */
    static async findByUserAndFamily(userId: string, familyId?: string | null): Promise<Goal[]> {
        if (familyId) {
            const query = `
                SELECT * FROM goals
                WHERE user_id = $1
                   OR (is_family_goal = true AND family_id = $2)
                ORDER BY is_family_goal DESC, created_at DESC;
            `;
            const { rows } = await db.query(query, [userId, familyId]);
            return rows;
        }
        // No family — return only personal goals
        const query = 'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC;';
        const { rows } = await db.query(query, [userId]);
        return rows;
    }

    static async findByUserId(userId: string): Promise<Goal[]> {
        const query = 'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC;';
        const { rows } = await db.query(query, [userId]);
        return rows;
    }

    static async delete(id: string, userId: string): Promise<void> {
        // Allow deletion if the user owns the goal OR is deleting a family goal they created
        const query = 'DELETE FROM goals WHERE id = $1 AND user_id = $2;';
        await db.query(query, [id, userId]);
    }
}
