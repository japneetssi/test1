import { z } from 'zod';

// Partner validation schemas
export const updateBrandingSchema = z.object({
    name: z.string().min(1, 'Partner name is required').max(100, 'Partner name must be less than 100 characters').optional(),
    primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color').optional(),
    action_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Action color must be a valid hex color').optional()
});

export const inviteAdvisorSchema = z.object({
    name: z.string().min(2, 'Advisor name must be at least 2 characters').max(100, 'Advisor name must be less than 100 characters'),
    email: z.string().email('Invalid email format')
});