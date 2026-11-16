import db from '../config/database';

export interface User {
    id: string;
    email: string;
    mobile: string;
    full_name: string;
    pan_encrypted?: string;
    pan_number?: string;
    kyc_status: string;
    assigned_persona?: string;
    risk_class?: string;
    risk_score?: number;
    dob?: Date;
    occupation?: string;
    marital_status?: string;
    retirement_age_goal?: number;
    govt_id_type?: string;
    govt_id_number_encrypted?: string;
    govt_id_number?: string;
    address?: string;
    role: 'user' | 'advisor' | 'admin';
    partner_id?: string;
    advisor_id?: string;
    family_id?: string;
    created_at: Date;
    status?: string;
    invitation_token?: string | null;
}

 

export class UserModel {
    static async create(user: Partial<User>): Promise<User> {
        const { email, mobile, full_name, role, dob, pan_encrypted, partner_id, advisor_id, occupation, marital_status, retirement_age_goal, govt_id_type, govt_id_number_encrypted, address } = user;

        const result = await db.query(
            `INSERT INTO users (email, mobile, full_name, role, dob, pan_encrypted, partner_id, advisor_id, occupation, marital_status, retirement_age_goal, govt_id_type, govt_id_number_encrypted, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [email, mobile, full_name, role || 'user', dob, pan_encrypted, partner_id, advisor_id, occupation, marital_status, retirement_age_goal, govt_id_type, govt_id_number_encrypted, address]
        );
        return result.rows[0];
    }

    static async findByEmail(email: string): Promise<User | null> {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }

    static async findByMobile(mobile: string): Promise<User | null> {
        const result = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
        return result.rows[0] || null;
    }

    static async findById(id: string): Promise<User | null> {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    static async update(id: string, updates: Partial<User>): Promise<User> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        for (const [key, value] of Object.entries(updates)) {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }
        if (fields.length === 0) throw new Error('No fields to update');
        values.push(id);
        const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await db.query(query, values);
        if (!result.rows[0]) throw new Error('User not found');
        return result.rows[0];
    }

    // Backward compatibility wrapper for updateProfile calls
    static async updateProfile(id: string, updates: Partial<User>): Promise<User> {
        // Reuse the generic update method to modify user fields.
        return this.update(id, updates);
    }

}

