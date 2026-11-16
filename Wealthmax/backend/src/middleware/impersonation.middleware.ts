import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import logger from '../config/logger';

export const handleImpersonation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const requestedUserId = req.query.userId as string;

        // If no user is logged in, let standard auth handle it later
        if (!user) {
            return next();
        }

        // If no impersonation requested, proceed
        if (!requestedUserId) {
            return next();
        }

        // Users cannot impersonate
        if (user.role === 'user') {
            return next();
        }

        // For advisors, verify ownership
        if (user.role === 'advisor') {
            const client = await UserModel.findById(requestedUserId);
            if (!client || client.advisor_id !== user.id) {
                res.status(403).json({ success: false, message: 'Unauthorized to access this client data' });
                return;
            }
        }

        // admin and partner implicitly bypass the specific ownership check above,
        // allowing them unrestricted access to the requested user.

        // Set target user ID for controllers to use
        (req as any).targetUserId = requestedUserId;
        next();
    } catch (error) {
        logger.error('Impersonation Middleware Error', error);
        res.status(500).json({ success: false, message: 'Internal server error during authorization' });
    }
};
