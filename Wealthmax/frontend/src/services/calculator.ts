import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SIPResult {
    futureValue: number;
    totalInvested: number;
    wealthGained: number;
    yearlyBreakdown: { year: number; invested: number; value: number }[];
}

export interface EMIResult {
    emi: number;
    totalPayment: number;
    totalInterest: number;
}

export interface RetirementResult {
    corpusRequired: number;
    monthlySIPRequired: number;
    yearsToRetirement: number;
    inflationAdjustedExpenses: number;
}

export interface LifeInsuranceResult {
    humanLifeValue: number;
    recommendedCover: number;
    gap: number;
}

export interface EducationResult {
    futureCost: number;
    monthlySIPRequired: number;
    lumpSumRequired: number;
}

export interface CostOfDelayResult {
    withDelay: number;
    withoutDelay: number;
    costOfDelay: number;
    delayYears: number;
}

export interface HRAResult {
    exemption: number;
    taxablePay: number;
}

export interface HomeAffordabilityResult {
    maxLoanAmount: number;
    maxPropertyValue: number;
    emi: number;
}

export interface CAGRResult {
    summary: {
        cagr: number;
        absoluteReturn: number;
        multiplier: number;
    };
    chartData: { year: number; value: number }[];
}

// ── API calls (no auth required for calculators) ──────────────────────────────

export async function calculateSIP(params: {
    monthlyInvestment: number;
    rate: number;
    years: number;
}): Promise<SIPResult> {
    const { data } = await api.post('/calculators/sip', params);
    return data?.data;
}

export async function calculateEMI(params: {
    loanAmount: number;
    interestRate: number;
    tenureYears: number;
}): Promise<EMIResult> {
    const { data } = await api.post('/calculators/emi', params);
    return data?.data;
}

export async function calculateRetirement(params: {
    currentAge: number;
    retirementAge: number;
    monthlyExpenses: number;
    inflationRate: number;
    existingSavings: number;
    expectedReturn: number;
    postRetirementReturn?: number;
}): Promise<RetirementResult> {
    const { data } = await api.post('/calculators/retirement', params);
    return data?.data;
}

export async function calculateLifeInsurance(params: {
    income: number;
    age: number;
    retirementAge: number;
    liabilities: number;
    assets: number;
    dependents: number;
}): Promise<LifeInsuranceResult> {
    const { data } = await api.post('/calculators/life-insurance', params);
    return data?.data;
}

export async function calculateEducation(params: {
    childAge: number;
    goalYear: number;
    currentCost: number;
    inflation: number;
    currentSavings: number;
    returnRate: number;
}): Promise<EducationResult> {
    const { data } = await api.post('/calculators/education', params);
    return data?.data;
}

export async function calculateCostOfDelay(params: {
    sipAmount: number;
    returnRate: number;
    delayYears: number;
    totalYears: number;
}): Promise<CostOfDelayResult> {
    const { data } = await api.post('/calculators/cost-of-delay', params);
    return data?.data;
}

export async function calculateHRA(params: {
    basic: number;
    da: number;
    rentPaid: number;
    isMetro: boolean;
}): Promise<HRAResult> {
    const { data } = await api.post('/calculators/hra', params);
    return data?.data;
}

export async function calculateHomeAffordability(params: {
    monthlyIncome: number;
    existingEMI: number;
    interestRate: number;
    tenureYears: number;
}): Promise<HomeAffordabilityResult> {
    const { data } = await api.post('/calculators/home-affordability', params);
    return data?.data;
}

export async function calculateCAGR(params: {
    startValue: number;
    endValue: number;
    years: number;
}): Promise<CAGRResult> {
    const { data } = await api.post('/calculators/cagr', params);
    return data?.data;
}
