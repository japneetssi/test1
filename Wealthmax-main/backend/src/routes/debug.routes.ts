import { Router } from 'express';
import { DebugController } from '../controllers/debug.controller';
const router = Router();
router.get('/:id', DebugController.debugScheme);
export default router;
