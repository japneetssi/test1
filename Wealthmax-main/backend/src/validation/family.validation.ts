import { z } from 'zod';

// Family validation schemas
export const createFamilySchema = z.object({
    name: z.string().min(1, 'Family name is required').max(100, 'Family name must be less than 100 characters')
});

export const addMemberSchema = z.object({
    email: z.string().email('Invalid email format')
});