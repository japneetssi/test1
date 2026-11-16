/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
    pgm.createTable('pledge_requests', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            notNull: true,
            references: '"users"',
            onDelete: 'CASCADE'
        },
        status: { 
            type: 'varchar(20)', 
            notNull: true, 
            default: 'pending',
            check: "status IN ('pending', 'approved', 'rejected')"
        },
        amount: { type: 'numeric(15,2)', default: 0 },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    pgm.createIndex('pledge_requests', 'user_id');
    pgm.createIndex('pledge_requests', 'status');
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
    pgm.dropTable('pledge_requests');
};
