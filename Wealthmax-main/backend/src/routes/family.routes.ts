import { Router } from 'express';
import { FamilyController } from '../controllers/family.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createFamilySchema, addMemberSchema } from '../validation/family.validation';

const router = Router();

// POST /api/v1/family/create
router.post('/create', authenticateToken, validateRequest(createFamilySchema), FamilyController.create);

// POST /api/v1/family/add-member
router.post('/add-member', authenticateToken, validateRequest(addMemberSchema), FamilyController.addMember);

// GET /api/v1/family/details
router.get('/details', authenticateToken, FamilyController.getDetails);

// GET /api/v1/family/consolidated-analytics
router.get('/consolidated-analytics', authenticateToken, FamilyController.getConsolidatedAnalytics);

// GET /api/v1/family/holdings
router.get('/holdings', authenticateToken, FamilyController.getHoldings);

export default router;
