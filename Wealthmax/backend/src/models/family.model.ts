import db from '../config/database';

export interface Family {
    id: string;
    name: string;
    head_user_id: string;
    partner_id?: string;
    created_at: Date;
}

export class FamilyModel {
    static async create(name: string, headUserId: string, partnerId: string): Promise<Family> {
        const result = await db.query(
            `INSERT INTO families (name, head_user_id, partner_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, headUserId, partnerId]
        );
        return result.rows[0];
    }

    static async findById(id: string): Promise<Family | null> {
        const result = await db.query('SELECT * FROM families WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async updateMemberFamily(userId: string, familyId: string | null): Promise<void> {
        await db.query(
            'UPDATE users SET family_id = $1 WHERE id = $2',
            [familyId, userId]
        );
    }

    static async getMembers(familyId: string): Promise<any[]> {
        const result = await db.query(
            'SELECT id, email, full_name, role FROM users WHERE family_id = $1',
            [familyId]
        );
        return result.rows;
    }

    static async delete(id: string): Promise<void> {
        await db.query('DELETE FROM families WHERE id = $1', [id]);
    }
}
