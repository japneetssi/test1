import { Router } from 'express';
import { RebalancingController } from '../controllers/rebalancing.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/v1/rebalancing/analyze
router.get('/analyze', authenticateToken, RebalancingController.getAnalysis);

export default router;
