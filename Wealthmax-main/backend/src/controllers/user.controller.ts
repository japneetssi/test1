import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';
import { EncryptionService } from '../services/encryption.service';
import logger from '../config/logger';

export class UserController {
    /**
     * Get current user details
     */
    static async getCurrentUser(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Decrypt sensitive data for response
            const userData = { ...user } as any;
            if (userData.pan_encrypted && userData.pan_encrypted.includes(':')) {
                try {
                    userData.pan_number = EncryptionService.decrypt(userData.pan_encrypted);
                } catch (e) {
                    logger.error('Failed to decrypt PAN', e);
                }
            }
            if (userData.govt_id_number_encrypted && userData.govt_id_number_encrypted.includes(':')) {
                try {
                    userData.govt_id_number = EncryptionService.decrypt(userData.govt_id_number_encrypted);
                } catch (e) {
                    logger.error('Failed to decrypt Govt ID', e);
                }
            }
            delete userData.pan_encrypted;
            delete userData.govt_id_number_encrypted;

            return res.json({
                success: true,
                data: userData
            });
        } catch (error: any) {
            logger.error('Get user error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch user details'
            });
        }
    }

    /**
     * Update user identity profile
     */
    static async updateIdentity(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { 
                full_name, 
                mobile, 
                email, 
                dob, 
                pan_number, 
                marital_status, 
                occupation, 
                retirement_age_goal,
                govt_id_type,
                govt_id_number,
                address,
                kyc_status
            } = req.body;

            // Prepare updates object
            const updates: any = {};
            if (full_name) updates.full_name = full_name;
            if (email) updates.email = email;
            if (dob) updates.dob = dob;
            if (marital_status) updates.marital_status = marital_status;
            if (occupation) updates.occupation = occupation;
            if (retirement_age_goal !== undefined) {
                const parsedAge = parseInt(retirement_age_goal);
                if (!isNaN(parsedAge)) updates.retirement_age_goal = parsedAge;
            }
            if (govt_id_type) updates.govt_id_type = govt_id_type;
            if (address) updates.address = address;
            if (kyc_status) updates.kyc_status = kyc_status;

            // Handle mobile
            if (mobile) {
                const existingUser = await UserModel.findByMobile(mobile);
                if (existingUser && existingUser.id !== userId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mobile number already in use'
                    });
                }
                updates.mobile = mobile;
            }

            // Encrypt sensitive data
            if (pan_number) {
                updates.pan_encrypted = EncryptionService.encrypt(pan_number);
            }
            if (govt_id_number) {
                updates.govt_id_number_encrypted = EncryptionService.encrypt(govt_id_number);
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one field is required for update'
                });
            }

            const updatedUser = await UserModel.updateProfile(userId, updates);
            const userData = { ...updatedUser } as any;
            if (userData.pan_encrypted && userData.pan_encrypted.includes(':')) {
                try {
                    userData.pan_number = EncryptionService.decrypt(userData.pan_encrypted);
                } catch (e) {
                    logger.error('Failed to decrypt PAN', e);
                }
            }
            if (userData.govt_id_number_encrypted && userData.govt_id_number_encrypted.includes(':')) {
                try {
                    userData.govt_id_number = EncryptionService.decrypt(userData.govt_id_number_encrypted);
                } catch (e) {
                    logger.error('Failed to decrypt Govt ID', e);
                }
            }
            delete userData.pan_encrypted;
            delete userData.govt_id_number_encrypted;

            return res.json({
                success: true,
                message: 'Identity updated successfully',
                data: userData
            });
        } catch (error: any) {
            logger.error('Update identity error', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update identity'
            });
        }
    }

    /**
     * Update user profile (name, mobile)
     */
    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { full_name, mobile } = req.body;

            if (!full_name && !mobile) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one field (full_name or mobile) is required'
                });
            }

            // Check if mobile is already taken by another user
            if (mobile) {
                const existingUser = await UserModel.findByMobile(mobile);
                if (existingUser && existingUser.id !== userId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Mobile number already in use'
                    });
                }
            }

            const updatedUser = await UserModel.updateProfile(userId, { full_name, mobile });
            const userData = { ...updatedUser } as any;
            if (userData.pan_encrypted && userData.pan_encrypted.includes(':')) {
                try {
                    userData.pan_number = EncryptionService.decrypt(userData.pan_encrypted);
                } catch (e) {
                    logger.error('Failed to decrypt PAN', e);
                }
            }
            if (userData.govt_id_number_encrypted && userData.govt_id_number_encrypted.includes(':')) {
                try {
                    userData.govt_id_number = EncryptionService.decrypt(userData.govt_id_number_encrypted);
                } catch (e) {
                    logger.error('Failed to decrypt Govt ID', e);
                }
            }
            delete userData.pan_encrypted;
            delete userData.govt_id_number_encrypted;

            return res.json({
                success: true,
                message: 'Profile updated successfully',
                data: userData
            });
        } catch (error: any) {
            logger.error('Update profile error', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile'
            });
        }
    }

    /**
     * Change password
     */
    static async changePassword(req: Request, res: Response) {
        return res.status(400).json({
            success: false,
            message: 'Password authentication has been removed. Please log in using OTP.'
        });
    }
}
