const input = {
    age: 30, // Default since dob isn't explicitly used in the score yet
    gross_income: 1200000,
    monthly_emi: 0,
    fixed_expenses: 40000,
    existing_assets: 1500000,
    total_liabilities: 0,
    insurance_premium: 0,
    insurance_coverage: 10000000,
    emergency_fund_amount: 500000
};

// 1. Income Normalization (Annual -> Monthly)
const annual_income = input.gross_income;
const monthly_gross_income = annual_income > 0 ? annual_income / 12 : 1; // 100k

const monthly_expenses = input.fixed_expenses; // 40k
const monthly_liabilities = input.monthly_emi; // 0
const monthly_insurance = input.insurance_premium / 12; // 0

// 2. Metrics Calculation
const monthly_surplus = monthly_gross_income - (monthly_expenses + monthly_liabilities + monthly_insurance); // 60k
const monthly_investments = monthly_surplus > 0 ? monthly_surplus : 0; // 60k

// Ratios
const ratios = {
    expenses: monthly_expenses / monthly_gross_income, // 40%
    liabilities: monthly_liabilities / monthly_gross_income, // 0%
    investments: monthly_investments / monthly_gross_income, // 60%
    emergency_fund: input.emergency_fund_amount / (monthly_gross_income * 12) // 5L / 12L = 41.6%
};

console.log("Ratios (in %):");
console.log("- Expenses:", (ratios.expenses * 100).toFixed(0) + "%");
console.log("- Liabilities:", (ratios.liabilities * 100).toFixed(0) + "%");
console.log("- Investments:", (ratios.investments * 100).toFixed(0) + "%");
console.log("- Emergency Fund:", (ratios.emergency_fund * 100).toFixed(0) + "%");

// Persona Logic
let persona = "Unknown";
if (input.age > 50) {
    persona = "Wealth Preserver";
} else if (input.age <= 35 && annual_income <= 1800000) {
    persona = "Early Career Builder";
} else {
    persona = "Growth Strategist";
}

console.log("\nPersona:", persona);
