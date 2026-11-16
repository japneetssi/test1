/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // interaction_logs: logs of advisor interactions with clients
  pgm.createTable('interaction_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    client_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    advisor_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    type: { type: 'varchar(50)', notNull: true },
    notes: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });

  // documents: metadata for uploaded files
  pgm.createTable('documents', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    client_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    advisor_id: { type: 'uuid', notNull: true, references: '"users"', onDelete: 'CASCADE' },
    filename: { type: 'varchar(512)', notNull: true },
    url: { type: 'text', notNull: true },
    size: { type: 'bigint', notNull: true },
    mime_type: { type: 'varchar(255)' },
    uploaded_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createIndex('interaction_logs', ['client_id']);
  pgm.createIndex('interaction_logs', ['advisor_id']);
  pgm.createIndex('documents', ['client_id']);
  pgm.createIndex('documents', ['advisor_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('documents');
  pgm.dropTable('interaction_logs');
};
