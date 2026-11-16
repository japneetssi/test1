/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    // 1. Table: partner_agencies
    pgm.createTable('partner_agencies', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        name: { type: 'varchar(255)', notNull: true },
        admin_email: { type: 'varchar(255)', notNull: true, unique: true },
        total_clients: { type: 'integer', default: 0 },
        subscription_tier: { 
            type: 'varchar(50)', 
            notNull: true, 
            default: 'Starter',
            comment: 'Starter, Business Pro, Enterprise'
        },
        status: { 
            type: 'varchar(20)', 
            notNull: true, 
            default: 'Active',
            comment: 'Active, Suspended'
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // 2. Table: platform_metrics
    pgm.createTable('platform_metrics', {
        id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
        total_aum: { type: 'decimal(20,2)', default: 0 },
        active_users_count: { type: 'integer', default: 0 },
        onboarded_partners_count: { type: 'integer', default: 0 },
        onboarded_advisors_count: { type: 'integer', default: 0 },
        wealth_margin: { type: 'decimal(15,2)', default: 0 },
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Initial seed for metrics if needed, or just let it be empty/zero
    pgm.sql(`INSERT INTO platform_metrics (total_aum, active_users_count, onboarded_partners_count, onboarded_advisors_count, wealth_margin) 
             VALUES (8920000000, 2847, 7, 38, 124000000)`);

    // Seed some mock partners for the UI demo as requested in the image
    pgm.sql(`INSERT INTO partner_agencies (name, admin_email, total_clients, subscription_tier, status) VALUES 
             ('Next Curve Financials', 'rajesh@nextcurve.in', 142, 'Business Pro', 'Active'),
             ('Alpha Wealth Partners', 'sneha@alphawp.com', 89, 'Enterprise', 'Active'),
             ('Pinnacle Advisory', 'amit@pinnacle.co', 56, 'Starter', 'Active'),
             ('Vertex Capital', 'kiran@vertexcap.in', 210, 'Enterprise', 'Active'),
             ('Horizon MF Distributors', 'priya@horizonmf.com', 34, 'Business Pro', 'Suspended'),
             ('TrustBridge Advisors', 'deepak@trustbridge.in', 78, 'Starter', 'Active'),
             ('Wealth Guru Network', 'suresh@wealthguru.co', 0, 'Starter', 'Suspended')`);
};

exports.down = (pgm) => {
    pgm.dropTable('platform_metrics');
    pgm.dropTable('partner_agencies');
};
