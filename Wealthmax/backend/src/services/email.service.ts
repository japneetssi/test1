import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import config from '../config/env';
import logger from '../config/logger';

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null;

    /**
     * Initialize email transporter with Gmail SMTP configuration
     */
    private static getTransporter(): nodemailer.Transporter {
        if (!this.transporter) {
            const smtpHost = config.get('SMTP_HOST');
            const smtpPort = config.get('SMTP_PORT');
            const smtpUser = config.get('SMTP_USER');
            const smtpPass = config.get('SMTP_PASS');
            const nodeEnv = config.get('NODE_ENV') || 'development';

            logger.debug(`SMTP Config: host=${smtpHost}, port=${smtpPort}, user=${smtpUser}, pass=${smtpPass ? '***SET***' : 'NOT SET'}`);

            // ✅ Production: Require SMTP credentials
            if (nodeEnv === 'production' && (!smtpUser || !smtpPass)) {
                logger.error('PRODUCTION ERROR: Email credentials not configured. This is required for production.');
                throw new Error('Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
            }

            // Check if email is configured
            if (!smtpUser || !smtpPass) {
                logger.warn('Email credentials not configured. Emails will be logged to console only (development mode).');
                // ✅ Development only: Return a mock transporter for development
                this.transporter = nodemailer.createTransport({
                    streamTransport: true,
                    newline: 'unix',
                    buffer: true
                });
            } else {
                const transportOptions: SMTPTransport.Options = {
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpPort === 465, // true for 465, false for other ports
                    auth: {
                        user: smtpUser,
                        pass: smtpPass,
                    },
                    tls: {
                        rejectUnauthorized: nodeEnv === 'production' ? true : false // Strict in production
                    }
                };
                logger.info(`Creating SMTP transporter for ${smtpHost}:${smtpPort}`);
                this.transporter = nodemailer.createTransport(transportOptions);
            }
        }
        return this.transporter;
    }

    /**
     * Send OTP email to user
     */
    static async sendOTPEmail(email: string, otp: string, name?: string): Promise<void> {
        const transporter = this.getTransporter();
        const emailFrom = config.get('EMAIL_FROM');

        const mailOptions = {
            from: emailFrom,
            to: email,
            subject: 'Email Verification - WealthMax',
            html: this.getOTPEmailTemplate(otp, name),
            text: `Your WealthMax email verification OTP is: ${otp}. This OTP is valid for 5 minutes.`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);

            // Log for development
            if (!config.get('SMTP_USER')) {
                logger.info(`[DEV MODE] Email would be sent to: ${email}`);
                logger.info(`[DEV MODE] OTP: ${otp}`);
            } else {
                logger.info(`Email sent successfully to ${email}: ${info.messageId}`);
            }
        } catch (error) {
            logger.error('Failed to send email:', error);
            throw new Error('Failed to send verification email. Please try again later.');
        }
    }

    /**
     * Send password reset email
     */
    static async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void> {
        const transporter = this.getTransporter();
        const emailFrom = config.get('EMAIL_FROM');
        const frontendUrl = config.get('FRONTEND_URL') || 'https://app.wealthmax.com';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        const mailOptions = {
            from: emailFrom,
            to: email,
            subject: 'Reset Your Password - WealthMax',
            html: this.getPasswordResetTemplate(resetLink, name),
            text: `Click the following link to reset your WealthMax password: ${resetLink}. This link is valid for 1 hour.`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);

            if (!config.get('SMTP_USER')) {
                logger.info(`[DEV MODE] Reset Link: ${resetLink}`);
            } else {
                logger.info(`Password reset email sent to ${email}: ${info.messageId}`);
            }
        } catch (error) {
            logger.error('Failed to send reset email:', error);
            throw new Error('Failed to send password reset email.');
        }
    }

    /**
     * HTML email template for OTP
     */
    private static getOTPEmailTemplate(otp: string, name?: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - WealthMax</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">WealthMax</h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Your Financial Advisor</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Email Verification
                            </h2>
                            
                            ${name ? `<p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${name},</p>` : ''}
                            
                            <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Thank you for signing up with WealthMax! To complete your email verification, please use the following One-Time Password (OTP):
                            </p>
                            
                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px 40px; display: inline-block;">
                                            <span style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                This OTP is valid for <strong>5 minutes</strong>
                            </p>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <strong>Security Note:</strong> If you didn't request this verification, please ignore this email or contact our support team immediately.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Need help? Contact us at <a href="mailto:support@wealthmax.com" style="color: #667eea; text-decoration: none;">support@wealthmax.com</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} WealthMax. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }

    /**
     * HTML email template for Password Reset
     */
    private static getPasswordResetTemplate(link: string, name?: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">WealthMax</h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff;">Password Reset Request</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${name ? `<p style="color: #4b5563; font-size: 16px;">Hi ${name},</p>` : ''}
                            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password. Click the button below to choose a new password:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <a href="${link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #6b7280; font-size: 14px; text-align: center;">
                                This link is valid for <strong>1 hour</strong>.
                            </p>
                            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
                                If you didn't request this, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }

    /**
     * Send advisor invitation email
     */
    static async sendAdvisorInviteEmail(
        email: string, 
        inviteLink: string, 
        partnerName: string, 
        advisorName?: string
    ): Promise<void> {
        const transporter = this.getTransporter();
        const emailFrom = config.get('EMAIL_FROM');

        const mailOptions = {
            from: emailFrom,
            to: email,
            subject: `Welcome to the ${partnerName} Network - Invitation to Join`,
            html: this.getAdvisorInviteTemplate(inviteLink, partnerName, advisorName),
            text: `You've been invited to join the ${partnerName} network as an Advisor. Click here to set up your account: ${inviteLink}. This invite is valid for 7 days.`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);

            if (!config.get('SMTP_USER')) {
                logger.info(`[DEV MODE] Advisor Invite email would be sent to: ${email}`);
                logger.info(`[DEV MODE] Invite Link: ${inviteLink}`);
            } else {
                logger.info(`Advisor Invite email sent successfully to ${email}: ${info.messageId}`);
            }
        } catch (error) {
            logger.error('Failed to send advisor invite email:', error);
            throw new Error('Failed to send invitation email. Please try again later.');
        }
    }

    /**
     * Send client invitation email
     */
    static async sendClientInviteEmail(
        email: string, 
        inviteLink: string, 
        advisorName: string, 
        clientName?: string
    ): Promise<void> {
        const transporter = this.getTransporter();
        const emailFrom = config.get('EMAIL_FROM');
        const partnerName = (config.get('PARTNER_NAME') as string) || 'WealthMax';

        const mailOptions = {
            from: emailFrom,
            to: email,
            subject: `You've Been Invited to ${partnerName} - Join Now!`,
            html: this.getClientInviteTemplate(inviteLink, advisorName, partnerName, clientName),
            text: `You've been invited to join ${partnerName} by ${advisorName}. Click here to register: ${inviteLink}. This invite is valid for 7 days.`,
        };

        try {
            const info = await transporter.sendMail(mailOptions);

            if (!config.get('SMTP_USER')) {
                logger.info(`[DEV MODE] Invite email would be sent to: ${email}`);
                logger.info(`[DEV MODE] Invite Link: ${inviteLink}`);
            } else {
                logger.info(`Invite email sent successfully to ${email}: ${info.messageId}`);
            }
        } catch (error) {
            logger.error('Failed to send invite email:', error);
            throw new Error('Failed to send invitation email. Please try again later.');
        }
    }

    /**
     * HTML email template for Advisor Invitation
     */
    private static getAdvisorInviteTemplate(
        inviteLink: string, 
        partnerName: string,
        advisorName?: string
    ): string {
        const greetingName = advisorName || 'Professional';
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advisor Invitation - ${partnerName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #00458c 0%, #0066cc 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${partnerName}</h1>
                            <p style="margin: 10px 0 0 0; color: #b3d9ff; font-size: 14px;">Advisor Professional Network</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                Partner Invitation 🤝
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${greetingName},</p>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                You have been invited to join <strong>${partnerName}</strong> as an investment advisor. Our platform provides you with state-of-the-art tools to manage your clients, track portfolios, and grow your business.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Your professional dashboard is ready for setup. By joining our network, you'll benefit from:
                            </p>
                            
                            <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 30px 20px; padding: 0;">
                                <li>Comprehensive CRM for client management</li>
                                <li>Automated proposal generation</li>
                                <li>Real-time portfolio analytics & drift tracking</li>
                                <li>Integrated multi-asset execution</li>
                            </ul>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <a href="${inviteLink}" style="background: linear-gradient(135deg, #f37920 0%, #ff6b35 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                                            Set Up My Dashboard
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                This invitation is valid for <strong>7 days</strong>
                            </p>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                                <p style="margin: 0; color: #6b7280; font-size: 13px; word-break: break-all;">
                                    Direct link:<br>
                                    <a href="${inviteLink}" style="color: #00458c; text-decoration: underline;">${inviteLink}</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} ${partnerName}. All rights reserved.<br>
                                WealthMax Advisor Ecosystem
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }

    /**
     * HTML email template for Client Invitation
     */
    private static getClientInviteTemplate(
        inviteLink: string, 
        advisorName: string, 
        partnerName: string,
        clientName?: string
    ): string {
        const greetingName = clientName || 'there';
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You've Been Invited - ${partnerName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #00458c 0%, #0066cc 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${partnerName}</h1>
                            <p style="margin: 10px 0 0 0; color: #b3d9ff; font-size: 14px;">Your Financial Journey Starts Here</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                                You're Invited! 🎉
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">Hi ${greetingName},</p>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                <strong>${advisorName}</strong> has invited you to join <strong>${partnerName}</strong> - your personal financial advisory platform.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                As a valued client, you'll get access to:
                            </p>
                            
                            <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0 0 30px 20px; padding: 0;">
                                <li>Personalized portfolio tracking</li>
                                <li>Goal-based investment planning</li>
                                <li>Professional financial advisory</li>
                                <li>Tax optimization insights</li>
                            </ul>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <a href="${inviteLink}" style="background: linear-gradient(135deg, #f37920 0%, #ff6b35 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                This invitation is valid for <strong>7 days</strong>
                            </p>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                                <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; font-weight: 600;">
                                    Having trouble clicking the button?
                                </p>
                                <p style="margin: 0; color: #6b7280; font-size: 13px; word-break: break-all;">
                                    Copy and paste this link in your browser:<br>
                                    <a href="${inviteLink}" style="color: #00458c; text-decoration: underline;">${inviteLink}</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Questions? Contact us at <a href="mailto:support@wealthmax.com" style="color: #00458c; text-decoration: none;">support@wealthmax.com</a>
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} ${partnerName}. All rights reserved.<br>
                                SEBI Registered Investment Advisor
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }
}
