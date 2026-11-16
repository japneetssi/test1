import { z } from 'zod';

export const sipProjectionSchema = z.object({
    monthlyInvestment: z.coerce.number().positive(),
    rate: z.coerce.number().min(0).max(100),
    years: z.coerce.number().min(1).max(60)
}).strict();

export const retirementProjectionSchema = z.object({
    currentAge: z.coerce.number().min(18).max(100),
    retirementAge: z.coerce.number().min(30).max(100),
    monthlyExpenses: z.coerce.number().min(0),
    inflationRate: z.coerce.number().min(0).max(50),
    existingSavings: z.coerce.number().min(0),
    expectedReturn: z.coerce.number().min(0).max(50),
    postRetirementReturn: z.coerce.number().min(0).max(50).optional()
}).strict().refine((payload) => payload.retirementAge > payload.currentAge, {
    message: 'retirementAge must be greater than currentAge',
    path: ['retirementAge']
});

export const goalProjectionSchema = z.object({
    goalName: z.string().trim().min(1).max(120).optional(),
    goalYear: z.coerce.number().min(new Date().getFullYear()).max(new Date().getFullYear() + 100),
    currentCost: z.coerce.number().min(0),
    inflation: z.coerce.number().min(0).max(50),
    currentSavings: z.coerce.number().min(0),
    returnRate: z.coerce.number().min(0).max(50)
}).strict();
