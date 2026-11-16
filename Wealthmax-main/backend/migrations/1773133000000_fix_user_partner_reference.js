/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Drop the old constraint that points to users
    pgm.dropConstraint('users', 'users_partner_id_fkey');
    
    // Add the new constraint that points to partner_agencies
    pgm.addConstraint('users', 'users_partner_id_fkey', {
        foreignKeys: {
            columns: 'partner_id',
            references: 'partner_agencies(id)',
            onDelete: 'SET NULL'
        }
    });
};

exports.down = (pgm) => {
    pgm.dropConstraint('users', 'users_partner_id_fkey');
    pgm.addConstraint('users', 'users_partner_id_fkey', {
        foreignKeys: {
            columns: 'partner_id',
            references: 'users(id)',
            onDelete: 'SET NULL'
        }
    });
};
