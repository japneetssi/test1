import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model';
import config from '../config/env';
import { OTPService } from './otp.service';
import { EncryptionService } from './encryption.service';
import logger from '../config/logger';
import redisCache from '../config/redis';
import { InviteController } from '../controllers/invite.controller';

export class AuthService {
    static async register(data: any) {
        const { email, mobile, role, pan, inviteToken, marital_status, occupation, retirement_age_goal } = data;
        const full_name = data.full_name || data.name;

        if (!full_name) throw new Error('Full name is required');

        // 1. Check if user exists
        const existingEmail = await UserModel.findByEmail(email);
        if (existingEmail) throw new Error('Email already registered');

        const existingMobile = await UserModel.findByMobile(mobile);
        if (existingMobile) throw new Error('Mobile already registered');

        // 2. Handle invite token - get advisor_id and partner_id from invite
        let advisor_id = data.advisor_id;
        let partner_id = data.partner_id;

        if (inviteToken) {
            // Validate invite token
            const { EmailService } = await import('./email.service');
            
            // We'll make a simple DB query to validate the token
            const db = (await import('../config/database')).default;
            const result = await db.query(
                `SELECT advisor_id, partner_id, status, expires_at 
                 FROM client_invites 
                 WHERE invite_token = $1`,
                [inviteToken]
            );

            if (result.rows.length === 0) {
                throw new Error('Invalid invitation token');
            }

            const invite = result.rows[0];

            if (invite.status === 'Accepted') {
                throw new Error('This invitation has already been used');
            }

            const expiresAt = new Date(invite.expires_at);
            if (expiresAt < new Date()) {
                throw new Error('This invitation has expired');
            }

            // Set advisor and partner from invite
            advisor_id = invite.advisor_id;
            partner_id = invite.partner_id;
        }

        // If advisor_id was provided directly (not via invite), get partner_id from advisor
        if (advisor_id && !partner_id) {
            const advisor = await UserModel.findById(advisor_id);
            if (advisor && advisor.partner_id) {
                partner_id = advisor.partner_id;
            }
        }

        // 3. Create User
        // SECURITY: never trust the client-supplied role. Public signup always
        // creates retail users. Advisor/admin accounts are provisioned via
        // the invitation flow only.
        const user = await UserModel.create({
            email,
            mobile,
            full_name,
            role: 'user',
            pan_encrypted: (pan ? EncryptionService.encrypt(pan) : undefined) ?? undefined,
            advisor_id,
            partner_id,
            occupation,
            marital_status,
            retirement_age_goal
        });

        // 4. Mark invite as accepted if token was used
        if (inviteToken) {
            await InviteController.markAsAccepted(inviteToken);
            logger.info(`User registered via invite token. Marked invite as Accepted.`);
        }

        // 5. Generate Token pair
        const token = this.generateToken(user);
        const refreshToken = await this.generateRefreshToken(user);

        return { user, token, refreshToken };
    }

    static async login() {
        throw new Error('Password login is disabled. Please use OTP.');
    }

    static async requestOTP(identifier: string) {
        const isEmail = identifier.includes('@');
        const user = isEmail
            ? await UserModel.findByEmail(identifier)
            : await UserModel.findByMobile(identifier);

        if (!user) {
            throw new Error(`${isEmail ? 'Email' : 'Mobile number'} not registered`);
        }

        // ── DEMO LOGIN (temporary) ─────────────────────────────────────────
        // The fixed demo OTP applies ONLY to the seeded demo account; every
        // other user takes the normal crypto-random path. No SMS/SMTP noise
        // is generated for the demo account.
        const demo = config.getDemoIdentifiers();
        const normalizedIdentifier = isEmail
            ? identifier.trim().toLowerCase()
            : identifier.replace(/[\s+\-]/g, '');
        const isDemoAccount = config.isDemoLoginEnabled() &&
            (isEmail
                ? normalizedIdentifier === demo.email
                : normalizedIdentifier === demo.mobile);

        let otp: string;
        if (isDemoAccount) {
            const fixedOtp = config.getDemoOtp();
            if (isEmail) {
                await OTPService.generateEmailOTP(user.email, { fixedOtp });
            } else {
                await OTPService.generateOTP(user.mobile, { fixedOtp });
            }
            logger.info(`Demo login OTP issued for ${user.email}`);
            if (config.isDevelopment()) {
                return { message: 'Demo OTP issued. Use the fixed demo OTP.', devOtp: fixedOtp, demo: true };
            }
            return { message: 'Demo OTP issued. Use the fixed demo OTP.', demo: true };
        }

        if (isEmail) {
            otp = await OTPService.generateEmailOTP(identifier);
            const { EmailService } = await import('./email.service');
            await EmailService.sendOTPEmail(user.email, otp, user.full_name);
        } else {
            otp = await OTPService.generateOTP(identifier);
            // Mobile OTP requires an SMS gateway (e.g. MSG91). Until one is 
            // configured, the code is only surfaced in development for testing.
        }

        // SECURITY: the OTP itself is never returned to API callers, logged in
        // production, or accepted via a universal backdoor. In development we
        // allow it to be surfaced so local flows are testable without SMS/SMTP.
        if (config.isDevelopment()) {
            return { message: 'OTP sent successfully', devOtp: otp };
        }
        return { message: 'OTP sent successfully' };
    }

    static async loginWithOTP(identifier: string, otp: string) {
        const isEmail = identifier.includes('@');
        const isValid = isEmail
            ? await OTPService.verifyEmailOTP(identifier, otp)
            : await OTPService.verifyOTP(identifier, otp);

        if (!isValid) throw new Error('Invalid or expired OTP');

        logger.info(`OTP Verified for ${identifier}. Fetching user...`);

        const user = isEmail
            ? await UserModel.findByEmail(identifier)
            : await UserModel.findByMobile(identifier);

        if (!user) {
            logger.warn(`User not found for identifier: ${identifier}`);
            throw new Error('User not found');
        }

        logger.info(`User found: ${user.full_name} (${user.role}). Generating token...`);

        // If user is pending (invited advisor), mark as active on first successful OTP login
        if (user.status === 'pending') {
            await UserModel.update(user.id, { status: 'active', invitation_token: null });
            logger.info(`User ${user.id} activated from pending status.`);
            user.status = 'active';
        }

        const token = this.generateToken(user);
        const refreshToken = await this.generateRefreshToken(user);
        return { user, token, refreshToken };
    }

    /**
     * Request email OTP for verification
     * Requires authenticated user
     */
    static async requestEmailOTP(userId: string) {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        // Generate OTP
        const otp = await OTPService.generateEmailOTP(user.email);

        // Send email (import EmailService at top)
        const { EmailService } = await import('./email.service');
        await EmailService.sendOTPEmail(user.email, otp, user.full_name);

        return { message: 'OTP sent to your email', email: user.email };
    }

    /**
     * Verify email OTP
     */
    static async verifyEmailOTP(userId: string, otp: string) {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        // Verify OTP
        const isValid = await OTPService.verifyEmailOTP(user.email, otp);
        if (!isValid) throw new Error('Invalid or expired OTP');

        return {
            message: 'Email verified successfully',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name
            }
        };
    }

    /**
     * Request password reset - disabled
     */
    static async requestPasswordReset(email: string) {
        throw new Error('Password reset disabled as password authentication is removed. Please login via OTP.');
    }

    /**
     * Reset password using token - disabled
     */
    static async resetPassword(token: string, newPassword: string) {
        throw new Error('Password reset disabled as password authentication is removed. Please login via OTP.');
    }

    /**
     * Validate advisor invitation token
     */
    static async validateAdvisorToken(token: string) {
        try {
            const decoded = jwt.verify(token, config.get('JWT_SECRET')) as any;
            
            if (decoded.type !== 'advisor_invite') {
                throw new Error('Invalid token type');
            }

            const user = await UserModel.findByEmail(decoded.email);
            if (!user) throw new Error('User not found');
            if (user.invitation_token !== token) throw new Error('Token mismatch or already used');
            if (user.status === 'active') throw new Error('Account already activated');

            // Get partner info
            const db = (await import('../config/database')).default;
            const partnerResult = await db.query(
                'SELECT name FROM partner_agencies WHERE id = $1',
                [user.partner_id]
            );

            return {
                email: user.email,
                name: user.full_name,
                partnerName: partnerResult.rows[0]?.name || 'WealthMax'
            };
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') throw new Error('Invitation has expired');
            throw err;
        }
    }

    /**
     * Activate advisor account
     */
    static async activateAdvisor(email: string, otp: string, mobile?: string) {
        // 1. Verify OTP
        const isValid = await OTPService.verifyEmailOTP(email, otp);
        if (!isValid) throw new Error('Invalid or expired OTP');

        // 2. Fetch User
        const user = await UserModel.findByEmail(email);
        if (!user) throw new Error('User not found');
        if (user.status === 'active') throw new Error('Account already activated');

        // 3. Update User
        const updateData: any = { status: 'active', invitation_token: null };
        if (mobile) updateData.mobile = mobile;

        const updatedUser = await UserModel.update(user.id, updateData);

        // 4. Generate Token pair
        const token = this.generateToken(updatedUser);
        const refreshToken = await this.generateRefreshToken(updatedUser);

        return { user: updatedUser, token, refreshToken };
    }

    private static generateToken(user: User) {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                partner_id: user.partner_id
            },
            config.get('JWT_SECRET'),
            { expiresIn: '24h' }
        );
    }

    /**
     * Issue a long-lived refresh token (30 days) tied to the user, keyed in the
     * Redis-backed cache so it can be revoked. Frontend stores it in
     * localStorage under 'wm_refresh_token'.
     */
    private static async generateRefreshToken(user: User): Promise<string> {
        const refreshToken = jwt.sign(
            { id: user.id, email: user.email, type: 'refresh' },
            config.get('JWT_SECRET'),
            { expiresIn: '30d' }
        );
        const storeKey = `auth:refresh:${user.id}`;
        try {
            const { createHash } = await import('crypto');
            const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
            await redisCache.set(storeKey, tokenHash, 30 * 24 * 60 * 60);
        } catch (err) {
            // Non-fatal: refresh tokens remain valid; revocation is best-effort.
            logger.warn('Failed to persist refresh token for revocation', err);
        }
        return refreshToken;
    }

    /**
     * Exchange a refresh token for a new token pair.
     */
    static async refreshToken(rawRefreshToken: string) {
        let decoded: any;
        try {
            decoded = jwt.verify(rawRefreshToken, config.get('JWT_SECRET'));
        } catch (err: any) {
            if (err.name === 'TokenExpiredError') throw new Error('Refresh token expired. Please log in again.');
            throw new Error('Invalid refresh token');
        }
        if (decoded.type !== 'refresh' || !decoded.id) {
            throw new Error('Invalid refresh token');
        }

        const storeKey = `auth:refresh:${decoded.id}`;
        let storedHash: string | null = null;
        try {
            storedHash = await redisCache.get(storeKey);
        } catch {
            storedHash = null;
        }

        const { createHash } = await import('crypto');
        const providedHash = createHash('sha256').update(rawRefreshToken).digest('hex');

        // Only skip the store check when we are running fully in-memory (dev).
        if (!redisCache.isUsingRedis() && !config.get('REDIS_URL')) {
            logger.debug('Refresh token store unavailable - accepting token by signature only');
        } else if (!storedHash || storedHash !== providedHash) {
            throw new Error('Refresh token was revoked. Please log in again.');
        }

        const user = await UserModel.findById(decoded.id);
        if (!user) throw new Error('User not found');
        if (user.status && user.status !== 'active') {
            throw new Error('Account is not active');
        }

        // Rotate: invalidate the old refresh token and issue a fresh pair.
        await redisCache.del(storeKey).catch(() => { /* non-fatal */ });
        const accessToken = this.generateToken(user);
        const newRefreshToken = await this.generateRefreshToken(user);

        return { user, accessToken, refreshToken: newRefreshToken };
    }
}
