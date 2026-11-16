import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import logger from '../config/logger';

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const result = await AuthService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        full_name: result.user.full_name,
                        role: result.user.role
                    },
                    token: result.token
                }
            });
        } catch (error: any) {
            logger.error('Registration error', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed'
            });
        }
    }

    static async login(req: Request, res: Response) {
        res.status(400).json({
            success: false,
            message: 'Password login is disabled. Please use OTP login via /api/v1/auth/otp/request and /api/v1/auth/otp/verify'
        });
    }

    static async requestOTP(req: Request, res: Response) {
        try {
            const identifier = req.body.mobile || req.body.email || req.body.identifier;
            if (!identifier) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number or email is required'
                });
            }

            const otp = await AuthService.requestOTP(identifier);
            // In a real app we would send SMS. Here we return it for dev, or just say sent.
            // Returning it in response is insecure for prod but great for manual verification now.
            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                data: { otp } // Dev only
            });
        } catch (error: any) {
            logger.error('OTP Request error', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async loginOTP(req: Request, res: Response) {
        try {
            const identifier = req.body.mobile || req.body.email || req.body.identifier;
            const { otp } = req.body;

            if (!identifier || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Identifier and OTP are required'
                });
            }

            const result = await AuthService.loginWithOTP(identifier, otp);
            return res.status(200).json({
                success: true,
                message: 'OTP Login successful',
                data: {
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        role: result.user.role,
                        full_name: result.user.full_name
                    },
                    token: result.token
                }
            });
        } catch (error: any) {
            logger.error('OTP Login error', error);
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Send email OTP for verification
     * Requires authentication
     */
    static async sendEmailOTP(req: Request, res: Response) {
        try {
            // User ID comes from auth middleware (req.user)
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await AuthService.requestEmailOTP(userId);
            return res.status(200).json({
                success: true,
                message: result.message,
                data: { email: result.email }
            });
        } catch (error: any) {
            logger.error('Send Email OTP error', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Verify email OTP
     * Requires authentication
     */
    static async verifyEmailOTP(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { otp } = req.body;
            if (!otp) {
                return res.status(400).json({
                    success: false,
                    message: 'OTP is required'
                });
            }

            const result = await AuthService.verifyEmailOTP(userId, otp);
            return res.status(200).json({
                success: true,
                message: result.message,
                data: result.user
            });
        } catch (error: any) {
            logger.error('Verify Email OTP error', error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Validate advisor invitation token
     */
    static async validateAdvisorInvite(req: Request, res: Response) {
        try {
            const { token } = req.params;
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
            }

            const result = await AuthService.validateAdvisorToken(token);
            return res.status(200).json({
                success: true,
                message: 'Token is valid',
                data: result
            });
        } catch (error: any) {
            logger.error('Validate Advisor Token error', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Invalid or expired token'
            });
        }
    }

    /**
     * Activate advisor account with OTP and mobile
     */
    static async activateAdvisor(req: Request, res: Response) {
        try {
            const { email, otp, mobile } = req.body;
            if (!email || !otp) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and OTP are required'
                });
            }

            const result = await AuthService.activateAdvisor(email, otp, mobile);
            return res.status(200).json({
                success: true,
                message: 'Account activated successfully',
                data: result
            });
        } catch (error: any) {
            logger.error('Activate Advisor error', error);
            return res.status(400).json({
                success: false,
                message: error.message || 'Activation failed'
            });
        }
    }

    /**
     * Request password reset
     */
    static async forgotPassword(req: Request, res: Response) {
        return res.status(400).json({
            success: false,
            message: 'Password login is disabled. Please use OTP login.'
        });
    }

    /**
     * Reset password with token
     */
    static async resetPassword(req: Request, res: Response) {
        return res.status(400).json({
            success: false,
            message: 'Password login is disabled. Please use OTP login.'
        });
    }
}
