import db from '../config/database';
import logger from '../config/logger';
import fs from 'fs';
import path from 'path';

async function main() {
    try {
        const migrationPath = path.join(__dirname, '../../supabase/migrations/20260310_add_total_liabilities_to_profiles.sql');
        logger.info(`Reading migration from: ${migrationPath}`);
        
        const query = fs.readFileSync(migrationPath, 'utf8');
        
        logger.info('Starting total_liabilities migration...');
        await db.query(query);
        logger.info('Total_liabilities migration executed successfully.');
        process.exit(0);
    } catch (error) {
        logger.error('Failed to execute goals table migration:', error);
        process.exit(1);
    }
}

main();
