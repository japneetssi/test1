import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Question metadata ─────────────────────────────────
// Each question has an id (1-25), a category tag, and a weight.
// Categories are used for contradiction detection.

interface QuestionMeta {
  id: number;
  category: "risk_appetite" | "loss_tolerance" | "horizon" | "liquidity" | "experience" | "goal";
  weight: number;
}

const QUESTIONS: QuestionMeta[] = [
  // Risk appetite questions
  { id: 1, category: "risk_appetite", weight: 1.2 },
  { id: 2, category: "risk_appetite", weight: 1.2 },
  { id: 3, category: "risk_appetite", weight: 1.0 },
  { id: 4, category: "risk_appetite", weight: 1.0 },
  // Loss tolerance questions
  { id: 5, category: "loss_tolerance", weight: 1.3 },
  { id: 6, category: "loss_tolerance", weight: 1.3 },
  { id: 7, category: "loss_tolerance", weight: 1.1 },
  { id: 8, category: "loss_tolerance", weight: 1.1 },
  // Investment horizon
  { id: 9, category: "horizon", weight: 1.0 },
  { id: 10, category: "horizon", weight: 1.0 },
  { id: 11, category: "horizon", weight: 0.9 },
  // Liquidity needs
  { id: 12, category: "liquidity", weight: 1.0 },
  { id: 13, category: "liquidity", weight: 1.0 },
  { id: 14, category: "liquidity", weight: 0.9 },
  // Experience
  { id: 15, category: "experience", weight: 0.8 },
  { id: 16, category: "experience", weight: 0.8 },
  { id: 17, category: "experience", weight: 0.7 },
  { id: 18, category: "experience", weight: 0.7 },
  // Goals
  { id: 19, category: "goal", weight: 1.0 },
  { id: 20, category: "goal", weight: 1.0 },
  { id: 21, category: "goal", weight: 0.9 },
  { id: 22, category: "goal", weight: 0.9 },
  { id: 23, category: "goal", weight: 0.8 },
  { id: 24, category: "goal", weight: 0.8 },
  { id: 25, category: "goal", weight: 0.7 },
];

// ── Contradiction rules ───────────────────────────────
// Each rule compares the average score of two categories.
// If the difference exceeds the threshold, it's a contradiction.

interface ContradictionRule {
  highCategory: string;
  lowCategory: string;
  highThreshold: number; // avg score must be >= this to count as "high"
  lowThreshold: number;  // avg score must be <= this to count as "low"
  description: string;
}

const CONTRADICTION_RULES: ContradictionRule[] = [
  {
    highCategory: "risk_appetite",
    lowCategory: "loss_tolerance",
    highThreshold: 4.0,
    lowThreshold: 2.0,
    description: "High risk appetite but low loss tolerance",
  },
  {
    highCategory: "risk_appetite",
    lowCategory: "horizon",
    highThreshold: 4.0,
    lowThreshold: 2.0,
    description: "High risk appetite but short investment horizon",
  },
  {
    highCategory: "risk_appetite",
    lowCategory: "experience",
    highThreshold: 4.0,
    lowThreshold: 2.0,
    description: "High risk appetite but low investment experience",
  },
  {
    highCategory: "risk_appetite",
    lowCategory: "liquidity",
    highThreshold: 4.0,
    lowThreshold: 2.0,
    description: "High risk appetite but high liquidity needs",
  },
  {
    highCategory: "goal",
    lowCategory: "loss_tolerance",
    highThreshold: 4.0,
    lowThreshold: 2.0,
    description: "Aggressive goals but low loss tolerance",
  },
];

// ── Scoring engine ────────────────────────────────────

function computeProfile(responses: Record<string, number>) {
  // 1. Calculate weighted raw score
  let weightedScore = 0;
  let maxPossibleScore = 0;

  for (const q of QUESTIONS) {
    const answer = responses[String(q.id)];
    if (answer === undefined || answer < 1 || answer > 5) {
      throw new Error(`Invalid or missing answer for question ${q.id}. Expected integer 1-5.`);
    }
    weightedScore += answer * q.weight;
    maxPossibleScore += 5 * q.weight;
  }

  // 2. Normalize to 0-100
  const normalizedScore = Math.round((weightedScore / maxPossibleScore) * 100);

  // 3. Compute category averages for contradiction detection
  const categoryScores: Record<string, { total: number; count: number }> = {};
  for (const q of QUESTIONS) {
    if (!categoryScores[q.category]) {
      categoryScores[q.category] = { total: 0, count: 0 };
    }
    categoryScores[q.category].total += responses[String(q.id)];
    categoryScores[q.category].count += 1;
  }

  const categoryAverages: Record<string, number> = {};
  for (const [cat, data] of Object.entries(categoryScores)) {
    categoryAverages[cat] = data.total / data.count;
  }

  // 4. Detect contradictions
  const contradictions: string[] = [];
  for (const rule of CONTRADICTION_RULES) {
    const highAvg = categoryAverages[rule.highCategory] ?? 0;
    const lowAvg = categoryAverages[rule.lowCategory] ?? 0;
    // Note: for liquidity, low score = high liquidity need (inverted)
    const effectiveLow = rule.lowCategory === "liquidity" ? lowAvg : lowAvg;
    
    if (highAvg >= rule.highThreshold && effectiveLow <= rule.lowThreshold) {
      contradictions.push(rule.description);
    }
  }

  const contradictionFlag = contradictions.length > 0;

  // 5. Determine initial risk class
  let riskClass: "Conservative" | "Moderate" | "Aggressive";
  if (normalizedScore <= 33) {
    riskClass = "Conservative";
  } else if (normalizedScore <= 66) {
    riskClass = "Moderate";
  } else {
    riskClass = "Aggressive";
  }

  // 6. Guardrail: downgrade on contradiction
  let finalScore = normalizedScore;
  if (contradictionFlag) {
    if (riskClass === "Aggressive") {
      riskClass = "Moderate";
      finalScore = Math.min(normalizedScore, 66);
    } else if (riskClass === "Moderate") {
      riskClass = "Conservative";
      finalScore = Math.min(normalizedScore, 33);
    }
    // Conservative stays Conservative
  }

  return {
    normalizedScore: finalScore,
    rawNormalizedScore: normalizedScore,
    riskClass,
    contradictionFlag,
    contradictions,
    categoryAverages,
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
    const { responses } = body;

    if (!responses || typeof responses !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing 'responses' object in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate all 25 answers exist and are integers 1-5
    for (let i = 1; i <= 25; i++) {
      const val = responses[String(i)];
      if (val === undefined || !Number.isInteger(val) || val < 1 || val > 5) {
        return new Response(
          JSON.stringify({ error: `Invalid answer for question ${i}. Must be integer 1-5.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const result = computeProfile(responses);

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
