import { z } from 'zod';

export const surveySubmitSchema = z.object({
    responses: z.array(z.object({
        questionId: z.coerce.number().int().min(1),
        weight: z.coerce.number().int().min(1).max(5)
    }).strict()).min(1, 'At least one response is required')
}).strict();
