import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        return;
    }

    try {
        const secret = config.get('JWT_SECRET');
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        (req as any).user = decoded; // Attach user to request
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

/**
 * Middleware to authorize specific roles
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user || !allowedRoles.includes(user.role)) {
            res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have permission to access this resource.'
            });
            return;
        }

        next();
    };
};
