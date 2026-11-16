/* eslint-disable camelcase */

/**
 * Phase 2 fix #6 - Missing relational financial tables.
 *
 * The IncomeModel / ExpenseModel / AssetModel / LiabilityModel / SafetyNetModel
 * (src/models/financial.model.ts) query the relational tables below, which only
 * previously existed in an unapplied Supabase-flavoured SQL file (auth.users
 * references did not fit this backend). This migration creates them against
 * the backend's own users table so /api/v1/financial/* endpoints work.
 */

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];

const CREATE_TRIGGER_SQL = `
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $fn$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $fn$ language 'plpgsql';
END $$;
`;

function attachUpdatedTriggers(pgm, tables) {
    for (const table of tables) {
        // Trigger names are unique per table; drop + re-create keeps this idempotent.
        pgm.sql(`
            DROP TRIGGER IF EXISTS update_${table}_modtime ON ${table};
            CREATE TRIGGER update_${table}_modtime
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE PROCEDURE update_modified_column();
        `);
    }
}

exports.up = (pgm) => {
    pgm.sql(`
        DO $$
        BEGIN
            CREATE TYPE frequency_type AS ENUM ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
    `);
    pgm.sql(CREATE_TRIGGER_SQL);

    // ---------------- Income ----------------
    pgm.createTable('incomes', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            unique: true,
            references: '"users"',
            onDelete: 'CASCADE',
        },
        base_income: { type: 'numeric(15,2)', default: 0 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    pgm.createTable('income_sources', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        income_id: {
            type: 'uuid',
            notNull: true,
            references: '"incomes"',
            onDelete: 'CASCADE',
        },
        source: { type: 'text', notNull: true },
        amount: { type: 'numeric(15,2)', notNull: true, default: 0 },
        frequency: { type: 'frequency_type', notNull: true, default: 'Monthly' },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    // ---------------- Expenses ----------------
    pgm.createTable('expenses', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            unique: true,
            references: '"users"',
            onDelete: 'CASCADE',
        },
        base_expenses: { type: 'numeric(15,2)', default: 0 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    pgm.createTable('expense_sources', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        expense_id: {
            type: 'uuid',
            notNull: true,
            references: '"expenses"',
            onDelete: 'CASCADE',
        },
        source: { type: 'text', notNull: true },
        amount: { type: 'numeric(15,2)', notNull: true, default: 0 },
        frequency: { type: 'frequency_type', notNull: true, default: 'Monthly' },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    // ---------------- Assets ----------------
    pgm.createTable('assets', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            unique: true,
            references: '"users"',
            onDelete: 'CASCADE',
        },
        bank_balance: { type: 'numeric(15,2)', default: 0 },
        fixed_deposits: { type: 'numeric(15,2)', default: 0 },
        mutual_funds: { type: 'numeric(15,2)', default: 0 },
        bonds: { type: 'numeric(15,2)', default: 0 },
        provident_fund: { type: 'numeric(15,2)', default: 0 },
        gold_etfs: { type: 'numeric(15,2)', default: 0 },
        land_property: { type: 'numeric(15,2)', default: 0 },
        vehicles: { type: 'numeric(15,2)', default: 0 },
        gold_physical: { type: 'numeric(15,2)', default: 0 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    pgm.createTable('other_assets', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        asset_id: {
            type: 'uuid',
            notNull: true,
            references: '"assets"',
            onDelete: 'CASCADE',
        },
        name: { type: 'text', notNull: true },
        amount: { type: 'numeric(15,2)', notNull: true, default: 0 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    // ---------------- Liabilities ----------------
    pgm.createTable('liabilities', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            unique: true,
            references: '"users"',
            onDelete: 'CASCADE',
        },
        home_loan: { type: 'numeric(15,2)', default: 0 },
        personal_loan: { type: 'numeric(15,2)', default: 0 },
        car_loan: { type: 'numeric(15,2)', default: 0 },
        credit_card_loan: { type: 'numeric(15,2)', default: 0 },
        business_loan: { type: 'numeric(15,2)', default: 0 },
        other_liabilities: { type: 'numeric(15,2)', default: 0 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    // ---------------- Safety Net ----------------
    pgm.createTable('safety_nets', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            unique: true,
            references: '"users"',
            onDelete: 'CASCADE',
        },
        emergency_fund: { type: 'numeric(15,2)', default: 0 },
        life_insurance: { type: 'numeric(15,2)', default: 0 },
        health_insurance: { type: 'numeric(15,2)', default: 0 },
        general_insurance: { type: 'numeric(15,2)', default: 0 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    pgm.createTable('safety_net_dependents', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        safety_net_id: {
            type: 'uuid',
            notNull: true,
            references: '"safety_nets"',
            onDelete: 'CASCADE',
        },
        name: { type: 'text', notNull: true },
        age: { type: 'integer', notNull: true, default: 0 },
        income: { type: 'numeric(15,2)', notNull: true, default: 0 },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    });

    // Child-table foreign key indexes
    pgm.createIndex('income_sources', 'income_id');
    pgm.createIndex('expense_sources', 'expense_id');
    pgm.createIndex('other_assets', 'asset_id');
    pgm.createIndex('safety_net_dependents', 'safety_net_id');

    attachUpdatedTriggers(pgm, [
        'incomes', 'income_sources',
        'expenses', 'expense_sources',
        'assets', 'other_assets',
        'liabilities',
        'safety_nets', 'safety_net_dependents',
    ]);
};

exports.down = (pgm) => {
    pgm.dropTable('safety_net_dependents');
    pgm.dropTable('safety_nets');
    pgm.dropTable('liabilities');
    pgm.dropTable('other_assets');
    pgm.dropTable('assets');
    pgm.dropTable('expense_sources');
    pgm.dropTable('expenses');
    pgm.dropTable('income_sources');
    pgm.dropTable('incomes');
    pgm.sql('DROP TYPE IF EXISTS frequency_type');
};
