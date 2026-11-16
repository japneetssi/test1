import { z } from 'zod';

// Goal validation schemas
export const createGoalSchema = z.object({
    name: z.string().min(1, 'Goal name is required').max(100, 'Goal name must be less than 100 characters'),
    target_amount: z.number().positive('Target amount must be positive'),
    current_amount: z.number().min(0, 'Current amount cannot be negative').default(0),
    monthly_contribution: z.number().min(0, 'Monthly contribution cannot be negative').default(0),
    target_date: z.string().refine((date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime()) && parsed > new Date();
    }, 'Target date must be a valid future date'),
    category: z.string().optional(),
    priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    is_family_goal: z.boolean().default(false),
    time_horizon: z.enum(['short-term', 'medium-term', 'long-term']).optional(),
    step_up_percentage: z.number().min(0).max(100).optional()
});