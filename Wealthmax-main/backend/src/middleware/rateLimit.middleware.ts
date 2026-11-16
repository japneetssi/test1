import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * Lightweight in-process sliding window rate limiter.
 * No external dependencies; uses a per-IP bucket keyed by scope.
 * For horizontally scaled deployments this should be backed by Redis
 * (see config/redis.ts) - documented in the production roadmap.
 */

interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the Map cannot grow unbounded.
setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
        if (now >= bucket.resetAt) {
            buckets.delete(key);
        }
    }
}, 60 * 1000).unref();

const createLimiter = (maxRequests: number, windowMs: number, scope: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const clientIp = req.ip || 'unknown';
        const key = `${scope}:${clientIp}`;
        const now = Date.now();

        let bucket = buckets.get(key);
        if (!bucket || now >= bucket.resetAt) {
            bucket = { count: 0, resetAt: now + windowMs };
            buckets.set(key, bucket);
        }

        bucket.count += 1;

        if (bucket.count > maxRequests) {
            const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
            logger.warn('Rate limit exceeded', { scope, ip: clientIp, path: req.path });
            res.setHeader('Retry-After', retryAfterSeconds);
            res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMITED'
            });
            return;
        }

        next();
    };
};

/** General API limit: 600 requests / 15 min / IP across /api/v1. */
export const apiLimiter = createLimiter(600, 15 * 60 * 1000, 'api');

/** Strict auth limit: 20 requests / 15 min / IP for OTP + registration + refresh. */
export const authLimiter = createLimiter(20, 15 * 60 * 1000, 'auth');
