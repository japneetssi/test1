exports.up = (pgm) => {
    pgm.addColumns('mf_schemes', {
        aum: { type: 'numeric(15, 2)' },
        expense_ratio: { type: 'numeric(5, 2)' },
        risk_level: { type: 'varchar(50)' },
        fund_manager: { type: 'varchar(255)' },
        exit_load: { type: 'varchar(255)' },
        min_sip: { type: 'numeric(15, 2)' },
        cagr_1y: { type: 'numeric(8, 2)' },
        cagr_3y: { type: 'numeric(8, 2)' },
        cagr_5y: { type: 'numeric(8, 2)' },
        rating: { type: 'integer' }
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('mf_schemes', [
        'aum',
        'expense_ratio',
        'risk_level',
        'fund_manager',
        'exit_load',
        'min_sip',
        'cagr_1y',
        'cagr_3y',
        'cagr_5y',
        'rating'
    ]);
};
