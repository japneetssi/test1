import { z } from 'zod';

const createGoalSchema = z.object({
    name: z.string().min(1, 'Goal name is required').max(100, 'Goal name must be less than 100 characters'),
    target_amount: z.number().positive('Target amount must be positive'),
    current_amount: z.number().min(0, 'Current amount cannot be negative').default(0),
    monthly_contribution: z.number().min(0, 'Monthly contribution cannot be negative').default(0),
    target_date: z.string().refine((date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime()) && parsed > new Date();
    }, 'Target date must be a valid future date'),
    category: z.enum(['emergency_fund', 'retirement', 'education', 'home', 'vacation', 'investment', 'debt_payoff', 'other'], {
        message: 'Invalid goal category'
    }).optional(),
    priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    is_family_goal: z.boolean().default(false)
});

const payload = {
    "name": "Home Purchase",
    "target_amount": 15007304,
    "target_date": "2032-04-14",
    "current_amount": 1200000,
    "monthly_contribution": 10000,
    "priority": "Medium",
    "is_family_goal": false
};

const result = createGoalSchema.safeParse(payload);
if (result.success) {
    console.log('Validation successful!');
    console.log(result.data);
} else {
    console.error('Validation failed:', result.error.format());
}
