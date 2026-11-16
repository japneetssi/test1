import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadPdf } from '../middleware/upload.middleware';
import { handleImpersonation } from '../middleware/impersonation.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { addManualHoldingSchema, uploadCsvSchema } from '../validation/portfolio.validation';

const router = Router();

router.use(authenticateToken);
router.use(handleImpersonation);

// Add a single holding manually
router.post('/manual', validateRequest(addManualHoldingSchema), PortfolioController.addManualHolding);

// Upload holdings via CSV
router.post('/upload-csv', validateRequest(uploadCsvSchema), PortfolioController.uploadCSV);

// Upload holdings from CAS PDF
router.post('/upload-cas', uploadPdf.single('file'), PortfolioController.uploadCAS);

// Get all user holdings
router.get('/holdings', PortfolioController.getHoldings);

// Get short portfolio summary
router.get('/summary', PortfolioController.getSummary);

// Get portfolio alignment analysis
router.get('/alignment', PortfolioController.getAlignment);

// Delete a specific holding
router.delete('/holdings/:id', PortfolioController.deleteHolding);

// Download Advisory PDF Report
router.get('/report/pdf', PortfolioController.downloadReport);

// Get Unified Analytics Snapshot
router.get('/analytics-snapshot', PortfolioController.getAnalyticsSnapshot);

export default router;
