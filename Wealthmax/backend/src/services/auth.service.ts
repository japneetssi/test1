import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model';
import config from '../config/env';
import { OTPService } from './otp.service';
import { EncryptionService } from './encryption.service';
import logger from '../config/logger';
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
        const user = await UserModel.create({
            email,
            mobile,
            full_name,
            role: role || 'user',
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

        // 5. Generate Token
        const token = this.generateToken(user);

        return { user, token };
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

        if (isEmail) {
            const otp = OTPService.generateEmailOTP(identifier);
            const { EmailService } = await import('./email.service');
            await EmailService.sendOTPEmail(user.email, otp, user.full_name);
            return otp; // Return for dev convenience (logged in console)
        } else {
            return OTPService.generateOTP(identifier);
        }
    }

    static async loginWithOTP(identifier: string, otp: string) {
        const isEmail = identifier.includes('@');
        const isValid = isEmail
            ? OTPService.verifyEmailOTP(identifier, otp)
            : OTPService.verifyOTP(identifier, otp);

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
        return { user, token };
    }

    /**
     * Request email OTP for verification
     * Requires authenticated user
     */
    static async requestEmailOTP(userId: string) {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        // Generate OTP
        const otp = OTPService.generateEmailOTP(user.email);

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
        const isValid = OTPService.verifyEmailOTP(user.email, otp);
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
        const isValid = OTPService.verifyEmailOTP(email, otp);
        if (!isValid) throw new Error('Invalid or expired OTP');

        // 2. Fetch User
        const user = await UserModel.findByEmail(email);
        if (!user) throw new Error('User not found');
        if (user.status === 'active') throw new Error('Account already activated');

        // 3. Update User
        const updateData: any = { status: 'active', invitation_token: null };
        if (mobile) updateData.mobile = mobile;

        const updatedUser = await UserModel.update(user.id, updateData);

        // 4. Generate Token
        const token = this.generateToken(updatedUser);

        return { user: updatedUser, token };
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
}
