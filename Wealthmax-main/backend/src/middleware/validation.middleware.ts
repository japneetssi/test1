import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ZodObject } from 'zod';
import logger from '../config/logger';

export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);

            if (req.query && Object.keys(req.query).length > 0) {
                const processedQuery: any = {};

                for (const [key, value] of Object.entries(req.query)) {
                    if (Array.isArray(value)) {
                        processedQuery[key] = value;
                    } else if (value === 'true') {
                        processedQuery[key] = true;
                    } else if (value === 'false') {
                        processedQuery[key] = false;
                    } else if (!isNaN(Number(value))) {
                        processedQuery[key] = Number(value);
                    } else {
                        processedQuery[key] = value;
                    }
                }

                try {
                    if (schema instanceof z.ZodObject) {
                        const shape = (schema as any)._def?.shape;
                        const querySchema = shape?.query;
                        if (querySchema) {
                            req.query = querySchema.parse(processedQuery);
                        }
                    }
                } catch {
                    logger.debug('Optional query validation skipped');
                }
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn('Validation error', {
                    errors: error.issues,
                    body: req.body,
                    path: req.path,
                    method: req.method
                });

                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
                return; // ✅ important
            }

            logger.error('Unexpected validation error', error);

            res.status(500).json({
                success: false,
                message: 'Internal server error during validation'
            });
            return; // ✅ important
        }
    };
};

// Helper function to sanitize strings (remove potentially dangerous characters)
export const sanitizeString = (str: string): string => {
    return str.replace(/[<>'"&]/g, '');
};

// Helper function to validate file uploads
export const validateFileUpload = (allowedTypes: string[], maxSize: number) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
            return;
        }

        // Check file type
        if (!allowedTypes.includes(req.file.mimetype)) {
            res.status(400).json({
                success: false,
                message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
            });
            return;
        }

        // Check file size
        if (req.file.size > maxSize) {
            res.status(400).json({
                success: false,
                message: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`
            });
            return;
        }

        next();
    };
};