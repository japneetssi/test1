import { Request, Response } from 'express';
import { RISK_QUESTIONS } from '../config/questions';
import { RiskService, SurveyResponse } from '../services/risk.service';
import { HealthService } from '../services/health.service';
import { ProfileModel } from '../models/profile.model'; 
import { UserModel } from '../models/user.model';
import logger from '../config/logger';

export class SurveyController {

    // Get all survey questions
    static getQuestions(_req: Request, res: Response) {
        res.status(200).json({
            success: true,
            data: RISK_QUESTIONS
        });
    }

    // Submit survey responses
    static async submitSurvey(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const responses: SurveyResponse[] = req.body.responses;

            if (!responses || !Array.isArray(responses)) {
                res.status(400).json({ success: false, message: 'Invalid responses format' });
                return;
            }

            // 1. Calculate Score
            const score = RiskService.calculateScore(responses);
            const riskClass = RiskService.determineRiskClass(score);

            // 2. Check Contradictions
            const contradictions = RiskService.detectContradictions(responses);

            // GUARDRAIL: Downgrade risk class if contradictions found
            let finalRiskClass = riskClass;
            if (contradictions.length > 0) {
                if (riskClass === 'Aggressive') finalRiskClass = 'Moderate';
                else if (riskClass === 'Moderate') finalRiskClass = 'Conservative';
                // Conservative stays Conservative

                logger.info(`Downgraded Risk Class for user ${userId} from ${riskClass} to ${finalRiskClass} due to contradictions.`);
            }

            // If significant contradictions, maybe warn user? 
            // For now, we save but return warnings.

            // 3. Save Survey Result (Skipped for Phase 1 MVP - NO DB TABLE)
            const savedSurveyId = 'temp-mvp-id';

            // 4. Update User with new Risk Class and Score
            await UserModel.updateProfile(userId, {
                risk_class: finalRiskClass,
                risk_score: score
            });

            // Recalculate Health Score if profile exists
            const profile = await ProfileModel.findByUserId(userId);
            if (profile) {
                await HealthService.recalculate(userId, profile, score);
            }

            res.status(200).json({
                success: true,
                message: 'Risk profile calculated successfully',
                data: {
                    score,
                    riskClass: finalRiskClass,
                    contradictions,
                    surveyId: savedSurveyId
                }
            });

        } catch (error: any) {
            logger.error('Survey Submit Error', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to process survey'
            });
        }
    }
}
