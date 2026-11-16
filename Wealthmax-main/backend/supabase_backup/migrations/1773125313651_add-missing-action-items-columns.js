/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
    pgm.addColumns('action_items', {
        problem_statement: { type: 'text' },
        is_resolved: { type: 'boolean', default: false }
    });
};

export const down = (pgm) => {
    pgm.dropColumns('action_items', ['problem_statement', 'is_resolved']);
};
