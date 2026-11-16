import { Request, Response } from 'express';
import {
    IncomeModel,
    ExpenseModel,
    AssetModel,
    LiabilityModel,
    SafetyNetModel,
    Income,
    Expense,
    Asset,
    Liability,
    SafetyNet
} from '../models/financial.model';
import logger from '../config/logger';

export class FinancialController {

    // ============================================================
    // INCOME CONTROLLERS
    // ============================================================

    static async getIncome(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const income = await IncomeModel.findByUserId(userId);
            
            res.status(200).json({
                success: true,
                data: income || { user_id: userId, base_income: 0, sources: [] }
            });
        } catch (error: any) {
            logger.error('Get Income Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve income data'
            });
        }
    }

    static async updateIncome(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const incomeData: Partial<Income> = req.body;
            
            const income = await IncomeModel.update(userId, incomeData);
            
            res.status(200).json({
                success: true,
                message: 'Income data updated successfully',
                data: income
            });
        } catch (error: any) {
            logger.error('Update Income Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update income data'
            });
        }
    }

    // ============================================================
    // EXPENSE CONTROLLERS
    // ============================================================

    static async getExpense(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const expense = await ExpenseModel.findByUserId(userId);
            
            res.status(200).json({
                success: true,
                data: expense || { user_id: userId, base_expenses: 0, sources: [] }
            });
        } catch (error: any) {
            logger.error('Get Expense Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve expense data'
            });
        }
    }

    static async updateExpense(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const expenseData: Partial<Expense> = req.body;
            
            const expense = await ExpenseModel.update(userId, expenseData);
            
            res.status(200).json({
                success: true,
                message: 'Expense data updated successfully',
                data: expense
            });
        } catch (error: any) {
            logger.error('Update Expense Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update expense data'
            });
        }
    }

    // ============================================================
    // ASSET CONTROLLERS
    // ============================================================

    static async getAsset(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const asset = await AssetModel.findByUserId(userId);
            
            res.status(200).json({
                success: true,
                data: asset || {
                    user_id: userId,
                    bank_balance: 0,
                    fixed_deposits: 0,
                    mutual_funds: 0,
                    bonds: 0,
                    provident_fund: 0,
                    gold_etfs: 0,
                    land_property: 0,
                    vehicles: 0,
                    gold_physical: 0,
                    other_assets: []
                }
            });
        } catch (error: any) {
            logger.error('Get Asset Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve asset data'
            });
        }
    }

    static async updateAsset(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const assetData: Partial<Asset> = req.body;
            
            const asset = await AssetModel.update(userId, assetData);
            
            res.status(200).json({
                success: true,
                message: 'Asset data updated successfully',
                data: asset
            });
        } catch (error: any) {
            logger.error('Update Asset Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update asset data'
            });
        }
    }

    // ============================================================
    // LIABILITY CONTROLLERS
    // ============================================================

    static async getLiability(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const liability = await LiabilityModel.findByUserId(userId);
            
            res.status(200).json({
                success: true,
                data: liability || {
                    user_id: userId,
                    home_loan: 0,
                    personal_loan: 0,
                    car_loan: 0,
                    credit_card_loan: 0,
                    business_loan: 0,
                    other_liabilities: 0
                }
            });
        } catch (error: any) {
            logger.error('Get Liability Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve liability data'
            });
        }
    }

    static async updateLiability(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const liabilityData: Partial<Liability> = req.body;
            
            const liability = await LiabilityModel.update(userId, liabilityData);
            
            res.status(200).json({
                success: true,
                message: 'Liability data updated successfully',
                data: liability
            });
        } catch (error: any) {
            logger.error('Update Liability Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update liability data'
            });
        }
    }

    // ============================================================
    // SAFETY NET CONTROLLERS
    // ============================================================

    static async getSafetyNet(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const safetyNet = await SafetyNetModel.findByUserId(userId);
            
            res.status(200).json({
                success: true,
                data: safetyNet || {
                    user_id: userId,
                    emergency_fund: 0,
                    life_insurance: 0,
                    health_insurance: 0,
                    general_insurance: 0
                }
            });
        } catch (error: any) {
            logger.error('Get Safety Net Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve safety net data'
            });
        }
    }

    static async updateSafetyNet(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const safetyNetData: Partial<SafetyNet> = req.body;
            
            const safetyNet = await SafetyNetModel.update(userId, safetyNetData);
            
            res.status(200).json({
                success: true,
                message: 'Safety net data updated successfully',
                data: safetyNet
            });
        } catch (error: any) {
            logger.error('Update Safety Net Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update safety net data'
            });
        }
    }

    // ============================================================
    // GET ALL FINANCIAL DATA
    // ============================================================

    static async getAllFinancialData(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            
            const [income, expense, asset, liability, safetyNet] = await Promise.all([
                IncomeModel.findByUserId(userId),
                ExpenseModel.findByUserId(userId),
                AssetModel.findByUserId(userId),
                LiabilityModel.findByUserId(userId),
                SafetyNetModel.findByUserId(userId)
            ]);
            
            res.status(200).json({
                success: true,
                data: {
                    income: income || { user_id: userId, base_income: 0, sources: [] },
                    expense: expense || { user_id: userId, base_expenses: 0, sources: [] },
                    asset: asset || {
                        user_id: userId,
                        bank_balance: 0,
                        fixed_deposits: 0,
                        mutual_funds: 0,
                        bonds: 0,
                        provident_fund: 0,
                        gold_etfs: 0,
                        land_property: 0,
                        vehicles: 0,
                        gold_physical: 0,
                        other_assets: []
                    },
                    liability: liability || {
                        user_id: userId,
                        home_loan: 0,
                        personal_loan: 0,
                        car_loan: 0,
                        credit_card_loan: 0,
                        business_loan: 0,
                        other_liabilities: 0
                    },
                    safetyNet: safetyNet || {
                        user_id: userId,
                        emergency_fund: 0,
                        life_insurance: 0,
                        health_insurance: 0,
                        general_insurance: 0
                    }
                }
            });
        } catch (error: any) {
            logger.error('Get All Financial Data Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve financial data'
            });
        }
    }
}
