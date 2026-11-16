exports.up = (pgm) => {
    // 1. Mutual Fund Houses (AMC)
    pgm.createTable('mf_amcs', {
        id: 'id',
        name: { type: 'varchar(255)', notNull: true, unique: true },
        created_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') }
    }, { ifNotExists: true });

    // 2. Mutual Fund Schemes & Metadata
    pgm.createTable('mf_schemes', {
        scheme_code: { type: 'integer', primaryKey: true },
        amc_id: { type: 'integer', references: 'mf_amcs(id)', onDelete: 'SET NULL' },
        scheme_name: { type: 'varchar(512)', notNull: true },
        scheme_type: { type: 'varchar(100)' },
        scheme_category: { type: 'varchar(100)' },
        isin_growth: { type: 'varchar(50)' },
        isin_div_reinvestment: { type: 'varchar(50)' },
        latest_nav: { type: 'numeric(10, 4)' },
        latest_nav_date: { type: 'date' },
        created_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') }
    }, { ifNotExists: true });
    pgm.createIndex('mf_schemes', 'amc_id', { ifNotExists: true });
    pgm.createIndex('mf_schemes', 'scheme_category', { ifNotExists: true });

    // 3. Historical NAV
    pgm.createTable('mf_nav_history', {
        scheme_code: { type: 'integer', references: 'mf_schemes(scheme_code)', onDelete: 'CASCADE', notNull: true },
        nav_date: { type: 'date', notNull: true },
        nav_value: { type: 'numeric(10, 4)', notNull: true },
    }, { 
        ifNotExists: true,
        constraints: {
            primaryKey: ['scheme_code', 'nav_date']
        }
    });

    // 4. Sync Logs
    pgm.createTable('mf_sync_logs', {
        id: 'id',
        sync_type: { type: 'varchar(50)', notNull: true },
        status: { type: 'varchar(20)', notNull: true },
        records_processed: { type: 'integer', default: 0 },
        error_message: { type: 'text' },
        started_at: { type: 'timestamp with time zone', default: pgm.func('current_timestamp') },
        completed_at: { type: 'timestamp with time zone' }
    }, { ifNotExists: true });
};

exports.down = (pgm) => {
    pgm.dropTable('mf_sync_logs', { ifExists: true });
    pgm.dropTable('mf_nav_history', { ifExists: true });
    pgm.dropTable('mf_schemes', { ifExists: true });
    pgm.dropTable('mf_amcs', { ifExists: true });
};
