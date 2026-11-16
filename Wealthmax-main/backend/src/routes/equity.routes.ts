import { Router } from 'express';
import { EquityController } from '../controllers/equity.controller';

const router = Router();

router.get('/:symbol/overview', EquityController.getOverview);
router.get('/:symbol/market-data', EquityController.getMarketData);
router.get('/:symbol/valuation', EquityController.getValuation);
router.get('/:symbol/financials', EquityController.getFinancials);
router.get('/:symbol/shareholding', EquityController.getShareholding);
router.get('/:symbol/performance', EquityController.getPerformance);
router.get('/:symbol/news', EquityController.getNews);
router.get('/:symbol/company', EquityController.getCompanyProfile);
router.get('/:symbol/insights', EquityController.getAIInsights);

export default router;
