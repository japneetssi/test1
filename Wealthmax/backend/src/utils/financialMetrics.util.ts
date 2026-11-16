/**
 * Utility to rigorously calculate client financial targets strictly in the backend.
 * This guarantees the frontend is pure and only consumes calculated data.
 */

export interface ClientProfileData {
  monthlyIncome: number;
  monthlyFixedExpenses: number;
  monthlyEMIs: number;
  investibleSurplus: number;
  actualEmergencyFund: number;
  actualLifeCover: number;
  actualHealthCover: number;
  actualSavingsRate: number;
  // additional profile metrics can be added here
}

export const generateFinancialMetrics = (profile: ClientProfileData) => {
  // 1. Emergency Fund Target: (Fixed Expenses + EMIs) * 9 months
  const requiredEmergencyFund = (profile.monthlyFixedExpenses + profile.monthlyEMIs) * 9;

  // 2. Life Insurance Target: Total Annual Income * 20
  const annualIncome = profile.monthlyIncome * 12;
  const requiredLifeCover = annualIncome * 20;

  // 3. Health Insurance Target: Minimum base of ₹10,00,000
  const requiredHealthCover = 1000000;

  // 4. Savings Rate Ratio: (Investible Surplus / Total Monthly Inflow) * 100
  const totalInflow = profile.monthlyIncome; // Assuming monthlyIncome includes all inflows
  const savingsRatePercentage = totalInflow > 0 
    ? (profile.investibleSurplus / totalInflow) * 100 
    : 0;

  // Generate strict response payload for the frontend
  return {
    emergencyFund: {
      actual: profile.actualEmergencyFund,
      target: requiredEmergencyFund,
      status: profile.actualEmergencyFund >= requiredEmergencyFund ? 'Everything looks good' : 'Concern'
    },
    lifeInsurance: {
      actual: profile.actualLifeCover,
      target: requiredLifeCover,
      status: profile.actualLifeCover >= requiredLifeCover ? 'Everything looks good' : 'Concern'
    },
    healthInsurance: {
      actual: profile.actualHealthCover,
      target: requiredHealthCover,
      status: profile.actualHealthCover >= requiredHealthCover ? 'Everything looks good' : 'Concern'
    },
    savingsRate: {
      actualPercentage: savingsRatePercentage,
      status: savingsRatePercentage >= 30 ? 'Everything looks good' : 'Concern' // 30% is a standard benchmark
    }
  };
};
