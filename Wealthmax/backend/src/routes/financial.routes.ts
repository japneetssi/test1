import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// ============================================================
// INCOME ROUTES
// ============================================================
router.get('/income', authenticateToken, FinancialController.getIncome);
router.post('/income', authenticateToken, FinancialController.updateIncome);

// ============================================================
// EXPENSE ROUTES
// ============================================================
router.get('/expense', authenticateToken, FinancialController.getExpense);
router.post('/expense', authenticateToken, FinancialController.updateExpense);

// ============================================================
// ASSET ROUTES
// ============================================================
router.get('/asset', authenticateToken, FinancialController.getAsset);
router.post('/asset', authenticateToken, FinancialController.updateAsset);

// ============================================================
// LIABILITY ROUTES
// ============================================================
router.get('/liability', authenticateToken, FinancialController.getLiability);
router.post('/liability', authenticateToken, FinancialController.updateLiability);

// ============================================================
// SAFETY NET ROUTES
// ============================================================
router.get('/safety-net', authenticateToken, FinancialController.getSafetyNet);
router.post('/safety-net', authenticateToken, FinancialController.updateSafetyNet);

// ============================================================
// ALL FINANCIAL DATA
// ============================================================
router.get('/all', authenticateToken, FinancialController.getAllFinancialData);

export default router;
