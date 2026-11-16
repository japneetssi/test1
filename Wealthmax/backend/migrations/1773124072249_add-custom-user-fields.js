/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.renameColumn('users', 'name', 'full_name');
    pgm.renameColumn('users', 'pan', 'pan_encrypted');
    
    pgm.addColumns('users', {
        kyc_status: { type: 'varchar(50)', default: 'Pending' },
        assigned_persona: { type: 'varchar(50)' },
        risk_class: { type: 'varchar(50)' },
        risk_score: { type: 'integer' },
        dob: { type: 'date' },
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('users', ['kyc_status', 'assigned_persona', 'risk_class', 'risk_score', 'dob']);
    pgm.renameColumn('users', 'pan_encrypted', 'pan');
    pgm.renameColumn('users', 'full_name', 'name');
};

