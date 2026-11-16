/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('plaid_items', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: '"users"', onDelete: 'CASCADE', notNull: true },
    access_token: { type: 'varchar(255)', notNull: true },
    item_id: { type: 'varchar(255)', notNull: true, unique: true },
    institution_id: { type: 'varchar(100)' },
    institution_name: { type: 'varchar(255)' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  }, { ifNotExists: true });

  pgm.createTable('plaid_accounts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    plaid_item_id: { type: 'uuid', references: '"plaid_items"', onDelete: 'CASCADE', notNull: true },
    account_id: { type: 'varchar(255)', notNull: true, unique: true },
    name: { type: 'varchar(255)', notNull: true },
    official_name: { type: 'varchar(255)' },
    type: { type: 'varchar(50)', notNull: true },
    subtype: { type: 'varchar(50)' },
    mask: { type: 'varchar(4)' },
    current_balance: { type: 'numeric(15, 2)' },
    available_balance: { type: 'numeric(15, 2)' },
    iso_currency_code: { type: 'varchar(3)' },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropTable('plaid_accounts');
  pgm.dropTable('plaid_items');
};
