import { Router } from 'express';
import { RMController } from '../controllers/rm.controller';
import { OnboardingController } from '../controllers/onboarding.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// RM Action Routes
router.get('/search', authenticateToken, RMController.searchClients);
router.get('/dashboard-metrics', authenticateToken, RMController.getDashboardMetrics);
router.get('/clients', authenticateToken, RMController.getClients);
router.get('/recent-alerts', authenticateToken, RMController.getRecentAlerts);
router.post('/generate-pdf/:clientId', authenticateToken, RMController.generatePDF);
router.post('/nudge/:clientId', authenticateToken, RMController.sendNudge);

// Prospect Onboarding (Kanban)
router.get('/onboarding', authenticateToken, OnboardingController.getProspects);
router.post('/onboarding', authenticateToken, OnboardingController.createProspect);
router.patch('/onboarding/:id', authenticateToken, OnboardingController.updateStage);
router.delete('/onboarding/:id', authenticateToken, OnboardingController.deleteProspect);

export default router;
