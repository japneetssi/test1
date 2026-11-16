import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit.middleware';
import logger from './config/logger';

const app: Application = express();

// Trust the first proxy hop (Render/ALB) so req.ip resolves to the real client
// for rate limiting and logging.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration - explicit allow-list built from CORS_ORIGIN (supports a
// comma-separated list) plus FRONTEND_URL for backwards compatibility.
const allowedOrigins = [
    ...(config.get('CORS_ORIGIN') as string)
        .split(',')
        .map(o => o.trim())
        .filter(Boolean),
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server / curl requests with no Origin header.
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Body parsing middleware with explicit size limits (prevents oversized
// request bodies from exhausting server memory).
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// HTTP request logging
const morganFormat = config.isDevelopment() ? 'dev' : 'combined';
app.use(
    morgan(morganFormat, {
        stream: {
            write: (message: string) => logger.http(message.trim()),
        },
    })
);

// Global rate limiting across the API
app.use('/api/v1', apiLimiter);

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'WealthMax API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            code: 'NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
