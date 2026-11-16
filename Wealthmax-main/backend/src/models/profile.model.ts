import db from '../config/database';

export interface FinancialProfile {
    user_id: string;
    dependents: number;
    gross_income: number;
    fixed_expenses: number;
    liabilities_emi: number;
    existing_assets: number;
    emergency_fund_amount: number;
    insurance_cover: number;
    total_liabilities: number;
    other_income?: number;
    household_expenses?: number;
    bank_balance?: number;
    fixed_deposits?: number;
    trading_capital?: number;
    gold_assets?: number;
    real_estate_assets?: number;
    home_loan?: number;
    personal_loan?: number;
    health_insurance_cover?: number;
    is_active_trader?: boolean;
    trading_capital_allocation_percent?: number;
    trading_strategies?: string[];
    marital_status?: string;
    occupation?: string;
    retirement_age_goal?: number;
    income_details?: any[];
    expense_details?: any[];
    asset_details?: any[];
    liability_details?: any[];
    safety_net_details?: any[];
    dependent_details?: any[];
    updated_at: Date;
}

export class ProfileModel {
    static async create(profile: Partial<FinancialProfile>): Promise<FinancialProfile> {
        const {
            user_id,
            dependents = 0,
            gross_income = 0,
            fixed_expenses = 0,
            liabilities_emi = 0,
            existing_assets = 0,
            emergency_fund_amount = 0,
            insurance_cover = 0,
            total_liabilities = 0,
            other_income = 0,
            household_expenses = 0,
            bank_balance = 0,
            fixed_deposits = 0,
            trading_capital = 0,
            gold_assets = 0,
            real_estate_assets = 0,
            home_loan = 0,
            personal_loan = 0,
            health_insurance_cover = 0,
            is_active_trader = false,
            trading_capital_allocation_percent = 25,
            trading_strategies = [],
            marital_status,
            occupation,
            retirement_age_goal,
            income_details = [],
            expense_details = [],
            asset_details = [],
            liability_details = [],
            safety_net_details = [],
            dependent_details = []
        } = profile;

        const result = await db.query(
            `INSERT INTO profiles (
                user_id, dependents, gross_income, fixed_expenses, 
                liabilities_emi, existing_assets, emergency_fund_amount, insurance_cover,
                total_liabilities, other_income, household_expenses, bank_balance,
                fixed_deposits, trading_capital, gold_assets, real_estate_assets,
                home_loan, personal_loan, health_insurance_cover, is_active_trader,
                trading_capital_allocation_percent, trading_strategies, marital_status, occupation, retirement_age_goal,
                income_details, expense_details, asset_details, liability_details, safety_net_details, dependent_details
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
            RETURNING *`,
            [
                user_id, dependents, gross_income, fixed_expenses, 
                liabilities_emi, existing_assets, emergency_fund_amount, insurance_cover,
                total_liabilities, other_income, household_expenses, bank_balance,
                fixed_deposits, trading_capital, gold_assets, real_estate_assets,
                home_loan, personal_loan, health_insurance_cover, is_active_trader,
                trading_capital_allocation_percent, trading_strategies, marital_status, occupation, retirement_age_goal,
                JSON.stringify(income_details), JSON.stringify(expense_details), JSON.stringify(asset_details), JSON.stringify(liability_details), JSON.stringify(safety_net_details), JSON.stringify(dependent_details)
            ]
        );
        return result.rows[0];
    }

    static async findByUserId(userId: string): Promise<FinancialProfile | null> {
        const result = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        return result.rows[0] || null;
    }

    static async update(userId: string, updates: Partial<FinancialProfile>): Promise<FinancialProfile | null> {
        const fields = Object.keys(updates).filter(key => key !== 'user_id' && key !== 'updated_at');

        if (fields.length === 0) return null;

        const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = fields.map(key => {
            const val = (updates as any)[key];
            if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
               return val; // leave as object
            }
            if (Array.isArray(val)) {
                if (key === 'trading_strategies') {
                    return val; // pg will serialize as postgres array for text[]
                }
                return JSON.stringify(val); // serialize as JSON string for jsonb columns
            }
            return val;
        });

        const query = `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE user_id = $1 RETURNING *`;
        
        const result = await db.query(query, [userId, ...values]);
        return result.rows[0] || null;
    }

    // --- Action Alerts Management (Previously action_items) --- //

    static async saveActionItems(userId: string, items: any[]) {
        // Clear old unresolved items (or all items, depending on MVP logic)
        await db.query('DELETE FROM action_items WHERE user_id = $1', [userId]);

        if (!items || items.length === 0) return;

        for (const item of items) {
            await db.query(
                `INSERT INTO action_items 
                 (user_id, risk_type, severity, problem_statement, gap_amount, estimated_score_impact)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    userId,
                    item.title || item.type || 'Action Required',
                    item.priority || 'Medium',
                    item.description || item.advice || 'Review and address this action item',
                    item.gap_amount || 0,
                    item.estimated_score_impact || 0
                ]
            );
        }
    }

    static async getActionItems(userId: string) {
        const result = await db.query('SELECT * FROM action_items WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        // Map back to the keys the frontend expects for now, to minimize frontend changes
        return result.rows.map(row => ({
            id: row.id,
            title: row.risk_type,
            description: row.problem_statement,
            severity: row.severity,
            status: row.is_resolved ? 'completed' : 'pending',
            action: null,
            linked_tool: null
        }));
    }

    static async updateActionItemStatus(itemId: string, status: string, userId: string) {
        const isResolved = status === 'completed';
        const result = await db.query(
            'UPDATE action_items SET is_resolved = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [isResolved, itemId, userId]
        );
        return result.rows[0];
    }
}
