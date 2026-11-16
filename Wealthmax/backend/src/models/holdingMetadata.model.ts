import db from '../config/database';

export interface HoldingMetadata {
    isin: string;
    name: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    ticker?: string;
    current_nav?: number;
    nav_date?: Date;
    description?: string;
    category?: string;
    sector?: string;
    benchmark_index_id?: string;
    created_at: Date;
    updated_at: Date;
}

export class HoldingMetadataModel {
    static async findByIsin(isin: string): Promise<HoldingMetadata | null> {
        const result = await db.query('SELECT * FROM holding_metadata WHERE isin = $1', [isin]);
        return result.rows[0] || null;
    }

    static async findAll(): Promise<HoldingMetadata[]> {
        const result = await db.query('SELECT * FROM holding_metadata ORDER BY name');
        return result.rows;
    }

    static async findByType(type: 'EQUITY' | 'MUTUAL_FUND'): Promise<HoldingMetadata[]> {
        const result = await db.query('SELECT * FROM holding_metadata WHERE type = $1 ORDER BY name', [type]);
        return result.rows;
    }

    static async create(metadata: Partial<HoldingMetadata>): Promise<HoldingMetadata> {
        const { isin, name, type, ticker, current_nav, nav_date, description, category, sector, benchmark_index_id } = metadata;
        const result = await db.query(
            `INSERT INTO holding_metadata (isin, name, type, ticker, current_nav, nav_date, description, category, sector, benchmark_index_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [isin, name, type, ticker, current_nav, nav_date, description, category, sector, benchmark_index_id]
        );
        return result.rows[0];
    }

    static async updateNav(isin: string, nav: number, navDate: Date): Promise<HoldingMetadata | null> {
        const result = await db.query(
            `UPDATE holding_metadata 
             SET current_nav = $1, nav_date = $2, updated_at = NOW() 
             WHERE isin = $3 
             RETURNING *`,
            [nav, navDate, isin]
        );
        return result.rows[0] || null;
    }
}
