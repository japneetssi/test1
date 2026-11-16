import crypto from 'crypto';
import logger from '../config/logger';
import config from '../config/env';
import redisCache from '../config/redis';

/**
 * OTP service.
 * SECURITY:
 *  - OTPs are generated with crypto.randomInt (cryptographically secure).
 *  - OTP records live in Redis (shared across instances) with a graceful
 *    in-memory fallback for local development when REDIS_URL is not set.
 *  - Max 5 failed verification attempts before the code is invalidated.
 *  - OTP values are ONLY logged in development, never in production.
 *  - There is no universal bypass/mocked OTP.
 */

const OTP_TTL_SECONDS = 5 * 60; // expires in 5 minutes
const MAX_OTP_ATTEMPTS = 5;

interface OtpRecord {
    otp: string;
    expiresAt: number;
    attempts: number;
}

const mobileMemoryFallback = new Map<string, OtpRecord>();
const emailMemoryFallback = new Map<string, OtpRecord>();

function storeRecord(key: string, record: OtpRecord, map: Map<string, OtpRecord>): Promise<void> {
    // Prefer Redis so OTPs survive across processes; fall back to process memory.
    if (redisCache.isUsingRedis() || config.get('REDIS_URL')) {
        return redisCache
            .set(key, JSON.stringify(record), OTP_TTL_SECONDS)
            .catch(() => {
                map.set(key, record);
            });
    }
    map.set(key, record);
    return Promise.resolve();
}

async function loadRecord(key: string, map: Map<string, OtpRecord>): Promise<OtpRecord | null> {
    if (redisCache.isUsingRedis() || config.get('REDIS_URL')) {
        try {
            const raw = await redisCache.get(key);
            if (raw) return JSON.parse(raw) as OtpRecord;
        } catch {
            // fall through to memory
        }
    }
    const record = map.get(key) ?? null;
    return record;
}

async function deleteRecord(key: string, map: Map<string, OtpRecord>): Promise<void> {
    map.delete(key);
    try {
        await redisCache.del(key);
    } catch {
        // non-fatal
    }
}

function isExpired(record: OtpRecord): boolean {
    return Date.now() > record.expiresAt;
}

export class OTPService {
    /**
     * Generate OTP for a mobile number.
     * `options.fixedOtp` is ONLY used by the DEMO account flow (auth.service
     * gates it to the demo identifiers); real users always get crypto-random
     * OTPs - there is no universal bypass.
     */
    static async generateOTP(
        mobile: string,
        options?: { fixedOtp?: string }
    ): Promise<string> {
        const otp = options?.fixedOtp ?? crypto.randomInt(100000, 1000000).toString();
        const record: OtpRecord = { otp, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000, attempts: 0 };
        await storeRecord(`otp:mobile:${mobile}`, record, mobileMemoryFallback);

        // Never log OTP values in production - log at debug level in dev only.
        if (config.isDevelopment()) {
            logger.debug(`Mobile OTP generated for ${mobile} (expires in 5 min): ${otp}`);
        } else {
            logger.info(`Mobile OTP generated for ${mobile} (expires in 5 min)`);
        }
        return otp;
    }

    /**
     * Verify a mobile OTP. Max attempts enforced.
     */
    static async verifyOTP(mobile: string, otp: string): Promise<boolean> {
        const key = `otp:mobile:${mobile}`;
        const record = await loadRecord(key, mobileMemoryFallback);
        if (!record) {
            logger.warn(`No OTP found for mobile: ${mobile}`);
            return false;
        }

        if (isExpired(record)) {
            await deleteRecord(key, mobileMemoryFallback);
            logger.warn(`Mobile OTP expired for ${mobile}`);
            return false;
        }

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await deleteRecord(key, mobileMemoryFallback);
            logger.warn(`Mobile OTP locked out after ${MAX_OTP_ATTEMPTS} failed attempts for ${mobile}`);
            return false;
        }

        if (record.otp === otp) {
            await deleteRecord(key, mobileMemoryFallback); // one-time use
            logger.info(`Mobile OTP verified successfully for ${mobile}`);
            return true;
        }

        record.attempts += 1;
        await storeRecord(key, record, mobileMemoryFallback);
        logger.warn(`Invalid mobile OTP attempt ${record.attempts}/${MAX_OTP_ATTEMPTS} for ${mobile}`);
        return false;
    }

    /**
     * Generate OTP for email verification. `options.fixedOtp` is demo-only.
     */
    static async generateEmailOTP(
        email: string,
        options?: { fixedOtp?: string }
    ): Promise<string> {
        const otp = options?.fixedOtp ?? crypto.randomInt(100000, 1000000).toString();
        const record: OtpRecord = { otp, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000, attempts: 0 };
        await storeRecord(`otp:email:${email}`, record, emailMemoryFallback);

        if (config.isDevelopment()) {
            logger.debug(`Email OTP generated for ${email} (expires in 5 min): ${otp}`);
        } else {
            logger.info(`Email OTP generated for ${email} (expires in 5 min)`);
        }
        return otp;
    }

    /**
     * Verify an email OTP. Max attempts enforced.
     */
    static async verifyEmailOTP(email: string, otp: string): Promise<boolean> {
        const key = `otp:email:${email}`;
        const record = await loadRecord(key, emailMemoryFallback);
        if (!record) {
            logger.warn(`No OTP found for email: ${email}`);
            return false;
        }

        if (isExpired(record)) {
            await deleteRecord(key, emailMemoryFallback);
            logger.warn(`Email OTP expired for ${email}`);
            return false;
        }

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            await deleteRecord(key, emailMemoryFallback);
            logger.warn(`Email OTP locked out after ${MAX_OTP_ATTEMPTS} failed attempts for ${email}`);
            return false;
        }

        if (record.otp === otp) {
            await deleteRecord(key, emailMemoryFallback); // one-time use
            logger.info(`Email OTP verified successfully for ${email}`);
            return true;
        }

        record.attempts += 1;
        await storeRecord(key, record, emailMemoryFallback);
        logger.warn(`Invalid email OTP attempt ${record.attempts}/${MAX_OTP_ATTEMPTS} for ${email}`);
        return false;
    }

    /**
     * Clear expired in-memory OTPs (used when Redis is not configured).
     */
    static clearExpiredOTPs(): void {
        const now = Date.now();
        for (const [key, value] of mobileMemoryFallback.entries()) {
            if (now > value.expiresAt) mobileMemoryFallback.delete(key);
        }
        for (const [key, value] of emailMemoryFallback.entries()) {
            if (now > value.expiresAt) emailMemoryFallback.delete(key);
        }
    }
}
