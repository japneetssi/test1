import { Router } from 'express';
import { EquityDashboardController } from '../controllers/equityDashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Market data endpoints are public (real quotes, no user context).
router.get('/market-overview', EquityDashboardController.getMarketOverview);
router.get('/categories', EquityDashboardController.getCategories);
router.get('/trending', EquityDashboardController.getTrending);
router.get('/recommended', EquityDashboardController.getRecommended);
router.get('/market-opportunities', EquityDashboardController.getMarketOpportunities);
router.get('/news', EquityDashboardController.getNews);

// SECURITY: the personal portfolio view must not be anonymous (previously it
// served a static hardcoded wallet to everyone).
router.get('/portfolio', authenticateToken, EquityDashboardController.getPortfolio);

export default router;
