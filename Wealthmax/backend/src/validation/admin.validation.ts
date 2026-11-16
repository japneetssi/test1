import { z } from 'zod';

// Admin validation schemas
export const onboardPartnerSchema = z.object({
    name: z.string().min(1, 'Partner name is required').max(100, 'Partner name must be less than 100 characters'),
    admin_email: z.string().email('Invalid admin email format'),
    subscription_tier: z.enum(['basic', 'premium', 'enterprise'], {
        message: 'Subscription tier must be basic, premium, or enterprise'
    }),
    total_clients: z.number().min(1).max(10000, 'Total clients must be between 1 and 10000')
});