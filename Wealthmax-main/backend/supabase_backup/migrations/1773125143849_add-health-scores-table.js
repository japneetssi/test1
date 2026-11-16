/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
    pgm.createTable('health_scores', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            references: '"users"',
            onDelete: 'CASCADE'
        },
        total_score: { type: 'integer', notNull: true },
        savings_score: { type: 'integer', default: 0 },
        debt_score: { type: 'integer', default: 0 },
        liquidity_score: { type: 'integer', default: 0 },
        diversity_score: { type: 'integer', default: 0 },
        protection_score: { type: 'integer', default: 0 },
        goals_score: { type: 'integer', default: 0 },
        literacy_score: { type: 'integer', default: 0 },
        calculated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    pgm.createIndex('health_scores', 'user_id');
    pgm.createIndex('health_scores', 'calculated_at');
};

export const down = (pgm) => {
    pgm.dropTable('health_scores');
};
