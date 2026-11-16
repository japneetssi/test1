import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { InviteController } from '../controllers/invite.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
    registerSchema,
    otpRequestSchema,
    otpVerifySchema,
    emailOtpVerifySchema,
    forgotPasswordSchema,
    resetPasswordSchema
} from '../validation/auth.validation';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', (req, res) => {
    res.status(400).json({
        success: false,
        message: 'Password login is disabled. Please use OTP login via /api/v1/auth/otp/request and /api/v1/auth/otp/verify'
    });
});
router.post('/otp/request', validateRequest(otpRequestSchema), AuthController.requestOTP);
router.post('/otp/verify', validateRequest(otpVerifySchema), AuthController.loginOTP);
router.post('/activate-advisor', AuthController.activateAdvisor);

// Email OTP routes (require authentication)
router.post('/email-otp/send', authenticateToken, AuthController.sendEmailOTP);
router.post('/email-otp/verify', authenticateToken, validateRequest(emailOtpVerifySchema), AuthController.verifyEmailOTP);

// Password reset routes (public)
router.post('/forgot-password', validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);

// Public invite validation routes
router.get('/validate-invite/:token', InviteController.validateInvite);
router.get('/validate-advisor-invite/:token', AuthController.validateAdvisorInvite);

export default router;
