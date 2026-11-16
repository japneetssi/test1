export type FinancialStatus = 'Looks Good' | 'Concern';

export interface ParameterInsight {
  id: string;
  name: string;
  category: string;
  status: FinancialStatus;
  currentIssue: string;
  recommendation: string;
  // Raw values to help with charting later
  metrics?: Record<string, number>;
}

export interface UserFinancialData {
  income: number;
  expenses: number;
  totalAssets: number;
  totalLiabilities: number;
  lifeCover: number;
  healthCover: number;
  emergencyFund: number; // in months or total amount
  investmentRatio: number; // percentage of income invested
  goalsOnTrack: boolean;
  retirementCorpusProjected: number;
  retirementCorpusNeeded: number;
  taxOptimized: boolean;
  hasWill: boolean;
}

export function generateFinancialReport(data: UserFinancialData): ParameterInsight[] {
  const insights: ParameterInsight[] = [];

  // 1. Income (Cash Flow)
  insights.push({
    id: 'income',
    name: 'Income Analysis',
    category: 'Cash Flow',
    status: data.income > 0 ? 'Looks Good' : 'Concern',
    currentIssue: data.income > 0 ? 'Stable income stream detected.' : 'No primary income stream reported.',
    recommendation: data.income > 0 ? 'Focus on increasing primary income or creating secondary income streams.' : 'Prioritize securing a stable source of income.',
    metrics: { totalIncome: data.income }
  });

  // 2. Expenses (Cash Flow)
  const expenseRatio = data.income > 0 ? (data.expenses / data.income) * 100 : 100;
  insights.push({
    id: 'expenses',
    name: 'Expense Management',
    category: 'Cash Flow',
    status: expenseRatio > 70 ? 'Concern' : 'Looks Good',
    currentIssue: expenseRatio > 70 ? `High expense ratio at ${expenseRatio.toFixed(1)}% of income.` : `Healthy expense ratio at ${expenseRatio.toFixed(1)}%.`,
    recommendation: expenseRatio > 70 ? 'Implement the 50/30/20 rule. Try to bring expenses down to 50% of your income.' : 'Keep monitoring discretionary spending to maintain this healthy ratio.',
    metrics: { expenses: data.expenses, expenseRatio }
  });

  // 3. Assets (Net Worth)
  insights.push({
    id: 'assets',
    name: 'Asset Growth',
    category: 'Net Worth',
    status: data.totalAssets > data.totalLiabilities * 2 ? 'Looks Good' : 'Concern',
    currentIssue: data.totalAssets > data.totalLiabilities * 2 ? 'Strong asset base relative to liabilities.' : 'Asset base is relatively low compared to overall liabilities.',
    recommendation: 'Focus on acquiring appreciating assets like equity or real estate over depreciating assets.',
    metrics: { assets: data.totalAssets }
  });

  // 4. Liabilities (Net Worth)
  const debtToAssetRatio = data.totalAssets > 0 ? (data.totalLiabilities / data.totalAssets) * 100 : 0;
  insights.push({
    id: 'liabilities',
    name: 'Debt Management',
    category: 'Net Worth',
    status: debtToAssetRatio > 40 ? 'Concern' : 'Looks Good',
    currentIssue: debtToAssetRatio > 40 ? `High debt burden (${debtToAssetRatio.toFixed(1)}% of assets).` : 'Debt levels are well under control.',
    recommendation: debtToAssetRatio > 40 ? 'Prioritize paying off high-interest debt first to improve your net worth.' : 'Avoid taking on high-interest consumer debt.',
    metrics: { liabilities: data.totalLiabilities, debtToAssetRatio }
  });

  // 5. Insurance (Protection)
  const adequateLifeCover = data.lifeCover >= data.income * 10;
  insights.push({
    id: 'insurance',
    name: 'Risk Protection',
    category: 'Protection',
    status: adequateLifeCover && data.healthCover > 0 ? 'Looks Good' : 'Concern',
    currentIssue: !adequateLifeCover ? 'Life cover is less than 10x your annual income.' : 'Adequate life and health protection in place.',
    recommendation: !adequateLifeCover ? 'Consider increasing term life insurance to at least 10-15x your annual income.' : 'Review health coverage amounts annually to keep up with medical inflation.',
    metrics: { lifeCover: data.lifeCover, healthCover: data.healthCover }
  });

  // 6. Emergency Fund (Protection)
  const monthlyExpenses = data.expenses / 12; // Assuming annual input for simplicity, or we treat data.expenses as monthly. Let's assume data.expenses is annual.
  const monthsCovered = data.emergencyFund / (data.expenses / 12);
  insights.push({
    id: 'emergency-fund',
    name: 'Emergency Fund',
    category: 'Protection',
    status: monthsCovered >= 6 ? 'Looks Good' : 'Concern',
    currentIssue: monthsCovered >= 6 ? `Fund covers ${monthsCovered.toFixed(1)} months of expenses.` : `Only ${monthsCovered.toFixed(1)} months of expenses saved.`,
    recommendation: monthsCovered >= 6 ? 'Your emergency fund is solid. Keep it in highly liquid assets.' : 'Build your emergency fund to cover at least 6 months of mandatory living expenses.',
    metrics: { emergencyFund: data.emergencyFund, monthsCovered }
  });

  // 7. Investment Planning (Wealth Creation)
  insights.push({
    id: 'investment',
    name: 'Investment Planning',
    category: 'Wealth Creation',
    status: data.investmentRatio >= 20 ? 'Looks Good' : 'Concern',
    currentIssue: data.investmentRatio >= 20 ? `Investing ${data.investmentRatio}% of income.` : `Investing only ${data.investmentRatio}% of income.`,
    recommendation: data.investmentRatio >= 20 ? 'Excellent saving habit. Ensure portfolio is diversified.' : 'Aim to invest at least 20% of your monthly income systematically.',
    metrics: { investmentRatio: data.investmentRatio }
  });

  // 8. Goal Planning (Wealth Creation)
  insights.push({
    id: 'goals',
    name: 'Goal Planning',
    category: 'Wealth Creation',
    status: data.goalsOnTrack ? 'Looks Good' : 'Concern',
    currentIssue: data.goalsOnTrack ? 'Financial goals are well funded.' : 'There is a funding gap for major life goals.',
    recommendation: data.goalsOnTrack ? 'Continue systematic investments aligned with goal timelines.' : 'Revisit goal timelines or increase SIP/investments to bridge the gap.',
    metrics: { goalsOnTrack: data.goalsOnTrack ? 1 : 0 }
  });

  // 9. Retirement Planning (Advanced Planning)
  const retirementGap = data.retirementCorpusNeeded - data.retirementCorpusProjected;
  insights.push({
    id: 'retirement',
    name: 'Retirement Planning',
    category: 'Advanced Planning',
    status: retirementGap <= 0 ? 'Looks Good' : 'Concern',
    currentIssue: retirementGap <= 0 ? 'Projected corpus meets retirement needs.' : `Shortfall of ${retirementGap.toLocaleString()} in projected retirement corpus.`,
    recommendation: retirementGap <= 0 ? 'Stay the course and rebalance portfolio as you near retirement age.' : 'Increase equity exposure or step up SIP amounts to close the retirement gap.',
    metrics: { projected: data.retirementCorpusProjected, needed: data.retirementCorpusNeeded }
  });

  // 10. Tax Planning (Advanced Planning)
  insights.push({
    id: 'tax',
    name: 'Tax Planning',
    category: 'Advanced Planning',
    status: data.taxOptimized ? 'Looks Good' : 'Concern',
    currentIssue: data.taxOptimized ? 'Tax liabilities are optimally structured.' : 'Potential to save more on taxes.',
    recommendation: data.taxOptimized ? 'Keep utilizing sections 80C, 80D, and NPS for continued efficiency.' : 'Consult a tax advisor to fully utilize available tax deductions and exemptions.',
    metrics: { taxOptimized: data.taxOptimized ? 1 : 0 }
  });

  // 11. Estate Planning (Advanced Planning)
  insights.push({
    id: 'estate',
    name: 'Estate Planning',
    category: 'Advanced Planning',
    status: data.hasWill ? 'Looks Good' : 'Concern',
    currentIssue: data.hasWill ? 'Will and nominations are in place.' : 'No registered Will detected.',
    recommendation: data.hasWill ? 'Update your Will upon major life events.' : 'Draft a registered Will and ensure nominees are updated on all financial assets.',
    metrics: { hasWill: data.hasWill ? 1 : 0 }
  });

  // 12. Financial Ratio (Cash Flow / General)
  const savingsRatio = data.income > 0 ? ((data.income - data.expenses) / data.income) * 100 : 0;
  insights.push({
    id: 'ratios',
    name: 'Financial Ratios',
    category: 'Cash Flow',
    status: savingsRatio >= 30 ? 'Looks Good' : 'Concern',
    currentIssue: savingsRatio >= 30 ? `Healthy savings ratio of ${savingsRatio.toFixed(1)}%.` : `Low savings ratio (${savingsRatio.toFixed(1)}%).`,
    recommendation: savingsRatio >= 30 ? 'You have a strong surplus. Direct this towards accelerated wealth creation.' : 'Analyze discretionary expenses to improve your overall monthly surplus.',
    metrics: { savingsRatio }
  });

  return insights;
}
