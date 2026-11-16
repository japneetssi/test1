import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { onboardPartnerSchema } from '../validation/admin.validation';

const router = Router();

// Dashboard data - Super Admin only
router.get('/dashboard', authenticateToken, authorizeRoles('admin'), AdminController.getDashboardData);

// Onboard Partner - Super Admin only
router.post('/onboard-partner', authenticateToken, authorizeRoles('admin'), validateRequest(onboardPartnerSchema), AdminController.onboardPartner);

export default router;
