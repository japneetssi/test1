const incomeAnnual = 1200000;
const incomeMonthly = 1200000 / 12; // 100,000
const expenses = 40000;
const emi = 0;
const existingAssets = 1500000;
const emergencyFund = 500000;
const dependents = 1;
const insuranceCover = 10000000; // 1 Cr
const totalLiabilities = 0;
const riskScore = 50; // assumed average

// A. Savings Rate (20%)
const surplus = incomeMonthly - (expenses + emi); // 100k - 40k = 60k
const savingsRatio = surplus / incomeMonthly; // 0.6
let scoreSavings = (savingsRatio / 0.20) * 20; // (0.6 / 0.2) * 20 = 60
if (scoreSavings > 20) scoreSavings = 20; // Caps at 20

// B. Debt Ratio (20%)
const debtRatio = emi / incomeMonthly; // 0
let scoreDebt = 20;

// C. Liquidity (15%)
const monthsCovered = emergencyFund / expenses; // 500k / 40k = 12.5 months
let scoreLiquidity = (monthsCovered / 6) * 15; // (12.5 / 6) * 15 = 31.25
if (scoreLiquidity > 15) scoreLiquidity = 15; // Caps at 15

// D. Asset Diversity (15%)
const totalAssetVal = existingAssets; // 15L
let scoreDiversity = totalAssetVal > (incomeAnnual * 2) ? 15 : 10; // 15L > 24L is false -> 10
if (totalAssetVal === 0) scoreDiversity = 5;

// E. Protection (15%)
const requiredCover = dependents > 0 ? (incomeAnnual * 10) + totalLiabilities : (incomeAnnual * 5); // 1.2Cr
const protectionRatio = currentCover = insuranceCover / requiredCover; // 1Cr / 1.2Cr = 0.833
let scoreProtection = protectionRatio * 15; // 12.5
if (scoreProtection > 15) scoreProtection = 15;

// F. Goal Preparedness (10%)
// Assume 0 goals for this test, which defaults to 5 points
let scoreGoal = 5;

// G. Financial Literacy (5%)
let scoreLiteracy = (riskScore / 100) * 5; // 2.5

console.log("Savings:", scoreSavings);
console.log("Debt:", scoreDebt);
console.log("Liquidity:", scoreLiquidity);
console.log("Diversity:", scoreDiversity);
console.log("Protection:", scoreProtection);
console.log("Goal:", scoreGoal);
console.log("Literacy:", scoreLiteracy);
const total = scoreSavings + scoreDebt + scoreLiquidity + scoreDiversity + scoreProtection + scoreGoal + scoreLiteracy;
console.log("Total:", Math.round(total));
