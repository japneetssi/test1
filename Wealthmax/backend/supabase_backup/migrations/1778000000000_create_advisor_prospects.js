/**
 * Migration: Create advisor_prospects table
 * Prospect Management Pipeline for Advisor CRM
 */
exports.up = (pgm) => {
    pgm.createTable('advisor_prospects', {
        id: 'id',
        advisor_id: {
            type: 'uuid',
            notNull: true,
            references: 'users(id)',
            onDelete: 'CASCADE'
        },
        name: { type: 'varchar(255)', notNull: true },
        email: { type: 'varchar(255)' },
        phone: { type: 'varchar(20)' },
        est_aum: { type: 'numeric(15,2)', default: 0 },
        status: {
            type: 'varchar(20)',
            notNull: true,
            default: "'New'",
            check: "status IN ('New', 'Contacted', 'Proposal Sent', 'Converted', 'Lost')"
        },
        notes: { type: 'text' },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    pgm.createIndex('advisor_prospects', 'advisor_id');
    pgm.createIndex('advisor_prospects', 'status');
};

exports.down = (pgm) => {
    pgm.dropTable('advisor_prospects');
};
