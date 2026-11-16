import { Request, Response, NextFunction } from 'express';
import { RebalancingService } from '../services/rebalancing.service';
import { PortfolioService } from '../services/portfolio.service';
import { ProfilingService } from '../services/profiling.service';
import { ProfileModel } from '../models/profile.model';
import db from '../config/database';
import logger from '../config/logger';

export class RebalancingController {
    /**
     * GET /api/v1/rebalancing/analyze
     */
    static async getAnalysis(req: Request, res: Response, next: NextFunction) {
        try {
            // If clientId is provided in the query string, use it (advisor viewing client)
            // Otherwise, use the authenticated user's ID
            const targetUserId = req.query.clientId ? (req.query.clientId as string) : (req as any).user.id;
            
            // 1. Get Portfolio Analytics
            const portfolio = await PortfolioService.getPortfolioAnalytics(targetUserId);

            // 2. Get User Profile & User Record for Persona
            const [profile, userRecord] = await Promise.all([
                ProfileModel.findByUserId(targetUserId),
                db.query('SELECT assigned_persona FROM users WHERE id = $1', [targetUserId])
            ]);
            
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: 'Financial profile not found. Please complete your profile first.'
                });
            }

            // 3. Determine Persona: Prefer the assigned_persona from the users table
            const assignedPersona = userRecord.rows[0]?.assigned_persona;
            let profilingResult = ProfilingService.analyze(profile as any);
            
            if (assignedPersona && assignedPersona !== profilingResult.persona.id) {
                // Override with database persona to ensure consistency with dashboard
                const personaDetails = ProfilingService.getPersonaDetails(assignedPersona);
                profilingResult = {
                    ...profilingResult,
                    persona: {
                        id: assignedPersona,
                        name: personaDetails.name,
                        description: `Strategy: ${personaDetails.strategy}`,
                        risk_appetite: assignedPersona === 'A' ? 'Medium' : (assignedPersona === 'B' ? 'High' : 'Low')
                    }
                };
            }

            const personaDetails = ProfilingService.getPersonaDetails(profilingResult.persona.id);

            // 4. Run Rebalancing Analysis
            const result = RebalancingService.analyze(portfolio, profilingResult);

            logger.info(`Rebalancing analysis generated for user: ${targetUserId}`, {
                overallDrift: result.overallDriftPct,
                suggestionsCount: result.suggestions.length
            });

            return res.json({
                success: true,
                data: {
                    ...result,
                    personaName: personaDetails.name,
                    strategyName: personaDetails.strategy,
                    holdings: portfolio.holdingDetails
                }
            });
        } catch (error) {
            logger.error('Error in RebalancingController.getAnalysis', error);
            return next(error);
        }
    }
}
