import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    CORS_ORIGIN: string;
    LOG_LEVEL: string;
    JWT_SECRET: string;
    ENCRYPTION_KEY: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_SECURE: boolean;
    SMTP_USER: string;
    SMTP_PASS: string;
    EMAIL_FROM: string;
    PARTNER_NAME: string;
    FRONTEND_URL: string;
    REDIS_URL: string;
    MFAPI_BASE_URL: string;
    CAPTNEMO_BASE_URL: string;
    AMFI_NAV_URL: string;
    DEMO_LOGIN_ENABLED: boolean;
    DEMO_EMAIL: string;
    DEMO_MOBILE: string;
    DEMO_OTP: string;
}

class Config {
    private static instance: Config;
    private config: EnvConfig;

    private constructor() {
        this.config = {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PORT: parseInt(process.env.PORT || '5000', 10),
            DATABASE_URL: process.env.DATABASE_URL || '',
            CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
            LOG_LEVEL: process.env.LOG_LEVEL || 'info',
            JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_prod',
            ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '01234567890123456789012345678901', // 32 chars for AES-256
            SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
            SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
            SMTP_SECURE: process.env.SMTP_SECURE === 'true',
            SMTP_USER: process.env.SMTP_USER || '',
            SMTP_PASS: process.env.SMTP_PASS || '',
            EMAIL_FROM: process.env.EMAIL_FROM || 'WealthMax <noreply@wealthmax.com>',
            PARTNER_NAME: process.env.PARTNER_NAME || 'WealthMax',
            FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
            REDIS_URL: process.env.REDIS_URL || '',
            MFAPI_BASE_URL: process.env.MFAPI_BASE_URL || 'https://api.mfapi.in',
            CAPTNEMO_BASE_URL: process.env.CAPTNEMO_BASE_URL || 'https://mf.captnemo.in',
            AMFI_NAV_URL: process.env.AMFI_NAV_URL || 'https://www.amfiindia.com/spages/NAVAll.txt',
            // DEMO LOGIN (temporary feature request). In development it is ON
            // by default; in production it must be opted into explicitly with
            // DEMO_LOGIN_ENABLED=true. The fixed demo OTP applies ONLY to the
            // single demo account - all real users continue to receive
            // cryptographically random OTPs.
            // Raw env flag; production/development gating lives in
            // isDemoLoginEnabled().
            DEMO_LOGIN_ENABLED: process.env.DEMO_LOGIN_ENABLED !== 'false',
            DEMO_EMAIL: (process.env.DEMO_EMAIL || 'demo@wealthmax.app').toLowerCase(),
            DEMO_MOBILE: (process.env.DEMO_MOBILE || '+919999999999').replace(/[\s-]/g, ''),
            DEMO_OTP: process.env.DEMO_OTP || '123456',
        };

        this.validate();
    }

    private validate() {
        if (!this.config.DATABASE_URL) {
            throw new Error('DATABASE_URL is required in environment variables');
        }

        // SECURITY: refuse to boot in production with known-default secrets.
        if (this.isProduction()) {
            if (!this.config.JWT_SECRET || this.config.JWT_SECRET === 'dev_secret_key_change_in_prod' || this.config.JWT_SECRET.length < 32) {
                throw new Error('JWT_SECRET must be set to a strong random value (32+ characters) in production');
            }
            if (!this.config.ENCRYPTION_KEY || this.config.ENCRYPTION_KEY === '01234567890123456789012345678901') {
                throw new Error('ENCRYPTION_KEY must be set to a unique random 32-character value in production');
            }
        }
    }

    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
        return this.config[key];
    }

    public getAll(): EnvConfig {
        return { ...this.config };
    }

    public isDevelopment(): boolean {
        return this.config.NODE_ENV === 'development';
    }

    public isProduction(): boolean {
        return this.config.NODE_ENV === 'production';
    }

    /**
     * Demo login gate. Development: on by default, set DEMO_LOGIN_ENABLED=false
     * to disable. Production: never on unless DEMO_LOGIN_ENABLED is explicitly
     * "true" - the demo account must never silently exist in production.
     */
    public isDemoLoginEnabled(): boolean {
        if (this.isProduction()) {
            return process.env.DEMO_LOGIN_ENABLED === 'true';
        }
        return process.env.DEMO_LOGIN_ENABLED !== 'false';
    }

    /** The only identifiers that accept the fixed demo OTP. */
    public getDemoIdentifiers(): { email: string; mobile: string } {
        return { email: this.config.DEMO_EMAIL, mobile: this.config.DEMO_MOBILE };
    }

    /** The fixed OTP accepted only for the demo account. */
    public getDemoOtp(): string {
        return this.config.DEMO_OTP;
    }
}

export default Config.getInstance();
