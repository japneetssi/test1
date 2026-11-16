import { z } from 'zod';

export const optimizeTaxSchema = z.object({
    annual_income: z.coerce.number().min(0),
    is_salaried: z.boolean(),
    investments_80c: z.coerce.number().min(0).max(150000).optional(),
    health_insurance_80d: z.coerce.number().min(0).max(100000).optional(),
    nps_80ccd_1b: z.coerce.number().min(0).max(50000).optional(),
    hra_exemption: z.coerce.number().min(0).optional(),
    home_loan_interest_u_s24b: z.coerce.number().min(0).max(200000).optional(),
    other_deductions: z.coerce.number().min(0).optional()
}).strict();
