/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // 1. Create families table
  pgm.createTable('families', {
    id: { 
      type: 'uuid', 
      primaryKey: true, 
      default: pgm.func('gen_random_uuid()') 
    },
    name: { 
      type: 'text', 
      notNull: true 
    },
    head_user_id: { 
      type: 'uuid', 
      notNull: true, 
      references: '"users"', 
      onDelete: 'CASCADE' 
    },
    created_at: { 
      type: 'timestamp', 
      notNull: true, 
      default: pgm.func('current_timestamp') 
    },
  });

  // 2. Add family_id to users
  pgm.addColumn('users', {
    family_id: { 
      type: 'uuid', 
      references: '"families"', 
      onDelete: 'SET NULL' 
    },
  });

  // 3. Optional: Add family_members mapping table for more complex family structures in future
  // For now, family_id in users is sufficient.
};

exports.down = pgm => {
  pgm.dropColumn('users', 'family_id');
  pgm.dropTable('families');
};
