import { Router } from 'express';
import { AdvisorController } from '../controllers/advisor.controller';
import { PortfolioReviewController } from '../controllers/portfolioReview.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { generateProposalSchema, sendInviteSchema } from '../validation/advisor.validation';

const router = Router();

// All advisor routes protected by authentication and 'advisor' role
router.get(
    '/clients',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.getClients
);

router.post(
    '/generate-proposal',
    authenticateToken,
    authorizeRoles('advisor'),
    validateRequest(generateProposalSchema),
    AdvisorController.generateProposal
);

router.get(
    '/portfolio-review/:clientId',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.getPortfolioReview
);

router.get(
    '/search',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.searchClients
);

router.get(
    '/dashboard-metrics',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.getDashboardMetrics
);

router.get(
    '/alerts',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.getAlerts
);

/**
 * Option Wealth Analytics Engine
 * GET /api/v1/advisor/option-wealth/:user_id
 * Accessible by advisors (for their clients) and admin (for testing)
 */
router.get(
    '/option-wealth/:user_id',
    authenticateToken,
    authorizeRoles('advisor', 'admin', 'user', 'partner', 'client'),
    AdvisorController.getOptionWealthAnalysis
);

// Portfolio Review & Rebalancing
router.get(
    '/portfolio-review/:clientId',
    authenticateToken,
    authorizeRoles('advisor'),
    PortfolioReviewController.getPortfolioReview
);

// Financial Profile
router.get(
    '/financial-profile/:clientId',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.getFinancialProfile
);

// Client Nudge
router.post(
    '/nudge/:clientId',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.sendNudge
);

// PDF Report Generator
router.post(
    '/generate-pdf/:clientId',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.generatePDF
);

// Client Search
router.get(
    '/clients/search',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.searchClients
);

// Mutual Fund Search
router.get(
    '/funds/search',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.searchFunds
);

// Proposal Generation with PDF
router.post(
    '/proposals/generate',
    authenticateToken,
    authorizeRoles('advisor'),
    AdvisorController.generateProposalPDF
);

export default router;
