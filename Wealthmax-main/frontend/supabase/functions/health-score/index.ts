import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Weight configuration (total = 1000 points) ───────

const WEIGHTS = {
  savings: 200,        // 20% — Savings Rate
  debt: 200,           // 20% — Debt Ratio
  liquidity: 150,      // 15% — Emergency Fund
  diversification: 150,// 15% — Asset Class Spread
  insurance: 150,      // 15% — Insurance Coverage
  goalProgress: 150,   // 15% — Goal Completion
};

// ── Types ─────────────────────────────────────────────

interface UserFinancials {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyInvestments: number;
  monthlyEMI: number;
  emergencyFund: number;
  assetClasses: string[];   // e.g. ["equity", "debt", "gold", "real_estate"]
  hasTermInsurance: boolean;
  hasHealthInsurance: boolean;
  totalGoals: number;
  goalsOnTrack: number;
}

interface ScoreBreakdown {
  savings: number;
  debt: number;
  liquidity: number;
  diversification: number;
  insurance: number;
  goalProgress: number;
}

interface ScoreResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  improvementTips: string[];
  peerRank: number;
  grade: string;
}

// ── ScoreEngine ───────────────────────────────────────

class ScoreEngine {
  private financials: UserFinancials;
  private breakdown: ScoreBreakdown;
  private tips: string[];

  constructor(financials: UserFinancials) {
    this.financials = financials;
    this.breakdown = { savings: 0, debt: 0, liquidity: 0, diversification: 0, insurance: 0, goalProgress: 0 };
    this.tips = [];
  }

  compute(): { totalScore: number; breakdown: ScoreBreakdown; tips: string[] } {
    this.scoreSavings();
    this.scoreDebt();
    this.scoreLiquidity();
    this.scoreDiversification();
    this.scoreInsurance();
    this.scoreGoalProgress();

    const totalScore = Math.round(
      this.breakdown.savings +
      this.breakdown.debt +
      this.breakdown.liquidity +
      this.breakdown.diversification +
      this.breakdown.insurance +
      this.breakdown.goalProgress
    );

    return {
      totalScore: Math.max(0, Math.min(1000, totalScore)),
      breakdown: this.breakdown,
      tips: this.tips,
    };
  }

  // ── Savings Rate (200 pts) ────────────────────────
  // Full points if (Investments / Income) >= 30%
  // Linear scale from 0% to 30%
  private scoreSavings() {
    const { monthlyIncome, monthlyInvestments } = this.financials;
    if (monthlyIncome <= 0) {
      this.breakdown.savings = 0;
      this.tips.push("Add your income details to unlock savings score");
      return;
    }

    const savingsRate = monthlyInvestments / monthlyIncome;
    const targetRate = 0.30;

    if (savingsRate >= targetRate) {
      this.breakdown.savings = WEIGHTS.savings;
    } else {
      this.breakdown.savings = Math.round((savingsRate / targetRate) * WEIGHTS.savings);
      const deficit = (targetRate - savingsRate) * monthlyIncome;
      const potentialGain = WEIGHTS.savings - this.breakdown.savings;
      this.tips.push(
        `Increase monthly investments by ₹${formatINR(deficit)} to gain ${potentialGain} points`
      );
    }
  }

  // ── Debt Ratio (200 pts) ──────────────────────────
  // Zero points if (EMI / Income) > 40%
  // Full points if EMI = 0
  // Linear scale between 0% and 40%
  private scoreDebt() {
    const { monthlyIncome, monthlyEMI } = this.financials;
    if (monthlyIncome <= 0) {
      this.breakdown.debt = 0;
      return;
    }

    const debtRatio = monthlyEMI / monthlyIncome;
    const maxRatio = 0.40;

    if (debtRatio >= maxRatio) {
      this.breakdown.debt = 0;
      const excess = monthlyEMI - monthlyIncome * maxRatio;
      this.tips.push(
        `Reduce EMI by ₹${formatINR(excess)} to start earning debt score points`
      );
    } else if (debtRatio <= 0) {
      this.breakdown.debt = WEIGHTS.debt;
    } else {
      this.breakdown.debt = Math.round((1 - debtRatio / maxRatio) * WEIGHTS.debt);
      if (debtRatio > 0.20) {
        const reduceBy = (debtRatio - 0.20) * monthlyIncome;
        const currentPoints = this.breakdown.debt;
        const targetPoints = Math.round((1 - 0.20 / maxRatio) * WEIGHTS.debt);
        this.tips.push(
          `Reduce EMI by ₹${formatINR(reduceBy)} to gain ${targetPoints - currentPoints} points`
        );
      }
    }
  }

  // ── Liquidity / Emergency Fund (150 pts) ──────────
  // Full points if EmergencyFund >= 6 * MonthlyExpenses
  // Linear scale from 0 to 6 months
  private scoreLiquidity() {
    const { emergencyFund, monthlyExpenses } = this.financials;
    if (monthlyExpenses <= 0) {
      this.breakdown.liquidity = WEIGHTS.liquidity; // No expenses = fully liquid
      return;
    }

    const monthsCovered = emergencyFund / monthlyExpenses;
    const targetMonths = 6;

    if (monthsCovered >= targetMonths) {
      this.breakdown.liquidity = WEIGHTS.liquidity;
    } else {
      this.breakdown.liquidity = Math.round((monthsCovered / targetMonths) * WEIGHTS.liquidity);
      const deficit = (targetMonths - monthsCovered) * monthlyExpenses;
      const potentialGain = WEIGHTS.liquidity - this.breakdown.liquidity;
      this.tips.push(
        `Add ₹${formatINR(deficit)} to your emergency fund to gain ${potentialGain} points`
      );
    }
  }

  // ── Diversification (150 pts) ─────────────────────
  // Check for presence of asset classes
  // 1 class = 30pts, 2 = 70pts, 3 = 120pts, 4+ = 150pts
  private scoreDiversification() {
    const { assetClasses } = this.financials;
    const uniqueClasses = [...new Set(assetClasses.map((c) => c.toLowerCase()))];
    const count = uniqueClasses.length;

    const tiers = [0, 30, 70, 120, 150];
    this.breakdown.diversification = tiers[Math.min(count, 4)];

    if (count < 3) {
      const missing: string[] = [];
      const standard = ["equity", "debt", "gold"];
      for (const cls of standard) {
        if (!uniqueClasses.includes(cls)) missing.push(cls);
      }
      const gain = tiers[Math.min(count + 1, 4)] - tiers[count];
      this.tips.push(
        `Add ${missing[0]} to your portfolio to gain ${gain} diversification points`
      );
    }
  }

  // ── Insurance Coverage (150 pts) ──────────────────
  // Term insurance = 90 pts, Health insurance = 60 pts
  private scoreInsurance() {
    const { hasTermInsurance, hasHealthInsurance } = this.financials;
    let score = 0;

    if (hasTermInsurance) {
      score += 90;
    } else {
      this.tips.push("Get term life insurance to gain 90 points — protects your family's finances");
    }

    if (hasHealthInsurance) {
      score += 60;
    } else {
      this.tips.push("Get health insurance to gain 60 points — shields against medical expenses");
    }

    this.breakdown.insurance = score;
  }

  // ── Goal Progress (150 pts) ───────────────────────
  // Proportional to goals on track
  private scoreGoalProgress() {
    const { totalGoals, goalsOnTrack } = this.financials;

    if (totalGoals <= 0) {
      this.breakdown.goalProgress = 0;
      this.tips.push("Set at least one financial goal to unlock up to 150 points");
      return;
    }

    const ratio = Math.min(goalsOnTrack / totalGoals, 1);
    this.breakdown.goalProgress = Math.round(ratio * WEIGHTS.goalProgress);

    if (ratio < 1) {
      const offTrack = totalGoals - goalsOnTrack;
      const gain = WEIGHTS.goalProgress - this.breakdown.goalProgress;
      this.tips.push(
        `Get ${offTrack} off-track goal${offTrack > 1 ? "s" : ""} back on track to gain ${gain} points`
      );
    }
  }
}

// ── Helpers ───────────────────────────────────────────

function formatINR(amount: number): string {
  return Math.round(amount).toLocaleString("en-IN");
}

function getGrade(score: number): string {
  if (score >= 900) return "A+";
  if (score >= 800) return "A";
  if (score >= 700) return "B+";
  if (score >= 600) return "B";
  if (score >= 500) return "C+";
  if (score >= 400) return "C";
  if (score >= 300) return "D";
  return "F";
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function getSupabaseUser(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

// ── Peer Rank Calculation ─────────────────────────────

async function calculatePeerRank(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  totalScore: number
): Promise<number> {
  // Count users with lower scores
  const { count: lowerCount } = await supabase
    .from("health_scores")
    .select("id", { count: "exact", head: true })
    .lt("total_score", totalScore);

  // Count total users
  const { count: totalCount } = await supabase
    .from("health_scores")
    .select("id", { count: "exact", head: true });

  if (!totalCount || totalCount <= 1) return 50; // Default if no peers

  const percentile = ((lowerCount ?? 0) / totalCount) * 100;
  return Math.round(Math.max(1, Math.min(99, percentile)));
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

    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUser = getSupabaseUser(authHeader);
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: UserFinancials = await req.json();

    // Validate inputs
    const errors: string[] = [];
    if (typeof body.monthlyIncome !== "number" || body.monthlyIncome < 0) errors.push("monthlyIncome must be >= 0");
    if (typeof body.monthlyExpenses !== "number" || body.monthlyExpenses < 0) errors.push("monthlyExpenses must be >= 0");
    if (typeof body.monthlyInvestments !== "number" || body.monthlyInvestments < 0) errors.push("monthlyInvestments must be >= 0");
    if (typeof body.monthlyEMI !== "number" || body.monthlyEMI < 0) errors.push("monthlyEMI must be >= 0");
    if (typeof body.emergencyFund !== "number" || body.emergencyFund < 0) errors.push("emergencyFund must be >= 0");
    if (!Array.isArray(body.assetClasses)) errors.push("assetClasses must be an array");
    if (typeof body.hasTermInsurance !== "boolean") errors.push("hasTermInsurance must be boolean");
    if (typeof body.hasHealthInsurance !== "boolean") errors.push("hasHealthInsurance must be boolean");
    if (typeof body.totalGoals !== "number" || body.totalGoals < 0) errors.push("totalGoals must be >= 0");
    if (typeof body.goalsOnTrack !== "number" || body.goalsOnTrack < 0) errors.push("goalsOnTrack must be >= 0");

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute score
    const engine = new ScoreEngine(body);
    const { totalScore, breakdown, tips } = engine.compute();

    const supabaseAdmin = getSupabaseAdmin();

    // Persist score
    await supabaseAdmin.from("health_scores").insert({
      user_id: user.id,
      total_score: totalScore,
      savings_score: breakdown.savings,
      debt_score: breakdown.debt,
      liquidity_score: breakdown.liquidity,
      diversification_score: breakdown.diversification,
      insurance_score: breakdown.insurance,
      goal_score: breakdown.goalProgress,
      improvement_tips: tips,
    });

    // Calculate peer rank against all stored scores
    const peerRank = await calculatePeerRank(supabaseAdmin, totalScore);

    // Update peer rank on the record
    const { data: latestRecord } = await supabaseAdmin
      .from("health_scores")
      .select("id")
      .eq("user_id", user.id)
      .order("computed_at", { ascending: false })
      .limit(1)
      .single();

    if (latestRecord) {
      await supabaseAdmin
        .from("health_scores")
        .update({ peer_rank: peerRank })
        .eq("id", latestRecord.id);
    }

    const grade = getGrade(totalScore);

    const result: ScoreResult = {
      totalScore,
      breakdown,
      improvementTips: tips,
      peerRank,
      grade,
    };

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
