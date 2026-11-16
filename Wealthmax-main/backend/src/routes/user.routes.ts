import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validation/user.validation';

const router = Router();

// All user routes require authentication
router.get('/me', authenticateToken, UserController.getCurrentUser);
router.put('/profile', authenticateToken, validateRequest(updateProfileSchema), UserController.updateProfile);
router.post('/identity/update', authenticateToken, UserController.updateIdentity);
router.put('/change-password', authenticateToken, validateRequest(changePasswordSchema), UserController.changePassword);

export default router;
