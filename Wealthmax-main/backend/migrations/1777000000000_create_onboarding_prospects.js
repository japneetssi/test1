exports.up = (pgm) => {
    pgm.createTable('onboarding_prospects', {
        id: 'id',
        rm_id: {
            type: 'uuid',
            notNull: true,
            references: 'users(id)',
            onDelete: 'CASCADE'
        },
        full_name: { type: 'varchar(255)', notNull: true },
        email: { type: 'varchar(255)' },
        mobile: { type: 'varchar(20)' },
        stage: { 
            type: 'varchar(50)', 
            notNull: true, 
            default: 'Prospect',
            comment: 'Possible values: Prospect, Documentation, KYC, Funded'
        },
        estimated_aum: { type: 'numeric(15,2)', default: 0 },
        notes: { type: 'text' },
        last_contact: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    pgm.createIndex('onboarding_prospects', 'rm_id');
    pgm.createIndex('onboarding_prospects', 'stage');
};

exports.down = (pgm) => {
    pgm.dropTable('onboarding_prospects');
};
