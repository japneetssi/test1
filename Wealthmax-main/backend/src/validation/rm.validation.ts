import { z } from 'zod';

export const generateRmPdfSchema = z.object({}).strict();

export const sendNudgeSchema = z.object({
    message: z.string().trim().min(3, 'Message is required').max(1000, 'Message too long')
}).strict();

export const createOnboardingProspectSchema = z.object({
    full_name: z.string().trim().min(2, 'Full name is required').max(120),
    email: z.string().trim().email('Invalid email format').optional(),
    mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Invalid mobile number').optional(),
    estimated_aum: z.coerce.number().min(0, 'Estimated AUM cannot be negative').max(1_000_000_000).optional(),
    notes: z.string().trim().max(2000, 'Notes too long').optional()
}).strict();

export const updateOnboardingStageSchema = z.object({
    stage: z.enum(['Prospect', 'Documentation', 'KYC', 'Funded'])
}).strict();
