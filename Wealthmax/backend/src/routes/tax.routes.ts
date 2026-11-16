import { Router } from 'express';
import { TaxController } from '../controllers/tax.controller';

const router = Router();

// POST /api/v1/tax/optimize
router.post('/optimize', TaxController.optimize);

export default router;
