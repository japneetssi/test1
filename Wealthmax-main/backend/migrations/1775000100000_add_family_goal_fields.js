/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // The goals table was never created by any prior migration (it existed only
  // in the original Supabase SQL file that was never shipped). 1775000100000
  // assumes it exists, which broke the whole migration chain and rolled back
  // every migration. Create it here (idempotently) in the shape goal.model.ts
  // expects, then add the family columns below.
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS "goals" (
      "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "user_id" uuid NOT NULL REFERENCES "users" ON DELETE CASCADE,
      "name" text NOT NULL,
      "target_amount" numeric(15,2) NOT NULL,
      "target_date" date,
      "current_amount" numeric(15,2) DEFAULT 0,
      "monthly_contribution" numeric(15,2) DEFAULT 0,
      "priority" varchar(20) DEFAULT 'Medium',
      "time_horizon" varchar(20),
      "category" varchar(50),
      "step_up_percentage" numeric(5,2) DEFAULT 0,
      "created_at" timestamptz DEFAULT current_timestamp NOT NULL,
      "updated_at" timestamptz DEFAULT current_timestamp NOT NULL
    );
  `);

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
