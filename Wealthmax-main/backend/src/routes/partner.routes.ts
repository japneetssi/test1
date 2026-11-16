import { Router } from 'express';
import { PartnerController } from '../controllers/partner.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { updateBrandingSchema, inviteAdvisorSchema } from '../validation/partner.validation';

const router = Router();

import { uploadLogo } from '../middleware/upload.middleware';

// Partner dashboard settings - Partner role only
router.get('/settings', authenticateToken, authorizeRoles('partner'), PartnerController.getSettings);

// Get Advisor Roster - Partner role only
router.get('/advisors', authenticateToken, authorizeRoles('partner'), PartnerController.getAdvisors);

// Get Firm Analytics - Partner role only
router.get('/analytics', authenticateToken, authorizeRoles('partner'), PartnerController.getAnalytics);

// Update branding - Partner role only
router.patch('/branding', authenticateToken, authorizeRoles('partner'), uploadLogo.single('logo'), validateRequest(updateBrandingSchema), PartnerController.updateBranding);

// Invite Advisor - Partner role only
router.post('/invite-advisor', authenticateToken, authorizeRoles('partner'), validateRequest(inviteAdvisorSchema), PartnerController.inviteAdvisor);
router.post('/advisors/invite', authenticateToken, authorizeRoles('partner'), validateRequest(inviteAdvisorSchema), PartnerController.inviteAdvisor);

// Get My Branding - Any authenticated user
router.get('/my-branding', authenticateToken, PartnerController.getMyBranding);

// Get Public Branding - genuinely public. The frontend fetches branding on
// public landing/signup/invite pages before any user is authenticated.
router.get('/public-branding/:id', PartnerController.getPublicBranding);

// Advisor & Client Management
router.get(
    '/advisors/:advisorId/clients', 
    authenticateToken, 
    authorizeRoles('partner'), 
    PartnerController.getAdvisorClients
);

router.post(
    '/advisors/reassign', 
    authenticateToken, 
    authorizeRoles('partner'), 
    PartnerController.reassignClients
);

// Firm-wide Dashboard Data - Partner role only
router.get('/dashboard-metrics', authenticateToken, authorizeRoles('partner'), PartnerController.getDashboardMetrics);
router.get('/clients', authenticateToken, authorizeRoles('partner'), PartnerController.getClients);
router.get('/alerts', authenticateToken, authorizeRoles('partner'), PartnerController.getAlerts);

export default router;
