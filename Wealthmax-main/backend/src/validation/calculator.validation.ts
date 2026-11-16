import { z } from 'zod';

// Calculator validation schemas
export const sipSchema = z.object({
    monthlyInvestment: z.number().positive('Monthly investment must be positive'),
    rate: z.number().min(0).max(50, 'Rate must be between 0 and 50'),
    years: z.number().positive('Years must be positive')
});

export const emiSchema = z.object({
    loanAmount: z.number().positive('Loan amount must be positive'),
    interestRate: z.number().min(0).max(50, 'Interest rate must be between 0 and 50'),
    tenureYears: z.number().positive('Tenure must be positive')
});

export const retirementSchema = z.object({
    currentAge: z.number().min(18).max(80, 'Current age must be between 18 and 80'),
    retirementAge: z.number().min(50).max(80, 'Retirement age must be between 50 and 80'),
    existingSavings: z.number().min(0, 'Existing savings cannot be negative'),
    monthlyExpenses: z.number().positive('Monthly expenses must be positive'),
    expectedReturn: z.number().min(0).max(30, 'Expected return must be between 0 and 30'),
    inflationRate: z.number().min(0).max(20, 'Inflation rate must be between 0 and 20').default(6),
    postRetirementReturn: z.number().min(0).max(30, 'Post-retirement return must be between 0 and 30').optional()
});

export const lifeInsuranceSchema = z.object({
    income: z.number().positive('Income must be positive'),
    age: z.number().min(18).max(80, 'Age must be between 18 and 80'),
    retirementAge: z.number().min(50).max(80, 'Retirement age must be between 50 and 80'),
    liabilities: z.number().min(0, 'Liabilities cannot be negative'),
    assets: z.number().min(0, 'Assets cannot be negative'),
    dependents: z.number().min(0).max(10, 'Dependents must be between 0 and 10')
});

export const educationSchema = z.object({
    childAge: z.number().min(0).max(25, 'Child age must be between 0 and 25'),
    goalYear: z.number().min(new Date().getFullYear(), 'Goal year must be in the future'),
    currentCost: z.number().positive('Current cost must be positive'),
    inflation: z.number().min(0).max(20, 'Inflation rate must be between 0 and 20').default(6),
    currentSavings: z.number().min(0, 'Current savings cannot be negative'),
    returnRate: z.number().min(0).max(30, 'Return rate must be between 0 and 30').default(12)
});

export const costOfDelaySchema = z.object({
    sipAmount: z.number().positive('SIP amount must be positive'),
    returnRate: z.number().min(0).max(30, 'Return rate must be between 0 and 30').default(12),
    delayYears: z.number().min(1).max(30, 'Delay years must be between 1 and 30'),
    totalYears: z.number().min(1).max(50, 'Total years must be between 1 and 50')
});

export const hraSchema = z.object({
    basic: z.number().positive('Basic salary must be positive'),
    da: z.number().min(0, 'DA cannot be negative'),
    rentPaid: z.number().min(0, 'Rent paid cannot be negative'),
    isMetro: z.boolean()
});

export const homeAffordabilitySchema = z.object({
    monthlyIncome: z.number().positive('Monthly income must be positive'),
    existingEMI: z.number().min(0, 'Existing EMI cannot be negative'),
    interestRate: z.number().min(0).max(20, 'Interest rate must be between 0 and 20'),
    tenureYears: z.number().min(1).max(30, 'Tenure years must be between 1 and 30 years')
});

export const cagrSchema = z.object({
    startValue: z.number().positive('Start value must be positive'),
    endValue: z.number().positive('End value must be positive'),
    years: z.number().positive('Years must be positive')
});