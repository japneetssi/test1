import { Request, Response, NextFunction } from 'express';
import { FamilyService } from '../services/family.service';
import { UserModel } from '../models/user.model';
import logger from '../config/logger';

export class FamilyController {
    /**
     * POST /api/v1/family/create
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const { name } = req.body;
            // FIX (audit #19): retail B2C users without a partner firm may
            // create personal family groups; partner_id stays null for them
            // (previously they received a 400 and B2B2C users got a DB 500).
            const partnerId = (req as any).user.partner_id || null;

            const family = await FamilyService.createFamily(name, userId, partnerId);
            
            return res.status(201).json({
                success: true,
                message: 'Family created successfully',
                data: family
            });
        } catch (error) {
            logger.error('Error in FamilyController.create', error);
            return next(error);
        }
    }

    /**
     * POST /api/v1/family/add-member
     */
    static async addMember(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const partnerId = (req as any).user.partner_id;
            const { email } = req.body;

            // Get user's current family
            const user = await UserModel.findById(userId);
            if (!user?.id || !(user as any).family_id) {
                return res.status(400).json({ success: false, message: 'You must be part of a family to add members' });
            }

            const result = await FamilyService.addMemberByEmail((user as any).family_id, email, partnerId);
            
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            logger.error('Error in FamilyController.addMember', error);
            return next(error);
        }
    }

    /**
     * GET /api/v1/family/details
     */
    static async getDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const user = await UserModel.findById(userId);
            
            if (!user || !(user as any).family_id) {
                return res.json({ success: true, data: null }); // Not part of a family
            }

            const familyDetails = await FamilyService.getFamilyDetails((user as any).family_id);
            
            return res.json({
                success: true,
                data: familyDetails
            });
        } catch (error) {
            logger.error('Error in FamilyController.getDetails', error);
            return next(error);
        }
    }

    /**
     * GET /api/v1/family/consolidated-analytics
     */
    static async getConsolidatedAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const user = await UserModel.findById(userId);
            
            if (!user || !(user as any).family_id) {
                return res.status(400).json({ success: false, message: 'Not part of a family' });
            }

            const analytics = await FamilyService.getConsolidatedAnalytics((user as any).family_id);
            
            return res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            logger.error('Error in FamilyController.getConsolidatedAnalytics', error);
            return next(error);
        }
    }

    /**
     * GET /api/v1/family/holdings
     */
    static async getHoldings(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const user = await UserModel.findById(userId);
            
            if (!user || !(user as any).family_id) {
                return res.status(400).json({ success: false, message: 'Not part of a family' });
            }

            const holdings = await FamilyService.getFamilyHoldings((user as any).family_id);
            
            return res.json({
                success: true,
                data: holdings
            });
        } catch (error) {
            logger.error('Error in FamilyController.getHoldings', error);
            return next(error);
        }
    }
}
