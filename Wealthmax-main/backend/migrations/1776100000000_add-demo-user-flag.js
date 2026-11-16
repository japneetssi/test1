/**
 * Migration: Add Demo User Flag
 * 
 * Purpose: Distinguish demo/test users from real production users
 * - Prevents demo data from being analyzed in production reports
 * - Enables filtering of demo users in analytics queries
 * - Supports demo account management and cleanup
 */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
    pgm.addColumns('profiles', {
        is_demo_user: { 
            type: 'boolean', 
            default: false,
            notNull: true
        }
    });

    // Add index for efficient filtering
    pgm.createIndex('profiles', 'is_demo_user', {
        name: 'idx_profiles_is_demo_user'
    });
};

export const down = (pgm) => {
    pgm.dropIndex('profiles', 'is_demo_user', {
        name: 'idx_profiles_is_demo_user'
    });
    pgm.dropColumns('profiles', ['is_demo_user']);
};
