import { Router } from 'express';
import { EquityDashboardController } from '../controllers/equityDashboard.controller';

const router = Router();

router.get('/market-overview', EquityDashboardController.getMarketOverview);
router.get('/categories', EquityDashboardController.getCategories);
router.get('/trending', EquityDashboardController.getTrending);
router.get('/recommended', EquityDashboardController.getRecommended);
router.get('/market-opportunities', EquityDashboardController.getMarketOpportunities);
router.get('/news', EquityDashboardController.getNews);
router.get('/portfolio', EquityDashboardController.getPortfolio);

export default router;
