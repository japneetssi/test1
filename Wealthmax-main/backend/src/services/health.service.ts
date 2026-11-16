import { FinancialProfile } from '../models/profile.model';
import { GoalModel } from '../models/goal.model';
import db from '../config/database';

export class HealthService {

    static async recalculate(userId: string, profileInput: FinancialProfile, riskScore: number = 50, personaLabel?: string) {
        
        const income = Number(profileInput.gross_income || 0) / 12; // Annual -> Monthly
        const expenses = Number(profileInput.fixed_expenses || 0);
        const emi = Number(profileInput.liabilities_emi || 0);
        const premium = 0; // Removed from DB

        // --- A. Savings Rate (20%) ---
        const surplus = income - (expenses + emi);
        const savingsRatio = income > 0 ? surplus / income : 0;
        let scoreSavings = (savingsRatio / 0.20) * 20;
        if (scoreSavings > 20) scoreSavings = 20;
        if (scoreSavings < 0) scoreSavings = 0;

        // --- B. Debt Ratio (20%) ---
        const debtRatio = income > 0 ? emi / income : 0;
        let scoreDebt = 20; 
        if (debtRatio > 0.40) {
            scoreDebt = 0;
        } else if (debtRatio > 0.30) {
            scoreDebt = 15 - ((debtRatio - 0.30) / 0.10) * 15;
        } else {
            scoreDebt = 20;
        }

        // --- C. Liquidity (15%) ---
        const storedEF = Number(profileInput.emergency_fund_amount) || 0;
        const monthsCovered = expenses > 0 ? storedEF / expenses : 0;
        let scoreLiquidity = (monthsCovered / 6) * 15;
        if (scoreLiquidity > 15) scoreLiquidity = 15;

        // --- D. Asset Diversity (15%) ---
        // Proxy using total assets size
        const totalAssetVal = Number(profileInput.existing_assets) || 0;
        let scoreDiversity = totalAssetVal > (income * 12 * 2) ? 15 : 10;
        if (totalAssetVal === 0) scoreDiversity = 5;

        // --- E. Protection (Insurance) (15%) ---
        const incomeAnnual = Number(profileInput.gross_income || 0);
        const currentCover = Number(profileInput.insurance_cover || 0);
        const dependents = Number(profileInput.dependents || 0);
        const totalLiabilities = Number((profileInput as any).total_liabilities || 0);

        // 1. Life Insurance (5 points max - uses existing protection ratio logic)
        const requiredLifeCover = dependents > 0 ? (incomeAnnual * 10) + totalLiabilities : (incomeAnnual * 5); // Increased for non-dependents from 2 to 5 for better coverage
        const protectionRatio = requiredLifeCover > 0 ? currentCover / requiredLifeCover : 1;
        
        let scoreLife = protectionRatio * 5;
        if (scoreLife > 5) scoreLife = 5;

        // 2. Health Insurance (5 points max)
        let healthCover = Number(profileInput.health_insurance_cover || 0);
        if (healthCover === 0 && profileInput.safety_net_details && Array.isArray(profileInput.safety_net_details)) {
            healthCover = profileInput.safety_net_details
                .filter((i: any) => i.type?.toLowerCase().includes('health'))
                .reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
        }

        let recommendedHealthCover = 0;
        if (incomeAnnual <= 750000) {
            recommendedHealthCover = 1200000; // 12 lakh
        } else if (incomeAnnual <= 2000000) {
            recommendedHealthCover = 2500000; // 25 lakh
        } else if (incomeAnnual <= 3000000) {
            recommendedHealthCover = 4000000; // 40 lakh
        } else {
            recommendedHealthCover = Math.min(incomeAnnual * 2, 50000000); // 2x income, capped at 5 crore
        }
        
        const healthRatio = recommendedHealthCover > 0 ? healthCover / recommendedHealthCover : 1;
        let scoreHealth = healthRatio * 5;
        if (scoreHealth > 5) scoreHealth = 5;

        // 3. General Insurance (5 points max)
        // Calculated based on the existing general insurance logic (using the existing protection ratio logic for the remaining 5 points)
        let scoreGeneral = protectionRatio * 5; 
        if (scoreGeneral > 5) scoreGeneral = 5;

        let scoreProtection = scoreLife + scoreHealth + scoreGeneral;
        if (scoreProtection > 15) scoreProtection = 15;

        // --- F. Goal Preparedness (10%) ---
        const goals = await GoalModel.findByUserId(userId);
        let scoreGoal = 0;

        if (goals.length === 0) {
            scoreGoal = 5; // Baseline for having no goals
        } else {
            const now = new Date();
            let totalCurrent = 0;
            let totalExpected = 0;

            for (const goal of goals) {
                const targetDate = new Date(goal.target_date);
                const createdAt = new Date(goal.created_at);
                
                const totalDurationMs = targetDate.getTime() - createdAt.getTime();
                const elapsedMs = now.getTime() - createdAt.getTime();
                
                // Avoid division by zero and handle future targets
                const duration = Math.max(totalDurationMs, 1000 * 60 * 60 * 24 * 365); // Min 1 year duration for scaling
                const elapsed = Math.max(elapsedMs, 0);
                
                const expectedToday = (Number(goal.target_amount) / duration) * elapsed;
                
                totalCurrent += Number(goal.current_amount);
                totalExpected += Math.max(expectedToday, 1); // Avoid 0
            }

            const fundedRatio = totalCurrent / totalExpected;
            scoreGoal = fundedRatio * 10;
            if (scoreGoal > 10) scoreGoal = 10;
            if (scoreGoal < 2) scoreGoal = 2; // Minimum floor for having goals
        }

        // --- G. Financial Literacy (5%) ---
        let scoreLiteracy = (riskScore / 100) * 5;

        // Total
        const totalHealth = Math.round(scoreSavings + scoreDebt + scoreLiquidity + scoreDiversity + scoreProtection + scoreGoal + scoreLiteracy);

        // Persist score and factors using ScoreHistoryModel
        const { ScoreHistoryModel } = await import('../models/scoreHistory.model');
        const factors = {
            savings: { score: Math.round(scoreSavings), max: 20 },
            debt: { score: Math.round(scoreDebt), max: 20 },
            liquidity: { score: Math.round(scoreLiquidity), max: 15 },
            diversity: { score: Math.round(scoreDiversity), max: 15 },
            protection: { score: Math.round(scoreProtection), max: 15 },
            goals: { score: Math.round(scoreGoal), max: 10 },
            literacy: { score: Math.round(scoreLiteracy), max: 5 }
        };

        await ScoreHistoryModel.saveScore(userId, totalHealth, factors);

        // Return combined format for controller
        return {
            ...profileInput,
            health_score: totalHealth,
            health_factors: {
                savings: { score: Math.round(scoreSavings), max: 20 },
                debt: { score: Math.round(scoreDebt), max: 20 },
                liquidity: { score: Math.round(scoreLiquidity), max: 15 },
                diversity: { score: Math.round(scoreDiversity), max: 15 },
                protection: { score: Math.round(scoreProtection), max: 15 },
                goals: { score: Math.round(scoreGoal), max: 10 },
                literacy: { score: Math.round(scoreLiteracy), max: 5 }
            }
        };
    }
}
