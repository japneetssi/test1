const { z } = require('zod');

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    mobile: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid mobile number format'),
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters'),
    role: z.enum(['user', 'advisor', 'partner']).optional().default('user'),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional(),
    advisor_id: z.string().uuid('Invalid advisor ID').nullable().optional(),
    partner_id: z.string().uuid('Invalid partner ID').nullable().optional(),
    inviteToken: z.string().nullable().optional()
});

const payload = {
    full_name: 'Test User',
    mobile: '1234567890',
    email: 'test@example.com',
    pan: 'ABCDE1234F',
    advisor_id: null,
    inviteToken: null,
    marital_status: 'Single',
    occupation: 'Engineer',
    retirement_age_goal: 60,
    password: 'Password123!'
};

try {
    const parsed = registerSchema.parse(payload);
    console.log('Success:', parsed);
} catch (e) {
    console.log('Error:', JSON.stringify(e.issues, null, 2));
}
