/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.sql(`
        ALTER TABLE profiles
        ADD COLUMN IF NOT EXISTS income_details jsonb DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS expense_details jsonb DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS asset_details jsonb DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS liability_details jsonb DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS safety_net_details jsonb DEFAULT '[]';
    `);
};

exports.down = (pgm) => {
    pgm.sql(`
        ALTER TABLE profiles
        DROP COLUMN IF EXISTS income_details,
        DROP COLUMN IF EXISTS expense_details,
        DROP COLUMN IF EXISTS asset_details,
        DROP COLUMN IF EXISTS liability_details,
        DROP COLUMN IF EXISTS safety_net_details;
    `);
};
