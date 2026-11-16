import db from '../config/database';

// ============================================================
// INCOME TYPES & MODEL
// ============================================================

export interface IncomeSource {
    id?: string;
    income_id?: string;
    source: string;
    amount: number;
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
    created_at?: Date;
    updated_at?: Date;
}

export interface Income {
    id?: string;
    user_id: string;
    base_income: number;
    sources?: IncomeSource[];
    created_at?: Date;
    updated_at?: Date;
}

export class IncomeModel {
    static async findByUserId(userId: string): Promise<Income | null> {
        const result = await db.query('SELECT * FROM incomes WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) return null;
        
        const income = result.rows[0];
        const sourcesResult = await db.query('SELECT * FROM income_sources WHERE income_id = $1', [income.id]);
        income.sources = sourcesResult.rows;
        
        return income;
    }

    static async create(income: Partial<Income>): Promise<Income> {
        const result = await db.query(
            'INSERT INTO incomes (user_id, base_income) VALUES ($1, $2) RETURNING *',
            [income.user_id, income.base_income || 0]
        );
        
        const createdIncome = result.rows[0];
        
        if (income.sources && income.sources.length > 0) {
            for (const source of income.sources) {
                await db.query(
                    'INSERT INTO income_sources (income_id, source, amount, frequency) VALUES ($1, $2, $3, $4) RETURNING *',
                    [createdIncome.id, source.source, source.amount, source.frequency]
                );
            }
        }
        
        const sourcesResult = await db.query('SELECT * FROM income_sources WHERE income_id = $1', [createdIncome.id]);
        createdIncome.sources = sourcesResult.rows;
        
        return createdIncome;
    }

    static async update(userId: string, updates: Partial<Income>): Promise<Income | null> {
        const existing = await this.findByUserId(userId);
        if (!existing) {
            return this.create({ ...updates, user_id: userId });
        }

        if (updates.base_income !== undefined) {
            await db.query('UPDATE incomes SET base_income = $1 WHERE id = $2', [updates.base_income, existing.id]);
        }

        if (updates.sources) {
            await db.query('DELETE FROM income_sources WHERE income_id = $1', [existing.id]);
            for (const source of updates.sources) {
                await db.query(
                    'INSERT INTO income_sources (income_id, source, amount, frequency) VALUES ($1, $2, $3, $4)',
                    [existing.id, source.source, source.amount, source.frequency]
                );
            }
        }

        return this.findByUserId(userId);
    }
}

// ============================================================
// EXPENSE TYPES & MODEL
// ============================================================

export interface ExpenseSource {
    id?: string;
    expense_id?: string;
    source: string;
    amount: number;
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
    created_at?: Date;
    updated_at?: Date;
}

export interface Expense {
    id?: string;
    user_id: string;
    base_expenses: number;
    sources?: ExpenseSource[];
    created_at?: Date;
    updated_at?: Date;
}

export class ExpenseModel {
    static async findByUserId(userId: string): Promise<Expense | null> {
        const result = await db.query('SELECT * FROM expenses WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) return null;
        
        const expense = result.rows[0];
        const sourcesResult = await db.query('SELECT * FROM expense_sources WHERE expense_id = $1', [expense.id]);
        expense.sources = sourcesResult.rows;
        
        return expense;
    }

    static async create(expense: Partial<Expense>): Promise<Expense> {
        const result = await db.query(
            'INSERT INTO expenses (user_id, base_expenses) VALUES ($1, $2) RETURNING *',
            [expense.user_id, expense.base_expenses || 0]
        );
        
        const createdExpense = result.rows[0];
        
        if (expense.sources && expense.sources.length > 0) {
            for (const source of expense.sources) {
                await db.query(
                    'INSERT INTO expense_sources (expense_id, source, amount, frequency) VALUES ($1, $2, $3, $4) RETURNING *',
                    [createdExpense.id, source.source, source.amount, source.frequency]
                );
            }
        }
        
        const sourcesResult = await db.query('SELECT * FROM expense_sources WHERE expense_id = $1', [createdExpense.id]);
        createdExpense.sources = sourcesResult.rows;
        
        return createdExpense;
    }

    static async update(userId: string, updates: Partial<Expense>): Promise<Expense | null> {
        const existing = await this.findByUserId(userId);
        if (!existing) {
            return this.create({ ...updates, user_id: userId });
        }

        if (updates.base_expenses !== undefined) {
            await db.query('UPDATE expenses SET base_expenses = $1 WHERE id = $2', [updates.base_expenses, existing.id]);
        }

        if (updates.sources) {
            await db.query('DELETE FROM expense_sources WHERE expense_id = $1', [existing.id]);
            for (const source of updates.sources) {
                await db.query(
                    'INSERT INTO expense_sources (expense_id, source, amount, frequency) VALUES ($1, $2, $3, $4)',
                    [existing.id, source.source, source.amount, source.frequency]
                );
            }
        }

        return this.findByUserId(userId);
    }
}

// ============================================================
// ASSET TYPES & MODEL
// ============================================================

export interface OtherAsset {
    id?: string;
    asset_id?: string;
    name: string;
    amount: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface Asset {
    id?: string;
    user_id: string;
    // Financial Assets
    bank_balance: number;
    fixed_deposits: number;
    mutual_funds: number;
    bonds: number;
    provident_fund: number;
    gold_etfs: number;
    // Physical Assets
    land_property: number;
    vehicles: number;
    gold_physical: number;
    // Other Assets
    other_assets?: OtherAsset[];
    created_at?: Date;
    updated_at?: Date;
}

export class AssetModel {
    static async findByUserId(userId: string): Promise<Asset | null> {
        const result = await db.query('SELECT * FROM assets WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) return null;
        
        const asset = result.rows[0];
        const otherAssetsResult = await db.query('SELECT * FROM other_assets WHERE asset_id = $1', [asset.id]);
        asset.other_assets = otherAssetsResult.rows;
        
        return asset;
    }

    static async create(asset: Partial<Asset>): Promise<Asset> {
        const result = await db.query(
            `INSERT INTO assets (
                user_id, bank_balance, fixed_deposits, mutual_funds, bonds, provident_fund, 
                gold_etfs, land_property, vehicles, gold_physical
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                asset.user_id,
                asset.bank_balance || 0,
                asset.fixed_deposits || 0,
                asset.mutual_funds || 0,
                asset.bonds || 0,
                asset.provident_fund || 0,
                asset.gold_etfs || 0,
                asset.land_property || 0,
                asset.vehicles || 0,
                asset.gold_physical || 0
            ]
        );
        
        const createdAsset = result.rows[0];
        
        if (asset.other_assets && asset.other_assets.length > 0) {
            for (const other of asset.other_assets) {
                await db.query(
                    'INSERT INTO other_assets (asset_id, name, amount) VALUES ($1, $2, $3) RETURNING *',
                    [createdAsset.id, other.name, other.amount]
                );
            }
        }
        
        const otherAssetsResult = await db.query('SELECT * FROM other_assets WHERE asset_id = $1', [createdAsset.id]);
        createdAsset.other_assets = otherAssetsResult.rows;
        
        return createdAsset;
    }

    static async update(userId: string, updates: Partial<Asset>): Promise<Asset | null> {
        const existing = await this.findByUserId(userId);
        if (!existing) {
            return this.create({ ...updates, user_id: userId });
        }

        const fields = ['bank_balance', 'fixed_deposits', 'mutual_funds', 'bonds', 'provident_fund', 
                       'gold_etfs', 'land_property', 'vehicles', 'gold_physical'];
        
        const setClauses: string[] = [];
        const values: any[] = [existing.id];
        let paramIndex = 2;

        for (const field of fields) {
            if (updates[field as keyof Asset] !== undefined) {
                setClauses.push(`${field} = $${paramIndex}`);
                values.push(updates[field as keyof Asset]);
                paramIndex++;
            }
        }

        if (setClauses.length > 0) {
            const query = `UPDATE assets SET ${setClauses.join(', ')} WHERE id = $1`;
            await db.query(query, values);
        }

        if (updates.other_assets) {
            await db.query('DELETE FROM other_assets WHERE asset_id = $1', [existing.id]);
            for (const other of updates.other_assets) {
                await db.query(
                    'INSERT INTO other_assets (asset_id, name, amount) VALUES ($1, $2, $3)',
                    [existing.id, other.name, other.amount]
                );
            }
        }

        return this.findByUserId(userId);
    }
}

// ============================================================
// LIABILITY TYPES & MODEL
// ============================================================

export interface Liability {
    id?: string;
    user_id: string;
    home_loan: number;
    personal_loan: number;
    car_loan: number;
    credit_card_loan: number;
    business_loan: number;
    other_liabilities: number;
    created_at?: Date;
    updated_at?: Date;
}

export class LiabilityModel {
    static async findByUserId(userId: string): Promise<Liability | null> {
        const result = await db.query('SELECT * FROM liabilities WHERE user_id = $1', [userId]);
        return result.rows[0] || null;
    }

    static async create(liability: Partial<Liability>): Promise<Liability> {
        const result = await db.query(
            `INSERT INTO liabilities (
                user_id, home_loan, personal_loan, car_loan, credit_card_loan, business_loan, other_liabilities
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                liability.user_id,
                liability.home_loan || 0,
                liability.personal_loan || 0,
                liability.car_loan || 0,
                liability.credit_card_loan || 0,
                liability.business_loan || 0,
                liability.other_liabilities || 0
            ]
        );
        return result.rows[0];
    }

    static async update(userId: string, updates: Partial<Liability>): Promise<Liability | null> {
        const existing = await this.findByUserId(userId);
        if (!existing) {
            return this.create({ ...updates, user_id: userId });
        }

        const fields = ['home_loan', 'personal_loan', 'car_loan', 'credit_card_loan', 
                       'business_loan', 'other_liabilities'];
        
        const setClauses: string[] = [];
        const values: any[] = [existing.id];
        let paramIndex = 2;

        for (const field of fields) {
            if (updates[field as keyof Liability] !== undefined) {
                setClauses.push(`${field} = $${paramIndex}`);
                values.push(updates[field as keyof Liability]);
                paramIndex++;
            }
        }

        if (setClauses.length > 0) {
            const query = `UPDATE liabilities SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
            const result = await db.query(query, values);
            return result.rows[0];
        }

        return existing;
    }
}

// ============================================================
// SAFETY NET TYPES & MODEL
// ============================================================

export interface Dependent {
    id?: string;
    safety_net_id?: string;
    name: string;
    age: number;
    income: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface SafetyNet {
    id?: string;
    user_id: string;
    emergency_fund: number;
    life_insurance: number;
    health_insurance: number;
    general_insurance: number;
    dependents?: Dependent[];
    created_at?: Date;
    updated_at?: Date;
}

export class SafetyNetModel {
    static async findByUserId(userId: string): Promise<SafetyNet | null> {
        const result = await db.query('SELECT * FROM safety_nets WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) return null;
        
        const safetyNet = result.rows[0];
        const dependentsResult = await db.query('SELECT * FROM safety_net_dependents WHERE safety_net_id = $1', [safetyNet.id]);
        safetyNet.dependents = dependentsResult.rows;
        
        return safetyNet;
    }

    static async create(safetyNet: Partial<SafetyNet>): Promise<SafetyNet> {
        const result = await db.query(
            `INSERT INTO safety_nets (
                user_id, emergency_fund, life_insurance, health_insurance, general_insurance
            ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                safetyNet.user_id,
                safetyNet.emergency_fund || 0,
                safetyNet.life_insurance || 0,
                safetyNet.health_insurance || 0,
                safetyNet.general_insurance || 0
            ]
        );
        
        const createdSafetyNet = result.rows[0];
        
        if (safetyNet.dependents && safetyNet.dependents.length > 0) {
            for (const dep of safetyNet.dependents) {
                await db.query(
                    'INSERT INTO safety_net_dependents (safety_net_id, name, age, income) VALUES ($1, $2, $3, $4) RETURNING *',
                    [createdSafetyNet.id, dep.name, dep.age, dep.income]
                );
            }
        }
        
        const dependentsResult = await db.query('SELECT * FROM safety_net_dependents WHERE safety_net_id = $1', [createdSafetyNet.id]);
        createdSafetyNet.dependents = dependentsResult.rows;
        
        return createdSafetyNet;
    }

    static async update(userId: string, updates: Partial<SafetyNet>): Promise<SafetyNet | null> {
        const existing = await this.findByUserId(userId);
        if (!existing) {
            return this.create({ ...updates, user_id: userId });
        }

        const fields = ['emergency_fund', 'life_insurance', 'health_insurance', 'general_insurance'];
        
        const setClauses: string[] = [];
        const values: any[] = [existing.id];
        let paramIndex = 2;

        for (const field of fields) {
            if (updates[field as keyof SafetyNet] !== undefined) {
                setClauses.push(`${field} = $${paramIndex}`);
                values.push(updates[field as keyof SafetyNet]);
                paramIndex++;
            }
        }

        if (setClauses.length > 0) {
            const query = `UPDATE safety_nets SET ${setClauses.join(', ')} WHERE id = $1`;
            await db.query(query, values);
        }

        if (updates.dependents) {
            await db.query('DELETE FROM safety_net_dependents WHERE safety_net_id = $1', [existing.id]);
            for (const dep of updates.dependents) {
                await db.query(
                    'INSERT INTO safety_net_dependents (safety_net_id, name, age, income) VALUES ($1, $2, $3, $4)',
                    [existing.id, dep.name, dep.age, dep.income]
                );
            }
        }

        return this.findByUserId(userId);
    }
}
