import { z } from 'zod';

// Portfolio validation schemas
export const addManualHoldingSchema = z.object({
    isin: z.string().regex(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/, 'Invalid ISIN format'),
    asset_type: z.enum(['EQUITY', 'MUTUAL_FUND'], {
        message: 'Asset type must be either EQUITY or MUTUAL_FUND'
    }),
    quantity: z.number().positive('Quantity must be positive'),
    average_price: z.number().positive('Average price must be positive').optional()
});

export const uploadCsvSchema = z.object({
    csv: z.string().min(1, 'CSV content is required')
});