/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumns('profiles', {
        dependents: { type: 'integer', default: 0 },
        liabilities_emi: { type: 'numeric(15,2)', default: 0 },
        emergency_fund_amount: { type: 'numeric(15,2)', default: 0 },
        insurance_cover: { type: 'numeric(15,2)', default: 0 }
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('profiles', ['dependents', 'liabilities_emi', 'emergency_fund_amount', 'insurance_cover']);
};
