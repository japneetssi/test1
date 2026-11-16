import express from 'express';
import { createLinkToken, setAccessToken, getAccounts } from '../controllers/plaid.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// All plaid routes require authentication
router.use(authenticateToken);

router.post('/create-link-token', createLinkToken);
router.post('/set-access-token', setAccessToken);
router.get('/accounts', getAccounts);

export default router;
