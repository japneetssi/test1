
import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createGoalSchema } from '../validation/goal.validation';

import { handleImpersonation } from '../middleware/impersonation.middleware';

const router = Router();

router.use(authenticateToken);
router.use(handleImpersonation);

router.post('/', validateRequest(createGoalSchema), GoalController.create);
router.get('/', GoalController.getAll);
router.delete('/:id', GoalController.delete);

export default router;
