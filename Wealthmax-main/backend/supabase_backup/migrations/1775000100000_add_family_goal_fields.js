/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Add family_id to goals (references families table)
  pgm.addColumn('goals', {
    family_id: {
      type: 'uuid',
      references: '"families"',
      onDelete: 'SET NULL'
    },
    is_family_goal: {
      type: 'boolean',
      notNull: true,
      default: false
    }
  });

  // Index for fast family goal lookups
  pgm.createIndex('goals', 'family_id');
};

exports.down = pgm => {
  pgm.dropIndex('goals', 'family_id');
  pgm.dropColumn('goals', 'is_family_goal');
  pgm.dropColumn('goals', 'family_id');
};
