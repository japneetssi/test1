/* eslint-disable camelcase */

/**
 * FIX (useless.md): audit_logs existed only as a Supabase-flavoured SQL file
 * (auth.users) that was never applied in this backend's migrate set, so
 * AuditService has been a silent no-op - compliance events never persisted.
 * This migration creates the table against the backend's own users table.
 */

exports.up = (pgm) => {
    pgm.createTable('audit_logs', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        user_id: {
            type: 'uuid',
            references: '"users"',
            onDelete: 'SET NULL',
        },
        action: { type: 'text', notNull: true },
        resource: { type: 'text', notNull: true },
        details: { type: 'jsonb' },
        ip_address: { type: 'text' },
        user_agent: { type: 'text' },
        created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    });

    pgm.createIndex('audit_logs', 'user_id');
    pgm.createIndex('audit_logs', 'action');
    pgm.createIndex('audit_logs', 'created_at');
};

exports.down = (pgm) => {
    pgm.dropTable('audit_logs');
};
