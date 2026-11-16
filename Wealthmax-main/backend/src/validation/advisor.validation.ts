import { z } from 'zod';

// Advisor validation schemas
export const generateProposalSchema = z.object({
    clientId: z.number().optional(),
    clientName: z.string().min(1, 'Client name is required').max(100),
    proposalType: z.enum(['SIP', 'Lumpsum'], {
        message: 'Proposal type must be SIP or Lumpsum'
    }),
    amount: z.number().positive('Amount must be positive').min(500, 'Minimum investment is ₹500'),
    horizonYears: z.number().min(1).max(30, 'Horizon years must be between 1 and 30'),
    assumedCagr: z.number().min(1).max(30, 'CAGR must be between 1% and 30%').default(12),
    funds: z.array(z.object({
        schemeCode: z.number(),
        schemeName: z.string().min(1, 'Fund name is required'),
        weight: z.number().min(1).max(100, 'Allocation must be between 1 and 100')
    })).min(2, 'At least 2 funds required').max(5, 'Maximum 5 funds allowed'),
    projectionData: z.array(z.object({
        year: z.string(),
        invested: z.number(),
        projected: z.number()
    })).optional()
});

// Client Invite schemas
export const sendInviteSchema = z.object({
    clientName: z.string().min(2, 'Client name must be at least 2 characters'),
    clientEmail: z.string().email('Invalid email format'),
    sendEmail: z.boolean().optional().default(true)
});