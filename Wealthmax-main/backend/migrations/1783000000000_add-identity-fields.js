/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS marital_status varchar(50),
    ADD COLUMN IF NOT EXISTS occupation varchar(255),
    ADD COLUMN IF NOT EXISTS retirement_age_goal integer,
    ADD COLUMN IF NOT EXISTS govt_id_type varchar(50),
    ADD COLUMN IF NOT EXISTS govt_id_number_encrypted text,
    ADD COLUMN IF NOT EXISTS address text;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS marital_status,
    DROP COLUMN IF EXISTS occupation,
    DROP COLUMN IF EXISTS retirement_age_goal,
    DROP COLUMN IF EXISTS govt_id_type,
    DROP COLUMN IF EXISTS govt_id_number_encrypted,
    DROP COLUMN IF EXISTS address;
  `);
};
