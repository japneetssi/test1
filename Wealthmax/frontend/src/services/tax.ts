import { api } from "@/lib/api";

export interface TaxInput {
    annual_income: number;
    is_salaried: boolean;
    investments_80c?: number;
    health_insurance_80d?: number;
    nps_80ccd_1b?: number;
    hra_exemption?: number;
    home_loan_interest_u_s24b?: number;
    other_deductions?: number;
}

export interface TaxBreakdown {
    regime: "OLD" | "NEW";
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
    recommendedRegime: "OLD" | "NEW";
    savings: number;
    gap80C?: number;
    gap80D?: number;
    gapNPS?: number;
}

export const optimizeTax = async (input: TaxInput): Promise<TaxOptimizationResult> => {
    const response = await api.post("/tax/optimize", input);
    return response.data.data;
};
