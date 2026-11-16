/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Add columns to users table
    pgm.addColumns('users', {
        occupation: { type: 'text' },
        marital_status: { type: 'text' }
    });

    // Add columns to profiles table
    pgm.addColumns('profiles', {
        other_income: { type: 'numeric(15,2)', default: 0 },
        household_expenses: { type: 'numeric(15,2)', default: 0 },
        bank_balance: { type: 'numeric(15,2)', default: 0 },
        fixed_deposits: { type: 'numeric(15,2)', default: 0 },
        trading_capital: { type: 'numeric(15,2)', default: 0 },
        gold_assets: { type: 'numeric(15,2)', default: 0 },
        real_estate_assets: { type: 'numeric(15,2)', default: 0 },
        home_loan: { type: 'numeric(15,2)', default: 0 },
        personal_loan: { type: 'numeric(15,2)', default: 0 },
        health_insurance_cover: { type: 'numeric(15,2)', default: 0 },
        is_active_trader: { type: 'boolean', default: false },
        trading_capital_allocation_percent: { type: 'numeric(5,2)', default: 25 },
        trading_strategies: { type: 'text[]', default: '{}' }
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('users', ['occupation', 'marital_status']);
    pgm.dropColumns('profiles', [
        'other_income', 'household_expenses', 'bank_balance', 'fixed_deposits',
        'trading_capital', 'gold_assets', 'real_estate_assets', 'home_loan',
        'personal_loan', 'health_insurance_cover', 'is_active_trader',
        'trading_capital_allocation_percent', 'trading_strategies'
    ]);
};
