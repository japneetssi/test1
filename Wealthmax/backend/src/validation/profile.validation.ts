import { z } from 'zod';

// Profile validation schemas
export const updateActionItemStatusSchema = z.object({
    status: z.enum(['pending', 'completed', 'dismissed'], {
        message: 'Status must be pending, completed, or dismissed'
    })
});