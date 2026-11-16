/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Add partner_id to families (references partner_agencies table)
  pgm.addColumn('families', {
    partner_id: {
      type: 'uuid',
      references: '"partner_agencies"',
      onDelete: 'CASCADE'
    }
  });

  // Index for fast family partner-scoped lookups
  pgm.createIndex('families', 'partner_id');
};

exports.down = pgm => {
  pgm.dropIndex('families', 'partner_id');
  pgm.dropColumn('families', 'partner_id');
};
