/* eslint-disable camelcase */

/**
 * Migration: Add mutual_fund_nav table
 *
 * This is the local database cache for AMFI daily NAV data.
 * The NavSync engine bulk-upserts 15k+ records here nightly so that
 * portfolio valuations can be resolved instantly without hitting external APIs.
 *
 * Columns match the MutualFundNAV domain model:
 *   isin         – Primary Key (AMFI Growth / Div ISIN)
 *   scheme_name  – Full scheme name from AMFI file
 *   current_nav  – Latest NAV value (decimal precision: 10 digits, 4 dp)
 *   nav_date     – Date for which the NAV was published
 *   last_synced  – Timestamp of last sync (set automatically on upsert)
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.createTable('mutual_fund_nav', {
        isin: {
            type: 'varchar(20)',
            primaryKey: true,
        },
        scheme_name: {
            type: 'varchar(255)',
            notNull: true,
        },
        current_nav: {
            type: 'decimal(10,4)',
            notNull: true,
        },
        nav_date: {
            type: 'date',
            notNull: true,
        },
        last_synced: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Index on nav_date for efficient range queries (e.g., "give me today's NAVs")
    pgm.createIndex('mutual_fund_nav', 'nav_date');
};

exports.down = (pgm) => {
    pgm.dropTable('mutual_fund_nav');
};
