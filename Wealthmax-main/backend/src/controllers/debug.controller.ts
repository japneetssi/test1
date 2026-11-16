import { Request, Response } from 'express';
import db from '../config/database';
export class DebugController {
    static async debugScheme(req: Request, res: Response): Promise<void> {
        try {
            const { hydrateSchemeData } = await import('../services/mfapi.service');
            try {
                await hydrateSchemeData(Number(req.params.id), true);
            } catch (err: any) {
                res.json({ error: 'Hydration crashed', message: err.message, stack: err.stack });
                return;
            }
            
            const result = await db.query('SELECT * FROM mf_schemes WHERE scheme_code = $1', [req.params.id]);
            res.json({ success: true, data: result.rows[0] });
        } catch (e) {
            res.json({error: String(e)});
        }
    }
}
