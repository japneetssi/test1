exports.up = (pgm) => {
  // Interaction Logs Table
  pgm.createTable('interaction_logs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    client_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    advisor_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    type: { type: 'varchar(50)', notNull: true }, // 'Meeting', 'Call', 'Email', 'Note'
    notes: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Documents Table
  pgm.createTable('documents', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    client_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    advisor_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    filename: { type: 'varchar(255)', notNull: true },
    url: { type: 'text', notNull: true },
    size: { type: 'integer' },
    mime_type: { type: 'varchar(100)' },
    uploaded_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Indexes
  pgm.createIndex('interaction_logs', 'client_id');
  pgm.createIndex('documents', 'client_id');
};

exports.down = (pgm) => {
  pgm.dropTable('documents');
  pgm.dropTable('interaction_logs');
};
