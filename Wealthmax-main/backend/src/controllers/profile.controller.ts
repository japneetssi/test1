import { Request, Response } from 'express';
import { ProfileModel, FinancialProfile } from '../models/profile.model';
import { ProfilingService, FinancialInput } from '../services/profiling.service';
import { HealthService } from '../services/health.service';

import { NextBestActionService } from '../services/nextBestAction.service';
import { UserModel } from '../models/user.model';
import { ReportDataService } from '../services/reportData.service';
import { EncryptionService } from '../services/encryption.service';
import logger from '../config/logger';
import { PortfolioService } from '../services/portfolio.service';
import { computePortfolioAnalytics } from '../services/portfolioAnalytics.service';
import { RebalancingService } from '../services/rebalancing.service';
import { TaxService } from '../services/tax.service';
import { ScoreHistoryModel } from '../models/scoreHistory.model';
import { GoalModel } from '../models/goal.model';

export class ProfileController {

    // Create or Update Profile (Upsert logic often better, but keeping simple)
    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id; // From Auth Middleware
            const input: FinancialInput = req.body;

            // 1. Fetch user data
            const user = await UserModel.findById(userId);
            const riskClass = user?.risk_class || undefined;

            // FIX #18: on first onboarding the DOB lives in req.body but has not
            // been persisted to users.dob yet. Previously age defaulted to 30 in
            // that case, running persona classification with the wrong age.
            // Calculate age from the submitted DOB, then fall back to the stored
            // DOB, then to input.age.
            let finalAge = input.age || 30;
            const dobCandidates: Array<Date | null> = [];
            if ((input as any).dob) dobCandidates.push(new Date((input as any).dob));
            if (user?.dob) dobCandidates.push(new Date(user.dob));

            for (const candidate of dobCandidates) {
                if (!candidate || Number.isNaN(candidate.getTime())) continue;
                const birthDate = candidate;
                const today = new Date();
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
                if (calculatedAge >= 0 && calculatedAge < 130) {
                    finalAge = calculatedAge;
                    input.age = finalAge; // ProfilingService gets the real age
                    break;
                }
            }

            const analysis = ProfilingService.analyze(input, riskClass as 'Conservative' | 'Moderate' | 'Aggressive' | undefined);

            // Calculate totals from modular arrays
            const normalizeToMonthly = (amount: number, freq: string) => {
                if (freq === 'Annually') return amount / 12;
                if (freq === 'Quarterly') return amount / 3;
                if (freq === 'Daily') return amount * 30;
                return amount; // 'Monthly' default
            };
            const normalizeToAnnual = (amount: number, freq: string) => {
                if (freq === 'Monthly') return amount * 12;
                if (freq === 'Quarterly') return amount * 4;
                if (freq === 'Daily') return amount * 365;
                return amount; // 'Annually' default
            };

            const income_details = input.income_details || [];
            const expense_details = input.expense_details || [];
            const asset_details = input.asset_details || [];
            const liability_details = input.liability_details || [];
            const safety_net_details = input.safety_net_details || [];
            const dependent_details = input.dependent_details || (input as any).safetyNet?.dependents || [];

            const calculated_gross_income = income_details.reduce((sum: number, item: any) => sum + normalizeToAnnual(Number(item.amount || 0), item.frequency), 0);
            const calculated_monthly_expenses = expense_details.reduce((sum: number, item: any) => sum + normalizeToMonthly(Number(item.amount || 0), item.frequency), 0);
            const calculated_assets = asset_details.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
            const calculated_liabilities = liability_details.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
            const calculated_insurance_cover = safety_net_details.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
            const calculated_emi = liability_details.reduce((sum: number, item: any) => sum + Number(item.emi || 0), 0); // Assuming EMI can be stored

            const profileData: Partial<FinancialProfile> = {
                user_id: userId,
                gross_income: calculated_gross_income > 0 ? calculated_gross_income : Number(input.gross_income || 0),
                liabilities_emi: calculated_emi > 0 ? calculated_emi : Number(input.monthly_emi || (input as any).liabilities_emi || 0),
                fixed_expenses: calculated_monthly_expenses > 0 ? calculated_monthly_expenses : Number(input.fixed_expenses || 0),
                existing_assets: calculated_assets > 0 ? calculated_assets : Number(input.existing_assets || 0),
                emergency_fund_amount: Number((input as any).emergency_fund_amount || (input as any).emergencyFund || 0),
                insurance_cover: calculated_insurance_cover > 0 ? calculated_insurance_cover : Number((input as any).insurance_cover || 0),
                dependents: Number((input as any).dependents || 0),
                total_liabilities: calculated_liabilities > 0 ? calculated_liabilities : Number((input as any).total_liabilities || 0),
                // New comprehensive fields
                other_income: Number((input as any).other_income || 0),
                household_expenses: calculated_monthly_expenses > 0 ? calculated_monthly_expenses : Number((input as any).household_expenses || input.fixed_expenses || 0),
                bank_balance: asset_details.filter((a: any) => a.type?.toLowerCase().includes('bank')).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0) || Number((input as any).bank_balance || 0),
                fixed_deposits: asset_details.filter((a: any) => a.type?.toLowerCase().includes('deposit')).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0) || Number((input as any).fixed_deposits || 0),
                trading_capital: Number((input as any).trading_capital || 0),
                gold_assets: asset_details.filter((a: any) => a.type?.toLowerCase().includes('gold')).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0) || Number((input as any).gold_assets || 0),
                real_estate_assets: asset_details.filter((a: any) => a.category === 'Physical' && a.type?.toLowerCase().includes('property')).reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0) || Number((input as any).real_estate_assets || 0),
                home_loan: liability_details.filter((l: any) => l.type?.toLowerCase().includes('home')).reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0) || Number((input as any).home_loan || 0),
                personal_loan: liability_details.filter((l: any) => l.type?.toLowerCase().includes('personal')).reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0) || Number((input as any).personal_loan || 0),
                health_insurance_cover: safety_net_details.filter((i: any) => i.type?.toLowerCase().includes('health')).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0) || Number((input as any).health_insurance_cover || 0),
                is_active_trader: (input as any).is_active_trader ?? true,
                trading_capital_allocation_percent: Number((input as any).trading_capital_allocation_percent || 0),
                trading_strategies: (input as any).trading_strategies || [],
                income_details,
                expense_details,
                asset_details,
                liability_details,
                safety_net_details,
                dependent_details
            };

            // [NEW] Update Identity fields (DOB, PAN) in the users table
            const userUpdates: any = {};
            if ((input as any).dob) userUpdates.dob = (input as any).dob;
            if ((input as any).pan_number) {
                userUpdates.pan_encrypted = EncryptionService.encrypt((input as any).pan_number);
            }
            if ((input as any).occupation) userUpdates.occupation = (input as any).occupation;
            if ((input as any).marital_status) userUpdates.marital_status = (input as any).marital_status;
            if ((input as any).retirement_age_goal) userUpdates.retirement_age_goal = (input as any).retirement_age_goal;
            
            // Persist the calculated persona
            userUpdates.assigned_persona = analysis.persona.id;

            if (Object.keys(userUpdates).length > 0) {
                await UserModel.updateProfile(userId, userUpdates);
                logger.debug('User identity and persona fields updated', { userId, fields: Object.keys(userUpdates) });
            }

            // 2. Check if profile exists and update FIRST
            const existing = await ProfileModel.findByUserId(userId);

            if (existing) {
                await ProfileModel.update(userId, profileData);
                logger.debug('Profile updated successfully', { userId });
            } else {
                await ProfileModel.create(profileData);
                logger.debug('Profile created successfully', { userId });
            }

            // [COMPLIANCE] Audit Log
            const { AuditService } = await import('../services/audit.service');
            await AuditService.log({
                userId,
                action: existing ? 'UPDATE_PROFILE' : 'CREATE_PROFILE',
                resource: 'profile',
                details: { riskClass, persona: analysis?.persona?.name },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            // 3. Extract Recommendations and Save Action Items (non-blocking)
            const recommendations = analysis.recommendations || [];
            try {
                await ProfileModel.saveActionItems(userId, recommendations);
                logger.debug('Action items saved', { count: recommendations.length });
            } catch (actionError: any) {
                logger.warn('Failed to save action items, continuing...', { error: actionError.message });
            }

            // 4. Recalculate Health Score
            let savedProfile = await HealthService.recalculate(userId, profileData as FinancialProfile, 50, user?.assigned_persona);

            if (!savedProfile) {
                throw new Error('Failed to recalculate health score');
            }

            // 5. Score History is already saved within HealthService.recalculate
            logger.debug('Health score recalculated and persisted', { userId, score: savedProfile.health_score });

            // 6. Map recommendations to frontend structure
            const actions = recommendations.map(rec => ({
                id: rec.id,
                title: rec.title,
                description: rec.description,
                category: rec.category,
                priority: rec.priority,
                gap_amount: rec.gap || 0,
                estimated_score_impact: parseInt(rec.scoreImpact?.replace(/\D/g, '') || '0'),
                action: rec.action,
                linked_tool: rec.linked_tool,
                persona_context: rec.persona_context,
                risk_type: rec.type
            }));

            // Decrypt sensitive data if available
            let rawPan = user?.pan_encrypted;
            if (rawPan && rawPan.includes(':')) {
                try {
                    rawPan = EncryptionService.decrypt(rawPan) || rawPan;
                } catch (e) {
                    logger.error('Failed to decrypt PAN in profile update', e);
                }
            }
            let rawGovtIdNumber = user?.govt_id_number_encrypted;
            if (rawGovtIdNumber && rawGovtIdNumber.includes(':')) {
                try {
                    rawGovtIdNumber = EncryptionService.decrypt(rawGovtIdNumber) || rawGovtIdNumber;
                } catch (e) {
                    logger.error('Failed to decrypt Govt ID in profile update', e);
                }
            }

            const percentile = await ScoreHistoryModel.getGlobalPercentile(userId, savedProfile.health_score);
            const personaNameActual = analysis.persona.name;

            const responseData = { 
                ...savedProfile, 
                monthly_emi: savedProfile.liabilities_emi, // Map for FE
                full_name: user?.full_name,
                email: user?.email,
                mobile: user?.mobile,
                pan_number: (input as any).pan_number || rawPan,
                dob: (input as any).dob || user?.dob,
                occupation: (input as any).occupation || user?.occupation,
                marital_status: (input as any).marital_status || user?.marital_status,
                retirement_age_goal: (input as any).retirement_age_goal || user?.retirement_age_goal,
                govt_id_type: (input as any).govt_id_type || user?.govt_id_type,
                govt_id_number: (input as any).govt_id_number || rawGovtIdNumber,
                address: (input as any).address || user?.address,
                kyc_status: user?.kyc_status || 'Pending',
                total_liabilities: savedProfile.total_liabilities,
                is_email_verified: !!user?.email, 
                gamification: {
                    percentile,
                    benchmark: `${personaNameActual}`
                },
                persona_data: {
                    ...analysis,
                    health_factors: savedProfile.health_factors
                },
                risk_class: userUpdates.risk_class || user?.risk_class,
                risk_score: user?.risk_score,
                modularData: {
                    income: profileData.income_details,
                    expenses: profileData.expense_details,
                    assets: profileData.asset_details,
                    liabilities: profileData.liability_details,
                    safetyNet: {
                        emergency_fund_amount: profileData.emergency_fund_amount,
                        insurance: profileData.safety_net_details,
                        dependents: profileData.dependent_details
                    }
                }
            };

            res.status(200).json({
                success: true,
                message: 'Profile updated with persona analysis',
                data: responseData
            });

        } catch (error: any) {
            logger.error('Profile Update Error', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile'
            });
        }
    }

    static async getProfile(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const profile = await ProfileModel.findByUserId(userId);
            const user = await UserModel.findById(userId);

            if (!profile) {
                res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
                return;
            }

            const actionItems = await ProfileModel.getActionItems(userId);
            
            // Fetch latest health score and factors
            const { ScoreHistoryModel } = await import('../models/scoreHistory.model');
            const latestScore = await ScoreHistoryModel.getLatestScore(userId);

            const { AnalyticsService } = await import('../services/analytics.service');
            const snapshot = await AnalyticsService.getPortfolioSnapshot(userId);

            const goals = await GoalModel.findByUserAndFamily(userId, user?.family_id);

            // Generate persona analysis on the fly for consistency
            const financialInput: FinancialInput = {
                age: 30, // Default fallback
                gross_income: Number(profile.gross_income),
                monthly_emi: Number(profile.liabilities_emi),
                fixed_expenses: Number(profile.fixed_expenses),
                existing_assets: Number(profile.existing_assets),
                total_liabilities: Number((profile as any).total_liabilities || 0),
                insurance_premium: Number((profile as any).insurance_premium || 0),
                insurance_coverage: Number(profile.insurance_cover),
                emergency_fund_amount: Number(profile.emergency_fund_amount)
            };

            // Calculate age if DOB exists
            if (user?.dob) {
                const birthDate = new Date(user.dob);
                const today = new Date();
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
                financialInput.age = calculatedAge;
            }

            const analysis = ProfilingService.analyze(financialInput, user?.risk_class as any);

            // [Lazy Migration] If persona is not in DB, save it now
            if (!user?.assigned_persona && analysis.persona.id) {
                await UserModel.updateProfile(userId, { assigned_persona: analysis.persona.id });
                logger.info(`Lazy-migrated persona for user ${userId} to ${analysis.persona.id}`);
            }

            // Decrypt sensitive data if available
            let rawPan = user?.pan_encrypted;
            if (rawPan && rawPan.includes(':')) {
                try {
                    rawPan = EncryptionService.decrypt(rawPan) || rawPan;
                } catch (e) {
                    logger.error('Failed to decrypt PAN in profile', e);
                }
            }
            let rawGovtIdNumber = user?.govt_id_number_encrypted;
            if (rawGovtIdNumber && rawGovtIdNumber.includes(':')) {
                try {
                    rawGovtIdNumber = EncryptionService.decrypt(rawGovtIdNumber) || rawGovtIdNumber;
                } catch (e) {
                    logger.error('Failed to decrypt Govt ID in profile', e);
                }
            }

            res.status(200).json({
                success: true,
                data: {
                    ...profile,
                    monthly_emi: profile.liabilities_emi, // Map for FE
                    full_name: user?.full_name,
                    email: user?.email,
                    mobile: user?.mobile,
                    pan_number: rawPan,
                    dob: user?.dob,
                    life_insurance_cover: ((profile as any).safety_net_details || []).filter((i: any) => i.type?.toLowerCase().includes('life') || i.type?.toLowerCase().includes('term')).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0),
                    occupation: user?.occupation,
                    marital_status: user?.marital_status,
                    retirement_age_goal: user?.retirement_age_goal,
                    govt_id_type: user?.govt_id_type,
                    govt_id_number: rawGovtIdNumber,
                    address: user?.address,
                    kyc_status: user?.kyc_status || 'Pending',
                    risk_class: user?.risk_class,
                    risk_score: user?.risk_score,
                    action_items: actionItems,
                    health_score: latestScore?.health_score || 0,
                    projected_score: Math.min(100, (latestScore?.health_score || 0) + (actionItems || []).reduce((sum: number, item: any) => sum + (item.estimated_score_impact || 0), 0)),
                    is_email_verified: !!user?.email,
                    gamification: {
                        percentile: latestScore ? await ScoreHistoryModel.getGlobalPercentile(userId, latestScore.health_score) : 50,
                        benchmark: `${analysis.persona.name}`
                    },
                    persona_data: {
                        ...analysis,
                        health_factors: latestScore ? {
                            savings: { score: (latestScore as any).savings_score, max: 20 },
                            debt: { score: (latestScore as any).debt_score, max: 20 },
                            liquidity: { score: (latestScore as any).liquidity_score, max: 15 },
                            diversity: { score: (latestScore as any).diversity_score, max: 15 },
                            protection: { score: (latestScore as any).protection_score, max: 15 },
                            goals: { score: (latestScore as any).goals_score, max: 10 },
                            literacy: { score: (latestScore as any).literacy_score, max: 5 }
                        } : undefined
                    },
                    comprehensiveData: ReportDataService.prepareComprehensiveData(user, profile, snapshot),
                    modularData: {
                        income: (profile as any).income_details || [],
                        expenses: (profile as any).expense_details || [],
                        assets: (profile as any).asset_details || [],
                        liabilities: (profile as any).liability_details || [],
                        goals: goals || [],
                        safetyNet: {
                            emergency_fund_amount: profile.emergency_fund_amount,
                            insurance: (profile as any).safety_net_details || [],
                            dependents: (profile as any).dependent_details || []
                        }
                    }
                }
            });

        } catch (error: any) {
            logger.error('Get Profile Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve profile'
            });
        }
    }

    static async updateActionItemStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { status } = req.body;

            if (!['pending', 'completed', 'dismissed'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const updated = await ProfileModel.updateActionItemStatus(id, status, userId);

            if (!updated) {
                return res.status(404).json({ success: false, message: 'Action item not found' });
            }

            return res.json({ success: true, data: updated });
        } catch (error) {
            console.error('Action Update Error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    /**
     * Get Next Best Action for user
     */
    static async getNextBestAction(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const profile = await ProfileModel.findByUserId(userId);
            const user = await UserModel.findById(userId);

            let portfolioDrift = 0;
            let taxSavings = 0;

            if (profile) {
                // 1. Calculate Portfolio Drift
                try {
                    const holdings = await PortfolioService.getHoldings(userId);
                    const riskClass = user?.risk_class || 'Moderate';
                    
                    // Rebalancing requires analytics + profile
                    const analytics = computePortfolioAnalytics(holdings as any);
                    const profilingResult = ProfilingService.analyze({
                        age: 30, // Default
                        gross_income: Number(profile.gross_income),
                        monthly_emi: Number(profile.liabilities_emi),
                        fixed_expenses: Number(profile.fixed_expenses),
                        existing_assets: Number(profile.existing_assets),
                        total_liabilities: Number((profile as any).total_liabilities || 0),
                        insurance_premium: 0, 
                        insurance_coverage: Number(profile.insurance_cover),
                        emergency_fund_amount: Number(profile.emergency_fund_amount)
                    }, riskClass as any);

                    const analysis = RebalancingService.analyze(analytics, profilingResult);
                    portfolioDrift = analysis.overallDriftPct;
                } catch (err) {
                    logger.warn('Failed to calculate drift for NextBestAction', err);
                }

                // 2. Calculate Potential Tax Savings
                try {
                    const taxResult = TaxService.optimize({
                        annual_income: Number(profile.gross_income),
                        is_salaried: true,
                        investments_80c: Math.min(150000, Number(profile.fixed_expenses) * 0.2),
                        health_insurance_80d: 25000
                    });
                    taxSavings = taxResult.savings;
                } catch (err) {
                    logger.warn('Failed to calculate tax savings for NextBestAction', err);
                }
            }

            const nextAction = NextBestActionService.detectNextBestAction(profile, {
                portfolioDrift,
                taxSavings
            });
            const completionPercent = NextBestActionService.getProfileCompletionPercent(profile);

            res.status(200).json({
                success: true,
                data: {
                    nextAction,
                    profileCompletion: completionPercent
                }
            });

        } catch (error: any) {
            logger.error('Get Next Best Action Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get next best action'
            });
        }
    }

    /**
     * Get score history for trend visualization
     */
    static async getScoreHistory(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const limit = parseInt(req.query.limit as string) || 30;

            const { ScoreHistoryModel } = await import('../models/scoreHistory.model');
            const history = await ScoreHistoryModel.getHistory(userId, limit);

            return res.json({
                success: true,
                data: history
            });
        } catch (error: any) {
            logger.error('Get Score History Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch score history'
            });
        }
    }
    /**
     * Get accessible audit logs for the user
     */
    static async getAuditLogs(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { AuditService } = await import('../services/audit.service');
            const logs = await AuditService.getLogsByUser(userId);

            return res.json({
                success: true,
                data: logs
            });
        } catch (error: any) {
            logger.error('Get Audit Logs Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch security logs'
            });
        }
    }
}
