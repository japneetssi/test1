// Utility functions for Financial Calculations including Fixed 12% ROI and Step-up SIP

export const FIXED_ROI_ANNUAL = 12; // 12% fixed ROI
export const FIXED_ROI_MONTHLY = FIXED_ROI_ANNUAL / 100 / 12;

/**
 * Calculates the Future Value of a Step-Up SIP.
 * 
 * @param initialMonthlyInvestment The monthly investment amount for the first year.
 * @param years Total number of years.
 * @param stepUpPercentage The percentage by which the SIP increases annually (e.g., 5, 10).
 * @returns The future value (projected wealth) at the end of the term.
 */
export function calculateStepUpSIPFutureValue(
    initialMonthlyInvestment: number,
    years: number,
    stepUpPercentage: number
): number {
    let currentMonthlyInvestment = initialMonthlyInvestment;
    let totalValue = 0;

    for (let year = 1; year <= years; year++) {
        for (let month = 1; month <= 12; month++) {
            // Apply monthly interest to the accumulated amount
            totalValue = totalValue * (1 + FIXED_ROI_MONTHLY);
            // Add the current month's investment
            totalValue += currentMonthlyInvestment;
        }
        // Increase the SIP amount at the end of the year (for the next year)
        if (stepUpPercentage > 0) {
            currentMonthlyInvestment += currentMonthlyInvestment * (stepUpPercentage / 100);
        }
    }

    return totalValue;
}

/**
 * Calculates the Required Initial Monthly SIP to achieve a Target Amount.
 * 
 * @param targetAmount The desired future amount.
 * @param years Time horizon in years.
 * @param stepUpPercentage The annual step-up percentage.
 * @returns The required initial monthly investment amount.
 */
export function calculateRequiredSIP(
    targetAmount: number,
    years: number,
    stepUpPercentage: number = 0
): number {
    if (years <= 0 || targetAmount <= 0) return 0;
    
    // Calculate the multiplier (future value of a 1-rupee SIP)
    const multiplier = calculateStepUpSIPFutureValue(1, years, stepUpPercentage);
    
    if (multiplier === 0) return 0;
    
    return targetAmount / multiplier;
}

/**
 * Projects the Year-by-Year wealth for charting.
 * 
 * @param initialMonthlyInvestment Initial monthly investment.
 * @param years Total years.
 * @param stepUpPercentage Annual step-up percentage.
 * @returns Array of data points per year.
 */
export function projectSIPWealth(
    initialMonthlyInvestment: number,
    years: number,
    stepUpPercentage: number = 0
) {
    let currentMonthlyInvestment = initialMonthlyInvestment;
    let totalValue = 0;
    let totalInvested = 0;
    
    const yearlyData = [];

    for (let year = 1; year <= years; year++) {
        let yearlyInvestment = 0;
        for (let month = 1; month <= 12; month++) {
            totalValue = totalValue * (1 + FIXED_ROI_MONTHLY);
            totalValue += currentMonthlyInvestment;
            
            yearlyInvestment += currentMonthlyInvestment;
            totalInvested += currentMonthlyInvestment;
        }
        
        yearlyData.push({
            year: `Yr ${year}`,
            invested: Math.round(totalInvested),
            gains: Math.round(totalValue - totalInvested),
            totalValue: Math.round(totalValue),
            sipAmount: Math.round(currentMonthlyInvestment)
        });
        
        // Increase the SIP amount for the next year
        if (stepUpPercentage > 0) {
            currentMonthlyInvestment += currentMonthlyInvestment * (stepUpPercentage / 100);
        }
    }

    return {
        yearlyData,
        summary: {
            totalValue: Math.round(totalValue),
            investedAmount: Math.round(totalInvested),
            gains: Math.round(totalValue - totalInvested)
        }
    };
}
