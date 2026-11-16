/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // 1. Add hierarchy columns
    pgm.addColumns('users', {
        partner_id: {
            type: 'uuid',
            references: '"users"',
            onDelete: 'SET NULL',
            comment: 'Reference to the Partner (business entity) this user/advisor belongs to'
        },
        advisor_id: {
            type: 'uuid',
            references: '"users"',
            onDelete: 'SET NULL',
            comment: 'Reference to the Advisor managing this client'
        }
    });

    // 2. Update existing roles
    pgm.sql("UPDATE users SET role = 'super_admin' WHERE role = 'admin'");
    
    // Create indexes
    pgm.createIndex('users', 'partner_id');
    pgm.createIndex('users', 'advisor_id');
};

exports.down = (pgm) => {
    pgm.dropColumns('users', ['partner_id', 'advisor_id']);
    pgm.sql("UPDATE users SET role = 'admin' WHERE role = 'super_admin'");
};
