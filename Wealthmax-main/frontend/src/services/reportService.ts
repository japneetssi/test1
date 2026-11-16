import api from "@/lib/api";

export interface GlobalMetrics {
  netWorth: number;
  investibleSurplus: number;
  totalIncome: number;
  totalExpenses: number;
  totalLiabilities: number;
  totalAssets: number;
  clientName: string;
}

export interface ReportParameter {
  id: string;
  name: string;
  status: string; // "Concern" | "Healthy" | "Data Unavailable"
  currentAssessment: number | string;
  targetRequirement: number | string;
  diagnosis: string;
  actionPlan: string[];
}

export interface SmartReportPayload {
  global: GlobalMetrics;
  parameters: ReportParameter[];
  rawProfile?: any;
}

export const generateSmartReport = async (): Promise<SmartReportPayload> => {
  // Directly sync with the Financial Dashboard's Profile API endpoint
  // This guarantees 100% consistency across the platform
  const { data } = await api.get('/profile');
  const profile = data.data;

  const incomes = profile?.modularData?.income || [];
  const expenses = profile?.modularData?.expenses || [];
  const assets = profile?.modularData?.assets || [];
  const liabilities = profile?.modularData?.liabilities || [];
  const insurances = profile?.modularData?.safetyNet?.insurance || [];

  const hasNoData = incomes.length === 0 && expenses.length === 0 && assets.length === 0 && liabilities.length === 0;

  // Aggregation Math (Syncing exact fields mapped in Dashboard)
  const totalIncomeAnnual = Number(profile?.gross_income || 0); 
  const totalIncomeMonthly = totalIncomeAnnual / 12;
  const totalExpensesMonthly = Number(profile?.fixed_expenses || 0); 
  const totalEmiMonthly = Number(profile?.liabilities_emi || profile?.monthly_emi || 0); 
  
  const totalAssets = assets.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
  const totalLiabilities = liabilities.reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0);

  const investibleSurplusMonthly = totalIncomeMonthly - totalExpensesMonthly - totalEmiMonthly;
  const netWorth = totalAssets - totalLiabilities;
  const emergencyFund = Number(profile?.modularData?.safetyNet?.emergency_fund_amount || profile?.emergency_fund_amount || 0);
  
  const lifeCover = insurances.filter((i: any) => i.type?.toLowerCase().includes('life')).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
  const healthCover = insurances.filter((i: any) => i.type?.toLowerCase().includes('health')).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

  const investmentTypes = ['Individual stocks', 'Individual bonds', 'Mutual funds', 'ETFs', 'Index funds', 'REITs', 'Certificates of Deposit (CDs)', 'Options and futures', 'Annuities'];
  const totalInvestments = assets
    .filter((a: any) => investmentTypes.includes(a.type))
    .reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);

  // Formatting currency for UI strings
  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const defaultMissingText = "Please update your financial profile to generate this metric.";

  // Guaranteed 12-Parameter Array mapped directly from Dashboard API
  const parameters: ReportParameter[] = [
    {
      id: 'income',
      name: 'Income & Cashflow',
      status: totalIncomeAnnual > 0 ? 'Healthy' : 'Data Unavailable',
      currentAssessment: totalIncomeAnnual > 0 ? formatCurrency(totalIncomeAnnual) + '/yr' : 'Data Unavailable',
      targetRequirement: 'Consistent Cashflow',
      diagnosis: totalIncomeAnnual > 0 
        ? 'Your income streams form the foundational baseline of your wealth generation strategy. A robust, consistent primary income allows for aggressive wealth compounding, while secondary streams provide necessary diversification against macro-economic shocks.' 
        : defaultMissingText,
      actionPlan: totalIncomeAnnual > 0 
        ? ['Maximize primary career income through upskilling and strategic negotiations.', 'Develop secondary, decoupled passive income streams (e.g., rental yields, dividend portfolios) to reduce reliance on active labor.', 'Establish a strict system to track and route surplus cash directly into high-yield avenues.'] 
        : ['Add your primary salary or business income to begin the cashflow diagnostic.']
    },
    {
      id: 'expenses',
      name: 'Expenses',
      status: (totalExpensesMonthly + totalEmiMonthly) > 0 ? (((totalExpensesMonthly + totalEmiMonthly) * 12) > (totalIncomeAnnual * 0.5) ? 'Concern' : 'Healthy') : 'Data Unavailable',
      currentAssessment: (totalExpensesMonthly + totalEmiMonthly) > 0 ? formatCurrency((totalExpensesMonthly + totalEmiMonthly) * 12) + '/yr' : 'Data Unavailable',
      targetRequirement: `< 50% of Income`,
      diagnosis: (totalExpensesMonthly + totalEmiMonthly) > 0 
        ? (((totalExpensesMonthly + totalEmiMonthly) * 12) > (totalIncomeAnnual * 0.5) 
            ? 'Your fixed and discretionary expenses currently consume over 50% of your income. This structurally limits your investible surplus and significantly delays your timeline to financial independence.' 
            : 'Your expense ratio is well-optimized. By keeping outflows under 50% of your income, you are generating a strong investible surplus that accelerates long-term compounding.') 
        : defaultMissingText,
      actionPlan: (totalExpensesMonthly + totalEmiMonthly) > 0 
        ? ['Conduct a comprehensive audit of recurring subscriptions and lifestyle inflations.', 'Adopt a zero-based budgeting approach for discretionary spending.', 'Automate your savings (pay yourself first) immediately on payday to artificially constrain available spending capital.'] 
        : ['Input your monthly household expenses to calculate your burn rate.']
    },
    {
      id: 'emergency_fund',
      name: 'Emergency Fund',
      status: totalExpensesMonthly > 0 ? (emergencyFund >= (totalExpensesMonthly * 6) ? 'Healthy' : 'Concern') : 'Data Unavailable',
      currentAssessment: emergencyFund > 0 ? formatCurrency(emergencyFund) : 'Data Unavailable',
      targetRequirement: totalExpensesMonthly > 0 ? formatCurrency(totalExpensesMonthly * 6) : '6x Monthly Expenses',
      diagnosis: emergencyFund > 0 
        ? (emergencyFund >= (totalExpensesMonthly * 6) 
            ? 'Your liquidity buffer is mathematically sound. You possess a critical firewall that protects your long-term investments from being liquidated during sudden medical or macroeconomic crises.' 
            : 'Operating without a fully funded 6-month liquidity buffer is a critical vulnerability. In the event of income disruption, you risk being forced into high-interest debt or liquidating equities at a loss.')
        : defaultMissingText,
      actionPlan: emergencyFund > 0 
        ? ['Structure your emergency fund across a mix of high-yield savings accounts and liquid mutual funds to combat inflation while maintaining immediate access.', 'Review and replenish the fund if any withdrawals are made.', 'Ensure family members have immediate access credentials to this fund.'] 
        : ['Update your profile with your current liquid cash and emergency savings.']
    },
    {
      id: 'assets',
      name: 'Assets',
      status: totalAssets > 0 ? 'Healthy' : 'Data Unavailable',
      currentAssessment: totalAssets > 0 ? formatCurrency(totalAssets) : 'Data Unavailable',
      targetRequirement: 'Appreciating Base',
      diagnosis: totalAssets > 0 
        ? 'Your asset base is the engine of your financial compounding. The structural composition of your assets—balancing equity for growth, debt for stability, and real estate for yield—dictates your trajectory toward generational wealth.' 
        : defaultMissingText,
      actionPlan: totalAssets > 0 
        ? ['Conduct an annual deep-dive into your asset allocation to ensure it aligns with your evolving risk tolerance and market conditions.', 'Identify and liquidate structurally depreciating or underperforming assets to free up capital.', 'Diversify your portfolio to mitigate unsystematic risks associated with single asset classes.'] 
        : ['Catalog your real estate, equity portfolios, and physical assets to establish your baseline.']
    },
    {
      id: 'liabilities',
      name: 'Liabilities',
      status: totalLiabilities > 0 ? (totalLiabilities > (totalAssets * 0.4) ? 'Concern' : 'Healthy') : (totalAssets > 0 ? 'Healthy' : 'Data Unavailable'),
      currentAssessment: totalLiabilities > 0 ? formatCurrency(totalLiabilities) : (totalAssets > 0 ? '₹0 Debt' : 'Data Unavailable'),
      targetRequirement: '< 40% of Assets',
      diagnosis: totalLiabilities > 0 
        ? (totalLiabilities > (totalAssets * 0.4) 
            ? 'Your debt-to-asset ratio is critically high. The compounding interest on your liabilities is actively destroying your wealth generation, requiring an immediate strategic intervention.' 
            : 'Your liabilities are manageable and appear to be leveraged effectively. As long as the cost of debt remains lower than your portfolio yield, this is a mathematically sound position.')
        : (totalAssets > 0 
            ? 'You operate with zero structural debt, which provides massive financial resilience, supreme peace of mind, and absolute freedom over your cashflow.' 
            : defaultMissingText),
      actionPlan: totalLiabilities > 0 
        ? ['Immediately execute a debt avalanche strategy: prioritize clearing unsecured, high-interest obligations like credit cards.', 'Refinance large secured loans (like mortgages) if market interest rates offer a mathematical advantage.', 'Strictly avoid accumulating new depreciating consumer debt.'] 
        : ['Document any outstanding loans or EMIs, or confirm you are debt-free.']
    },
    {
      id: 'life_insurance',
      name: 'Life Cover',
      status: totalIncomeAnnual > 0 ? (lifeCover >= (totalIncomeAnnual * 10) ? 'Healthy' : 'Concern') : 'Data Unavailable',
      currentAssessment: lifeCover > 0 ? formatCurrency(lifeCover) : (totalIncomeAnnual > 0 ? '₹0 Cover' : 'Data Unavailable'),
      targetRequirement: totalIncomeAnnual > 0 ? formatCurrency(totalIncomeAnnual * 10) : '10x Annual Income',
      diagnosis: lifeCover > 0 
        ? (lifeCover >= (totalIncomeAnnual * 10) 
            ? 'Your life cover is mathematically adequate. You have successfully hedged the mortality risk, ensuring that your dependents will not suffer a catastrophic lifestyle downgrade in your absence.' 
            : 'Your current life cover is dangerously inadequate. It fails to replace your future economic value, leaving your dependents exposed to extreme financial hardship in a worst-case scenario.')
        : defaultMissingText,
      actionPlan: lifeCover > 0 
        ? ['Ensure all policies are pure term insurance—do not mix insurance with investments (ULIPs).', 'Verify that nominations are legally accurate and updated across all policies.', 'Review coverage requirements every 3 years or after major life events (marriage, children, large mortgages).'] 
        : ['Purchase a comprehensive pure term life insurance policy immediately.']
    },
    {
      id: 'health_insurance',
      name: 'Health Cover',
      status: insurances.length > 0 ? (healthCover > 0 ? 'Healthy' : 'Concern') : 'Data Unavailable',
      currentAssessment: healthCover > 0 ? formatCurrency(healthCover) : (insurances.length > 0 ? '₹0 Cover' : 'Data Unavailable'),
      targetRequirement: '₹10,00,000 Minimum',
      diagnosis: healthCover > 0 
        ? 'Adequate health insurance is the ultimate defense mechanism for your portfolio. It ensures that systemic medical inflation and unforeseen hospitalizations do not force the liquidation of your long-term assets.' 
        : defaultMissingText,
      actionPlan: healthCover > 0 
        ? ['Evaluate your current base policy against medical inflation and consider layering a low-cost, high-deductible super top-up policy.', 'Review the list of cashless network hospitals in your immediate vicinity.', 'Ensure all pre-existing conditions are formally declared to prevent claim rejections.'] 
        : ['Acquire a comprehensive standalone health insurance policy covering your entire family.']
    },
    {
      id: 'investment',
      name: 'Investments',
      status: totalInvestments > 0 ? 'Healthy' : (hasNoData ? 'Data Unavailable' : 'Concern'),
      currentAssessment: totalInvestments > 0 ? formatCurrency(totalInvestments) : (hasNoData ? 'Data Unavailable' : 'Action Required'),
      targetRequirement: 'Systematic Growth',
      diagnosis: totalInvestments > 0 ? 'Your investment portfolio contains a diversified set of systemic growth assets. Consistent compounding will accelerate your journey toward financial independence.' : (hasNoData ? defaultMissingText : 'An unoptimized or non-automated investment strategy subjects your hard-earned wealth to severe inflation erosion. Without systematic equity exposure, true financial independence is mathematically improbable.'),
      actionPlan: totalInvestments > 0 ? ['Continue automating your SIP mechanisms and rebalancing annually to maintain your target asset allocation.'] : (hasNoData ? ['Catalog your SIPs, mutual funds, and direct equities.'] : ['Establish an automated SIP mechanism tied directly to index funds or diversified equity mutual funds.', 'Implement an annual portfolio rebalancing strategy to maintain your target asset allocation.', 'Focus on minimizing expense ratios and transaction costs over the long term.'])
    },
    {
      id: 'goals',
      name: 'Goal Funding',
      status: hasNoData ? 'Data Unavailable' : 'Concern',
      currentAssessment: 'Data Unavailable',
      targetRequirement: 'Fully Funded',
      diagnosis: hasNoData ? defaultMissingText : 'Abstract desires only become achievable goals when they are quantified, timeline-bound, and actively funded. Unfunded future milestones (like children\'s education or home purchases) will force you into expensive debt traps later.',
      actionPlan: hasNoData ? ['Formally map out your financial goals with specific timelines and target amounts.'] : ['Assign specific investment portfolios to individual financial goals (Goal-Based Investing).', 'Shift asset allocation from equity to debt as a goal\'s target timeline approaches to preserve capital.', 'Set up dedicated, ring-fenced SIPs for non-negotiable goals.']
    },
    {
      id: 'retirement',
      name: 'Retirement Planning',
      status: hasNoData ? 'Data Unavailable' : 'Concern',
      currentAssessment: 'Data Unavailable',
      targetRequirement: 'Matching Projections',
      diagnosis: hasNoData ? defaultMissingText : 'Retirement planning is the singular non-negotiable financial goal. You must accumulate a massive capital base to combat longevity risk and systemic inflation during your decumulation phase when active income ceases.',
      actionPlan: hasNoData ? ['Complete your detailed retirement projection survey.'] : ['Maximize contributions to tax-efficient retirement vehicles like EPF and NPS.', 'Calculate your precise FI (Financial Independence) number using a 4% safe withdrawal rate assumption.', 'Ensure your retirement corpus maintains adequate equity exposure to outpace inflation even post-retirement.']
    },
    {
      id: 'tax',
      name: 'Tax Optimization',
      status: hasNoData ? 'Data Unavailable' : 'Concern',
      currentAssessment: 'Data Unavailable',
      targetRequirement: 'Optimal Deductions',
      diagnosis: hasNoData ? defaultMissingText : 'Unoptimized taxes represent a structural, compounding leakage of your wealth. Efficient tax harvesting and strategic deduction utilization are guaranteed, risk-free returns on your capital.',
      actionPlan: hasNoData ? ['Upload your latest tax return or declare your tax regime.'] : ['Conduct a mathematical comparison between the Old and New tax regimes annually.', 'Maximize Section 80C, 80CCD(1B), and 80D deductions rigorously.', 'Strategically harvest long-term capital gains (LTCG) up to the tax-free limit every financial year.']
    },
    {
      id: 'estate',
      name: 'Estate Planning',
      status: hasNoData ? 'Data Unavailable' : 'Concern',
      currentAssessment: 'Data Unavailable',
      targetRequirement: 'Active Estate Plan',
      diagnosis: hasNoData ? defaultMissingText : 'Estate planning ensures your legacy is transferred efficiently. The absence of an explicit estate plan guarantees bureaucratic friction, legal disputes, and frozen assets for your grieving heirs.',
      actionPlan: hasNoData ? ['Complete the estate planning and nominee module.'] : ['Draft a legally binding, registered Will specifying your exact asset distribution.', 'Create a master financial document containing all accounts, policies, and passwords, and share it with a trusted executor.', 'Ensure 100% of your financial accounts have updated and accurate nominations.']
    }
  ];

  return {
    global: {
      clientName: profile?.full_name || 'Unregistered Profile',
      netWorth,
      investibleSurplus: investibleSurplusMonthly * 12,
      totalIncome: totalIncomeAnnual,
      totalExpenses: (totalExpensesMonthly * 12) + (totalEmiMonthly * 12),
      totalAssets,
      totalLiabilities
    },
    parameters,
    rawProfile: profile
  };
};
