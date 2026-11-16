/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumns('partner_agencies', {
        logo_url: { type: 'varchar(500)' },
        primary_color: { type: 'varchar(7)', default: '#00458c' },
        action_color: { type: 'varchar(7)', default: '#f37920' },
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('partner_agencies', ['logo_url', 'primary_color', 'action_color']);
};
