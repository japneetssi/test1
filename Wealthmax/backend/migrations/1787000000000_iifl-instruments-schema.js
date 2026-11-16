exports.up = (pgm) => {
    pgm.createTable('iifl_instruments', {
        id: 'id',
        instrument_id: { type: 'varchar(50)', notNull: true, unique: true },
        exchange: { type: 'varchar(20)' },
        formatted_name: { type: 'varchar(255)' },
        instrument_type: { type: 'varchar(50)' },
        underlying_name: { type: 'varchar(255)' },
        underlying_symbol: { type: 'varchar(255)' },
        trading_symbol: { type: 'varchar(255)' },
        series: { type: 'varchar(20)' },
        lot_size: { type: 'integer' },
        tick_size: { type: 'decimal' },
        option_type: { type: 'varchar(10)' },
        expiry: { type: 'varchar(50)' },
        strike_price: { type: 'varchar(50)' },
        qty_limit: { type: 'bigint' },
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
    });

    pgm.createIndex('iifl_instruments', 'exchange');
    pgm.createIndex('iifl_instruments', 'trading_symbol');
};

exports.down = (pgm) => {
    pgm.dropTable('iifl_instruments');
};
