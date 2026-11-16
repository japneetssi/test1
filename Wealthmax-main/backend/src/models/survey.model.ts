import db from '../config/database';

export interface SurveyResult {
    id: string;
    user_id: string;
    responses: any; // JSONB
    total_score: number;
    final_class: 'Conservative' | 'Moderate' | 'Aggressive';
    created_at: Date;
}

export class SurveyModel {
    static async create(data: Partial<SurveyResult>): Promise<any> {
        const { user_id, final_class } = data;

        // In Phase 1, we store risk_class directly in users table
        const result = await db.query(
            `UPDATE users SET risk_class = $1 WHERE id = $2 RETURNING *`,
            [final_class, user_id]
        );
        return result.rows[0];
    }

    static async findByUserId(userId: string): Promise<any[]> {
        const result = await db.query(
            'SELECT id, risk_class as final_class FROM users WHERE id = $1',
            [userId]
        );
        return result.rows;
    }
}
