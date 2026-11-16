import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ─────────────────────────────────────────────

interface PersonaInput {
  age: number;
  grossIncome: number;        // annual in INR
  monthlyExpenses: number;    // monthly in INR
  liabilities: number;        // monthly EMI in INR
  riskScore: number;          // 0-100 from risk profiler
  netWorth?: number;          // optional, in INR
}

type PersonaType = "A_Accumulator" | "B_ActiveTrader" | "C_HNI_Preservation";
type RiskCategory = "Conservative" | "Moderate" | "Aggressive";

interface HealthGap {
  ideal: { expenses: number; liabilities: number; investment: number; emergency: number };
  actual: { expenses: number; liabilities: number; investment: number; emergency: number };
  deviation: { expenses: number; liabilities: number; investment: number; emergency: number };
  overallHealthScore: number; // 0-100
}

interface PersonaResult {
  persona: PersonaType;
  personaLabel: string;
  focus: string;
  riskCategory: RiskCategory;
  recommendedProducts: string[];
  healthGap: HealthGap;
  flags: string[];
}

// ── 30-30-30-10 Validation ────────────────────────────

function validateFinancialHealth(
  monthlyIncome: number,
  monthlyExpenses: number,
  monthlyLiabilities: number
): HealthGap {
  const idealRatios = { expenses: 0.30, liabilities: 0.30, investment: 0.30, emergency: 0.10 };

  const actualExpRatio = monthlyExpenses / monthlyIncome;
  const actualLiabRatio = monthlyLiabilities / monthlyIncome;
  const remaining = Math.max(0, 1 - actualExpRatio - actualLiabRatio);
  // Split remaining into investment and emergency proportionally (3:1)
  const actualInvRatio = remaining * 0.75;
  const actualEmgRatio = remaining * 0.25;

  const deviation = {
    expenses: +(actualExpRatio - idealRatios.expenses).toFixed(4),
    liabilities: +(actualLiabRatio - idealRatios.liabilities).toFixed(4),
    investment: +(actualInvRatio - idealRatios.investment).toFixed(4),
    emergency: +(actualEmgRatio - idealRatios.emergency).toFixed(4),
  };

  // Health score: 100 minus penalty for deviations
  const totalDeviation =
    Math.abs(deviation.expenses) +
    Math.abs(deviation.liabilities) +
    Math.abs(deviation.investment) +
    Math.abs(deviation.emergency);
  const overallHealthScore = Math.max(0, Math.round(100 - totalDeviation * 100));

  return {
    ideal: {
      expenses: idealRatios.expenses,
      liabilities: idealRatios.liabilities,
      investment: idealRatios.investment,
      emergency: idealRatios.emergency,
    },
    actual: {
      expenses: +actualExpRatio.toFixed(4),
      liabilities: +actualLiabRatio.toFixed(4),
      investment: +actualInvRatio.toFixed(4),
      emergency: +actualEmgRatio.toFixed(4),
    },
    deviation,
    overallHealthScore,
  };
}

// ── Risk Category from score ──────────────────────────

function getRiskCategory(score: number): RiskCategory {
  if (score <= 33) return "Conservative";
  if (score <= 66) return "Moderate";
  return "Aggressive";
}

// ── Product recommendations per persona + risk ────────

const PRODUCT_MAP: Record<PersonaType, Record<RiskCategory, string[]>> = {
  A_Accumulator: {
    Conservative: ["Debt Mutual Funds (SIP)", "PPF", "NPS Tier-I", "Fixed Deposits", "Term Insurance"],
    Moderate: ["Balanced Advantage Funds (SIP)", "ELSS", "NPS", "Gold ETF", "Term Insurance"],
    Aggressive: ["Equity SIPs (Mid/Small Cap)", "ELSS", "NPS Tier-II", "Direct Equity (Blue Chip)", "Term Insurance"],
  },
  B_ActiveTrader: {
    Conservative: ["Blue-Chip Equity", "Index Funds", "Covered Calls", "Corporate Bonds"],
    Moderate: ["F&O Hedging Strategies", "Sector ETFs", "Swing Trading", "REITs", "Option Wealth Module"],
    Aggressive: ["Option Wealth (Naked Puts/Calls)", "Margin Trading", "Futures", "Sector Rotation", "Algo Trading"],
  },
  C_HNI_Preservation: {
    Conservative: ["PMS (Debt-focused)", "Tax-Free Bonds", "Senior Citizen Savings", "RBI Floating Rate Bonds", "Estate Planning"],
    Moderate: ["PMS (Balanced)", "AIFs (Cat II)", "Structured Products", "International Diversification", "Estate Planning"],
    Aggressive: ["PMS (Equity)", "AIFs (Cat III)", "Pre-IPO Funds", "Real Estate Funds", "Estate Planning"],
  },
};

// ── Persona classification ────────────────────────────

function classifyPersona(input: PersonaInput): PersonaResult {
  const annualIncomeInLPA = input.grossIncome / 100000;
  const netWorth = input.netWorth ?? 0;
  const netWorthInCr = netWorth / 10000000;
  const monthlyIncome = input.grossIncome / 12;
  const flags: string[] = [];

  // Risk category
  const riskCategory = getRiskCategory(input.riskScore);

  // Edge case: high risk score but low income
  if (input.riskScore > 65 && annualIncomeInLPA < 10) {
    flags.push("Risk Mismatch: High risk appetite with low income — recommend conservative approach");
  }

  // Edge case: very high liabilities
  if (input.liabilities / monthlyIncome > 0.50) {
    flags.push("Debt Warning: EMI exceeds 50% of monthly income — prioritize debt reduction");
  }

  // Edge case: young with very high net worth
  if (input.age < 30 && netWorthInCr > 5) {
    flags.push("Exceptional Profile: Young HNI — consider blended Accumulator + Preservation strategy");
  }

  // Health gap
  const healthGap = validateFinancialHealth(monthlyIncome, input.monthlyExpenses, input.liabilities);

  // Classification rules (order matters — most specific first)
  let persona: PersonaType;
  let personaLabel: string;
  let focus: string;

  if (input.age > 50 || netWorthInCr > 5) {
    persona = "C_HNI_Preservation";
    personaLabel = "Persona C (HNI / Preservation)";
    focus = "Debt Instruments, PMS, Estate Planning";
  } else if (annualIncomeInLPA > 20 && input.riskScore > 65) {
    persona = "B_ActiveTrader";
    personaLabel = "Persona B (Active Trader)";
    focus = "Margin Trading, Option Wealth, F&O";
  } else if (input.age < 35 && annualIncomeInLPA < 18) {
    persona = "A_Accumulator";
    personaLabel = "Persona A (Accumulator)";
    focus = "Systematic Investment Plans (SIPs)";
  } else {
    // Default: assign based on income and risk
    if (annualIncomeInLPA >= 18) {
      persona = "B_ActiveTrader";
      personaLabel = "Persona B (Active Trader)";
      focus = "Diversified Equity & F&O";
    } else {
      persona = "A_Accumulator";
      personaLabel = "Persona A (Accumulator)";
      focus = "Systematic Investment Plans (SIPs)";
    }
  }

  // Override for risk mismatch: downgrade active trader if flagged
  const hasRiskMismatch = flags.some((f) => f.startsWith("Risk Mismatch"));
  if (hasRiskMismatch && persona === "B_ActiveTrader") {
    persona = "A_Accumulator";
    personaLabel = "Persona A (Accumulator) — Downgraded due to Risk Mismatch";
    focus = "Conservative SIPs & Debt Instruments";
  }

  const effectiveRisk = hasRiskMismatch ? "Conservative" as RiskCategory : riskCategory;
  const recommendedProducts = PRODUCT_MAP[persona][effectiveRisk];

  return {
    persona,
    personaLabel,
    focus,
    riskCategory: effectiveRisk,
    recommendedProducts,
    healthGap,
    flags,
  };
}

// ── HTTP handler ──────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { age, grossIncome, monthlyExpenses, liabilities, riskScore, netWorth } = body;

    // Validation
    const errors: string[] = [];
    if (typeof age !== "number" || age < 18 || age > 120) errors.push("age must be 18-120");
    if (typeof grossIncome !== "number" || grossIncome <= 0) errors.push("grossIncome must be positive");
    if (typeof monthlyExpenses !== "number" || monthlyExpenses < 0) errors.push("monthlyExpenses must be >= 0");
    if (typeof liabilities !== "number" || liabilities < 0) errors.push("liabilities (monthly EMI) must be >= 0");
    if (typeof riskScore !== "number" || riskScore < 0 || riskScore > 100) errors.push("riskScore must be 0-100");
    if (netWorth !== undefined && (typeof netWorth !== "number" || netWorth < 0)) errors.push("netWorth must be >= 0");

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = classifyPersona({
      age,
      grossIncome,
      monthlyExpenses,
      liabilities,
      riskScore,
      netWorth: netWorth ?? 0,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
