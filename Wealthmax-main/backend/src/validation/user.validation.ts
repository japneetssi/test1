import { z } from 'zod';

// User validation schemas
export const updateProfileSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters').optional(),
    mobile: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number format').optional(),
    dob: z.string().refine((date) => {
        const parsed = new Date(date);
        const now = new Date();
        const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
        return !isNaN(parsed.getTime()) && parsed >= hundredYearsAgo && parsed <= now;
    }, 'Invalid date of birth').optional(),
    occupation: z.string().max(100, 'Occupation must be less than 100 characters').optional(),
    marital_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
    pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional()
});

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters').max(128, 'New password must be less than 128 characters')
});