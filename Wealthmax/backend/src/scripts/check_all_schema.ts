import db from '../config/database';

async function checkAllSchema() {
    try {
        const query = `
            SELECT table_name, column_name, data_type, character_maximum_length, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        `;
        const res = await db.query(query);
        
        let currentTable = '';
        for (const row of res.rows) {
            if (row.table_name !== currentTable) {
                console.log(`\n--- Table: ${row.table_name} ---`);
                currentTable = row.table_name;
            }
            let colStr = `  ${row.column_name}: ${row.data_type}`;
            if (row.character_maximum_length) colStr += `(${row.character_maximum_length})`;
            if (row.is_nullable === 'NO') colStr += ` NOT NULL`;
            if (row.column_default) colStr += ` DEFAULT ${row.column_default}`;
            console.log(colStr);
        }
        
        console.log('\n--- Foreign Keys ---');
        const fkQuery = `
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY';
        `;
        const fks = await db.query(fkQuery);
        for (const fk of fks.rows) {
            console.log(`${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAllSchema();
