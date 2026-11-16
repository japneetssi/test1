import { Request, Response, NextFunction } from 'express';
import { TaxService } from '../services/tax.service';
import { TaxInput } from '../types/tax';
import logger from '../config/logger';

export class TaxController {
    /**
     * POST /api/v1/tax/optimize
     */
    static optimize(req: Request, res: Response, next: NextFunction) {
        try {
            const input: TaxInput = req.body;

            // Simple validation
            if (typeof input.annual_income !== 'number' || input.annual_income < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid annual_income provided'
                });
            }

            const result = TaxService.optimize(input);

            logger.info(`Tax optimization performed for income: ${input.annual_income}`);

            return res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error in TaxController.optimize', error);
            return next(error);
        }
    }
}
