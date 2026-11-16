/* eslint-disable camelcase */

// Corrected: this file was previously written as an ESM module creating its
// own pg.Pool. That bypassed node-pg-migrate's transaction entirely: with
// single-transaction batching, this migration's private connection saw an
// empty database ("relation users does not exist"). Rewired to the standard
// pgm API while preserving the same schema.

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.sql(`
        CREATE TABLE IF NOT EXISTS client_invites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            partner_id UUID REFERENCES partner_agencies(id) ON DELETE SET NULL,
            client_name VARCHAR(255),
            client_email VARCHAR(255) NOT NULL,
            invite_token VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Pending'
                CHECK (status IN ('Pending', 'Accepted', 'Expired')),
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    pgm.sql('CREATE INDEX IF NOT EXISTS idx_client_invites_token ON client_invites(invite_token);');
    pgm.sql('CREATE INDEX IF NOT EXISTS idx_client_invites_advisor ON client_invites(advisor_id);');
};

exports.down = (pgm) => {
    pgm.dropTable('client_invites', { ifExists: true });
};
