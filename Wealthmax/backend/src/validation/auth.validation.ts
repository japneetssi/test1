import { z } from 'zod';

// Auth validation schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    mobile: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number format'),
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters'),
    role: z.enum(['user', 'advisor', 'admin']).optional().default('user'),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional(),
    advisor_id: z.string().uuid('Invalid advisor ID').nullable().optional().or(z.literal('')),
    partner_id: z.string().uuid('Invalid partner ID').nullable().optional().or(z.literal('')),
    inviteToken: z.string().nullable().optional().or(z.literal('')),
    marital_status: z.string().optional(),
    occupation: z.string().optional(),
    retirement_age_goal: z.number().int().positive().optional()
});

export const loginSchema = z.object({
    identifier: z.string().min(1, 'Identifier is required')
});

export const otpRequestSchema = z.object({
    mobile: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number format').optional(),
    email: z.string().email('Invalid email format').optional(),
    identifier: z.string().min(1, 'Identifier is required').optional()
}).refine(data => data.mobile || data.email || data.identifier, {
    message: 'Either mobile, email, or identifier is required'
});

export const otpVerifySchema = z.object({
    identifier: z.string().min(1, 'Identifier is required'),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits')
});

export const emailOtpSendSchema = z.object({
    // No additional validation needed - uses authenticated user
});

export const emailOtpVerifySchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits')
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format')
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters')
});