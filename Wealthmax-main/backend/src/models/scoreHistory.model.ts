import db from '../config/database';

export interface ScoreHistoryEntry {
    id: string;
    user_id: string;
    health_score: number;
    persona_label?: string;
    created_at: Date;
}

export class ScoreHistoryModel {
    /**
     * Save a new score history entry (Updates health_scores table for Phase 1)
     */
    static async saveScore(userId: string, totalScore: number, factors: any): Promise<ScoreHistoryEntry> {
        const result = await db.query(
            `INSERT INTO health_scores (
                user_id, total_score, savings_score, debt_score, 
                liquidity_score, diversity_score, protection_score, goals_score, literacy_score
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, user_id, total_score as health_score, calculated_at as created_at`,
            [
                userId, 
                totalScore, 
                factors.savings?.score || 0,
                factors.debt?.score || 0,
                factors.liquidity?.score || 0,
                factors.diversity?.score || 0,
                factors.protection?.score || 0,
                factors.goals?.score || 0,
                factors.literacy?.score || 0
            ]
        );
        
        return result.rows[0];
    }

    /**
     * Get score history for a user (last N entries)
     */
    static async getHistory(userId: string, limit: number = 30): Promise<ScoreHistoryEntry[]> {
        const result = await db.query(
            `SELECT id, user_id, total_score as health_score, calculated_at as created_at
             FROM health_scores 
             WHERE user_id = $1 
             ORDER BY calculated_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    /**
     * Get the latest score entry for a user
     */
    static async getLatestScore(userId: string): Promise<ScoreHistoryEntry | null> {
        const result = await db.query(
            `SELECT id, user_id, total_score as health_score, calculated_at as created_at,
                    savings_score, debt_score, liquidity_score, diversity_score, protection_score, goals_score, literacy_score
             FROM health_scores 
             WHERE user_id = $1 
             ORDER BY calculated_at DESC 
             LIMIT 1`,
            [userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Calculate global percentile for a given score
     */
    static async getGlobalPercentile(userId: string, currentScore: number): Promise<number> {
        // Query to get the rank of the current score among all users' latest scores
        const result = await db.query(
            `WITH LatestScores AS (
                SELECT DISTINCT ON (user_id) total_score
                FROM health_scores
                ORDER BY user_id, calculated_at DESC
            )
            SELECT 
                (SELECT COUNT(*) FROM LatestScores WHERE total_score <= $1) * 100.0 / 
                NULLIF((SELECT COUNT(*) FROM LatestScores), 0) as percentile`,
            [currentScore]
        );

        const percentile = parseFloat(result.rows[0]?.percentile || "0");
        return Math.min(99, Math.max(1, Math.round(percentile))); // Bound between 1st and 99th percentile
    }
}
