/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // Make mobile nullable in users table
    pgm.alterColumn('users', 'mobile', {
        allowNull: true
    });
};

exports.down = (pgm) => {
    // Revert mobile to not null
    // Note: This might fail if there are existing NULL values
    pgm.alterColumn('users', 'mobile', {
        allowNull: false
    });
};
