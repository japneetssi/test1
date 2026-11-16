export type TaxRegime = 'OLD' | 'NEW';

export interface TaxInput {
    annual_income: number;
    is_salaried: boolean;
    investments_80c?: number;    // Chapter VI-A: max ₹1,50,000
    health_insurance_80d?: number; // Section 80D: Self + Family
    nps_80ccd_1b?: number;       // Section 80CCD(1B): Additional ₹50,000
    hra_exemption?: number;      // Section 10(13A)
    home_loan_interest_u_s24b?: number; // Section 24(b): max ₹2,00,000
    other_deductions?: number;   // Section 80TTA, 80G, etc.
}

export interface TaxBreakdown {
    regime: TaxRegime;
    gross_income: number;
    standard_deduction: number;
    other_deductions: number;
    taxable_income: number;
    base_tax: number;
    rebate_87a: number;
    cess: number;
    total_tax: number;
    monthly_tax: number;
    take_home_monthly: number;
    effective_rate: number;
}

export interface TaxOptimizationResult {
    oldRegime: TaxBreakdown;
    newRegime: TaxBreakdown;
    recommendedRegime: TaxRegime;
    savings: number;
    gap80C?: number;
    gap80D?: number;
    gapNPS?: number;
}
