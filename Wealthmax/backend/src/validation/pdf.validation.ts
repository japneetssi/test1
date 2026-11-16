import { z } from 'zod';

export const advisoryReportSchema = z.object({}).strict();

export const advisoryReportV2Schema = z.object({
    branding: z.object({
        companyName: z.string().trim().min(1).max(120).optional(),
        tagline: z.string().trim().max(200).optional(),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Primary color must be hex').optional(),
        disclaimerAddendum: z.string().trim().max(1000).optional()
    }).strict().optional()
}).strict();
