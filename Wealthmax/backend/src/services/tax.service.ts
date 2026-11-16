import { TaxInput, TaxBreakdown, TaxOptimizationResult, TaxRegime } from '../types/tax';

export class TaxService {
    /**
     * Standard Deduction for FY 24-25
     */
    private static readonly STD_DEDUCTION_OLD = 50000;
    private static readonly STD_DEDUCTION_NEW = 75000;

    /**
     * Maximized Deduction Limits
     */
    private static readonly MAX_80C = 150000;
    private static readonly MAX_80CCD_1B = 50000;
    private static readonly MAX_80D_SELF = 25000;
    private static readonly MAX_SEC_24B = 200000;

    /**
     * Primary optimizer combining both regimes and recommending the best.
     */
    static optimize(input: TaxInput): TaxOptimizationResult {
        const oldRegime = this.calculateOldRegime(input);
        const newRegime = this.calculateNewRegime(input);

        const recommendedRegime: TaxRegime = oldRegime.total_tax < newRegime.total_tax ? 'OLD' : 'NEW';
        const savings = Math.abs(oldRegime.total_tax - newRegime.total_tax);

        // Calculate potential gaps to further reduce tax in Old Regime (only if it's the recommended one or close)
        const gap80C = this.MAX_80C - Math.min(this.MAX_80C, input.investments_80c || 0);
        const gap80D = this.MAX_80D_SELF - Math.min(this.MAX_80D_SELF, input.health_insurance_80d || 0);
        const gapNPS = this.MAX_80CCD_1B - Math.min(this.MAX_80CCD_1B, input.nps_80ccd_1b || 0);

        return {
            oldRegime,
            newRegime,
            recommendedRegime,
            savings,
            gap80C,
            gap80D,
            gapNPS
        };
    }

    /**
     * Calculation for Old Regime (FY 2024-25)
     */
    private static calculateOldRegime(input: TaxInput): TaxBreakdown {
        const grossIncome = input.annual_income;
        const stdDeduction = input.is_salaried ? this.STD_DEDUCTION_OLD : 0;
        
        // Sum deductions (clamped to limits)
        const deductionsArr = [
            Math.min(this.MAX_80C, input.investments_80c || 0),
            Math.min(this.MAX_80CCD_1B, input.nps_80ccd_1b || 0),
            Math.min(100000, input.health_insurance_80d || 0), // Basic high cap, more specific in UI
            input.hra_exemption || 0,
            Math.min(this.MAX_SEC_24B, input.home_loan_interest_u_s24b || 0),
            input.other_deductions || 0
        ];
        
        const sumDeductions = deductionsArr.reduce((a, b) => a + b, 0);
        const taxableIncome = Math.max(0, grossIncome - stdDeduction - sumDeductions);

        let baseTax = 0;
        if (taxableIncome <= 250000) {
            baseTax = 0;
        } else if (taxableIncome <= 500000) {
            baseTax = (taxableIncome - 250000) * 0.05;
        } else if (taxableIncome <= 1000000) {
            baseTax = 12500 + (taxableIncome - 500000) * 0.20;
        } else {
            baseTax = 112500 + (taxableIncome - 1000000) * 0.30;
        }

        // Rebate u/s 87A: If income <= 5L, tax is NIL
        const rebate = taxableIncome <= 500000 ? baseTax : 0;
        const taxAfterRebate = Math.max(0, baseTax - rebate);
        
        // Cess 4%
        const cess = taxAfterRebate * 0.04;
        const totalTax = taxAfterRebate + cess;

        return this.formatBreakdown('OLD', grossIncome, stdDeduction, sumDeductions, taxableIncome, baseTax, rebate, cess, totalTax);
    }

    /**
     * Calculation for New Regime (FY 2024-25, Budget 2024 Updates)
     */
    private static calculateNewRegime(input: TaxInput): TaxBreakdown {
        const grossIncome = input.annual_income;
        const stdDeduction = input.is_salaried ? this.STD_DEDUCTION_NEW : 0;
        
        // No deductions allowed in New Regime except Std Deduction and Employer NPS (ignored for simplicity)
        const sumDeductions = 0;
        const taxableIncome = Math.max(0, grossIncome - stdDeduction - sumDeductions);

        let baseTax = 0;
        // Slab changes from Budget 2024 (as applicable for FY 24-25):
        // 0-3: 0%, 3-7: 5%, 7-10: 10%, 10-12: 15%, 12-15: 20%, 15+: 30%
        if (taxableIncome <= 300000) {
            baseTax = 0;
        } else if (taxableIncome <= 700000) {
            baseTax = (taxableIncome - 300000) * 0.05;
        } else if (taxableIncome <= 1000000) {
            baseTax = 20000 + (taxableIncome - 700000) * 0.10;
        } else if (taxableIncome <= 1200000) {
            baseTax = 50000 + (taxableIncome - 1000000) * 0.15;
        } else if (taxableIncome <= 1500000) {
            baseTax = 80000 + (taxableIncome - 1200000) * 0.20;
        } else {
            baseTax = 140000 + (taxableIncome - 1500000) * 0.30;
        }

        // Rebate u/s 87A in NEW: If income <= 7L, tax is NIL
        const rebate = taxableIncome <= 700000 ? baseTax : 0;
        const taxAfterRebate = Math.max(0, baseTax - rebate);
        
        // Cess 4%
        const cess = taxAfterRebate * 0.04;
        const totalTax = taxAfterRebate + cess;

        return this.formatBreakdown('NEW', grossIncome, stdDeduction, sumDeductions, taxableIncome, baseTax, rebate, cess, totalTax);
    }

    private static formatBreakdown(
        regime: TaxRegime,
        gross: number,
        std: number,
        other: number,
        taxable: number,
        base: number,
        rebate: number,
        cess: number,
        total: number
    ): TaxBreakdown {
        return {
            regime,
            gross_income: gross,
            standard_deduction: std,
            other_deductions: other,
            taxable_income: taxable,
            base_tax: base,
            rebate_87a: rebate,
            cess,
            total_tax: Math.round(total),
            monthly_tax: Math.round(total / 12),
            take_home_monthly: Math.round(((gross - total) / 12)),
            effective_rate: gross > 0 ? parseFloat(((total / gross) * 100).toFixed(2)) : 0
        };
    }
}
