import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import surveyRoutes from './survey.routes';
import calculatorRoutes from './calculator.routes';
import pdfRoutes from './pdf.routes';
import marketplaceRoutes from './marketplace.routes';
import equityRoutes from './equity.routes';
import userRoutes from './user.routes';
import portfolioRoutes from './portfolio.routes';
import mutualFundRoutes from './mutualFund.routes';
import projectionRoutes from './projection.routes';
import goalRoutes from './goal.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import partnerRoutes from './partner.routes';
import advisorRoutes from './advisor.routes';
import taxRoutes from './tax.routes';
import rebalancingRoutes from './rebalancing.routes';
import familyRoutes from './family.routes';
import rmRoutes from './rm.routes';
import financialRoutes from './financial.routes';
import plaidRoutes from './plaid.routes';
import debugRoutes from './debug.routes';
import equityDashboardRoutes from './equityDashboard.routes';

const router = Router();

// API v1 routes
router.use('/health', healthRoutes);
router.use('/debug', debugRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
router.use('/profile', profileRoutes);
router.use('/survey', surveyRoutes);
router.use('/calculators', calculatorRoutes);
router.use('/pdf', pdfRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/marketplace/equity', equityRoutes);
router.use('/equity-dashboard', equityDashboardRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/mutual-funds', mutualFundRoutes);
router.use('/projections', projectionRoutes);
router.use('/goals', goalRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/partner', partnerRoutes);
router.use('/advisor', advisorRoutes);
router.use('/tax', taxRoutes);
router.use('/rebalancing', rebalancingRoutes);
router.use('/family', familyRoutes);
router.use('/rm', rmRoutes);
router.use('/financial', financialRoutes);
router.use('/plaid', plaidRoutes);

export default router;



