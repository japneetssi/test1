import db from '../config/database';

export interface PlaidItem {
    id?: string;
    user_id: string;
    access_token: string;
    item_id: string;
    institution_id?: string;
    institution_name?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface PlaidAccount {
    id?: string;
    plaid_item_id: string;
    account_id: string;
    name: string;
    official_name?: string;
    type: string;
    subtype?: string;
    mask?: string;
    current_balance?: number;
    available_balance?: number;
    iso_currency_code?: string;
    created_at?: Date;
    updated_at?: Date;
}

export class PlaidModel {
    /**
     * Save a new Plaid Item
     */
    static async saveItem(item: PlaidItem): Promise<PlaidItem> {
        const result = await db.query(
            `INSERT INTO plaid_items 
             (user_id, access_token, item_id, institution_id, institution_name)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (item_id) DO UPDATE SET 
                access_token = EXCLUDED.access_token,
                updated_at = current_timestamp
             RETURNING *`,
            [item.user_id, item.access_token, item.item_id, item.institution_id, item.institution_name]
        );
        return result.rows[0];
    }

    /**
     * Get all Plaid Items for a user
     */
    static async getItemsByUserId(userId: string): Promise<PlaidItem[]> {
        const result = await db.query(
            'SELECT * FROM plaid_items WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    /**
     * Save accounts for a Plaid Item
     */
    static async saveAccounts(plaidItemId: string, accounts: Omit<PlaidAccount, 'plaid_item_id'>[]): Promise<PlaidAccount[]> {
        const savedAccounts: PlaidAccount[] = [];
        
        for (const acc of accounts) {
            const result = await db.query(
                `INSERT INTO plaid_accounts 
                 (plaid_item_id, account_id, name, official_name, type, subtype, mask, current_balance, available_balance, iso_currency_code)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (account_id) DO UPDATE SET 
                    current_balance = EXCLUDED.current_balance,
                    available_balance = EXCLUDED.available_balance,
                    updated_at = current_timestamp
                 RETURNING *`,
                [
                    plaidItemId,
                    acc.account_id,
                    acc.name,
                    acc.official_name,
                    acc.type,
                    acc.subtype,
                    acc.mask,
                    acc.current_balance,
                    acc.available_balance,
                    acc.iso_currency_code
                ]
            );
            savedAccounts.push(result.rows[0]);
        }
        
        return savedAccounts;
    }

    /**
     * Get all Plaid Accounts for a user
     */
    static async getAccountsByUserId(userId: string): Promise<PlaidAccount[]> {
        const result = await db.query(
            `SELECT pa.*, pi.institution_name 
             FROM plaid_accounts pa
             JOIN plaid_items pi ON pa.plaid_item_id = pi.id
             WHERE pi.user_id = $1
             ORDER BY pi.institution_name, pa.name`,
            [userId]
        );
        return result.rows;
    }
}
