import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ─────────────────────────────────────────────

interface GapItem {
  label: string;
  ideal: number;
  actual: number;
}

interface ActionItem {
  priority: number;
  title: string;
  description: string;
  status: "critical" | "high" | "medium" | "low";
}

interface ReportPayload {
  userName: string;
  clientId: string;
  healthScore: number;
  grade: string;
  riskClass: string;
  persona: string;
  gapAnalysis: GapItem[];
  actionItems: ActionItem[];
  scoreBreakdown: {
    savings: number;
    debt: number;
    liquidity: number;
    diversification: number;
    insurance: number;
    goalProgress: number;
  };
}

// ── HTML Template Generator ───────────────────────────

function generateReportHTML(payload: ReportPayload): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const scoreColor =
    payload.healthScore >= 700 ? "#28a745" :
    payload.healthScore >= 400 ? "#e8a317" : "#dc3545";

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: "#fde8e8", text: "#dc3545", border: "#f5c6cb" },
    high: { bg: "#fff3e0", text: "#e8a317", border: "#ffd699" },
    medium: { bg: "#e8f0fe", text: "#00458c", border: "#b3cde0" },
    low: { bg: "#f5f5f5", text: "#666", border: "#ddd" },
  };

  const gapRows = payload.gapAnalysis
    .map((item) => {
      const diff = item.actual - item.ideal;
      const diffStr = diff === 0 ? "On Track" : diff > 0 ? `+${diff}% Over` : `${diff}% Under`;
      const diffColor = diff === 0 ? "#28a745" : diff > 0 ? "#dc3545" : "#e8a317";
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;font-weight:500;color:#333;">${item.label}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;text-align:center;color:#666;">${item.ideal}%</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;text-align:center;font-weight:600;color:#333;">${item.actual}%</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;text-align:center;">
            <span style="color:${diffColor};font-weight:600;font-size:12px;">${diffStr}</span>
          </td>
        </tr>`;
    })
    .join("");

  const actionRows = payload.actionItems
    .map((item) => {
      const s = statusColors[item.status] || statusColors.low;
      return `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;text-align:center;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#e8f0fe;color:#00458c;font-weight:700;font-size:12px;">${item.priority}</span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;">
            <div style="font-weight:600;color:#333;margin-bottom:2px;">${item.title}</div>
            <div style="font-size:11px;color:#888;line-height:1.4;">${item.description}</div>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #e9ecef;text-align:center;">
            <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;background:${s.bg};color:${s.text};border:1px solid ${s.border};">
              ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </td>
        </tr>`;
    })
    .join("");

  // Score breakdown bars
  const breakdownItems = [
    { label: "Savings Rate", score: payload.scoreBreakdown.savings, max: 200 },
    { label: "Debt Ratio", score: payload.scoreBreakdown.debt, max: 200 },
    { label: "Liquidity", score: payload.scoreBreakdown.liquidity, max: 150 },
    { label: "Diversification", score: payload.scoreBreakdown.diversification, max: 150 },
    { label: "Insurance", score: payload.scoreBreakdown.insurance, max: 150 },
    { label: "Goal Progress", score: payload.scoreBreakdown.goalProgress, max: 150 },
  ];

  const breakdownHTML = breakdownItems
    .map((b) => {
      const pct = Math.round((b.score / b.max) * 100);
      const barColor = pct >= 75 ? "#28a745" : pct >= 40 ? "#e8a317" : "#dc3545";
      return `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
            <span style="font-size:12px;color:#555;">${b.label}</span>
            <span style="font-size:12px;font-weight:600;color:#333;">${b.score}/${b.max}</span>
          </div>
          <div style="height:8px;background:#e9ecef;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;"></div>
          </div>
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WealthMax Advisory Report — ${payload.userName}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #333;
      background: #fff;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { width: 100%; }
      .page-break { page-break-before: always; }
    }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>

  <!-- ═══ PAGE 1 ═══ -->
  <div style="padding:28mm 22mm 20mm 22mm;min-height:297mm;position:relative;">

    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #00458c;padding-bottom:16px;margin-bottom:24px;">
      <div>
        <div style="font-size:28px;font-weight:800;color:#00458c;letter-spacing:-0.5px;">WealthMax</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">Advisory & Wealth Management</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;color:#333;font-weight:600;">Financial Advisory Report</div>
        <div style="font-size:11px;color:#888;">${dateStr} • ${timeStr}</div>
        <div style="font-size:11px;color:#888;">Ref: ${payload.clientId}</div>
      </div>
    </div>

    <!-- Client Info Strip -->
    <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:14px 18px;margin-bottom:24px;display:flex;justify-content:space-between;">
      <div>
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Client Name</div>
        <div style="font-size:15px;font-weight:700;color:#333;margin-top:2px;">${payload.userName}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Risk Profile</div>
        <div style="font-size:15px;font-weight:700;color:#00458c;margin-top:2px;">${payload.riskClass}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Persona</div>
        <div style="font-size:15px;font-weight:700;color:#333;margin-top:2px;">${payload.persona}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Report Date</div>
        <div style="font-size:15px;font-weight:700;color:#333;margin-top:2px;">${dateStr}</div>
      </div>
    </div>

    <!-- Section 1: Executive Summary -->
    <div style="margin-bottom:28px;">
      <div style="font-size:16px;font-weight:700;color:#00458c;border-bottom:2px solid #00458c;padding-bottom:6px;margin-bottom:16px;">
        1. Executive Summary
      </div>

      <div style="display:flex;gap:20px;align-items:stretch;">
        <!-- Health Score Box -->
        <div style="flex:0 0 200px;background:linear-gradient(135deg,#00458c 0%,#006dd6 100%);border-radius:8px;padding:24px;text-align:center;color:#fff;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;opacity:0.8;margin-bottom:8px;">Health Score</div>
          <div style="font-size:52px;font-weight:800;line-height:1;">${payload.healthScore}</div>
          <div style="font-size:13px;margin-top:4px;opacity:0.9;">out of 1000</div>
          <div style="margin-top:12px;display:inline-block;padding:4px 16px;border-radius:20px;background:rgba(255,255,255,0.2);font-size:13px;font-weight:700;">
            Grade: ${payload.grade}
          </div>
        </div>

        <!-- Score Breakdown -->
        <div style="flex:1;background:#fff;border:1px solid #e9ecef;border-radius:8px;padding:18px;">
          <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:14px;">Score Breakdown</div>
          ${breakdownHTML}
        </div>
      </div>
    </div>

    <!-- Section 2: Gap Analysis -->
    <div style="margin-bottom:28px;">
      <div style="font-size:16px;font-weight:700;color:#00458c;border-bottom:2px solid #00458c;padding-bottom:6px;margin-bottom:16px;">
        2. Gap Analysis — 30-30-30-10 Rule
      </div>

      <table>
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#555;border-bottom:2px solid #dee2e6;">Category</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:600;color:#555;border-bottom:2px solid #dee2e6;">Ideal %</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:600;color:#555;border-bottom:2px solid #dee2e6;">Actual %</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:600;color:#555;border-bottom:2px solid #dee2e6;">Deviation</th>
          </tr>
        </thead>
        <tbody>
          ${gapRows}
        </tbody>
      </table>
    </div>

    <!-- Section 3: Priority Actions -->
    <div style="margin-bottom:28px;">
      <div style="font-size:16px;font-weight:700;color:#00458c;border-bottom:2px solid #00458c;padding-bottom:6px;margin-bottom:16px;">
        3. Priority Action Items
      </div>

      <table>
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:600;color:#555;border-bottom:2px solid #dee2e6;width:50px;">#</th>
            <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#555;border-bottom:2px solid #dee2e6;">Recommendation</th>
            <th style="padding:10px 14px;text-align:center;font-size:12px;font-weight:600;color:#555;border-bottom:2px solid #dee2e6;width:90px;">Priority</th>
          </tr>
        </thead>
        <tbody>
          ${actionRows}
        </tbody>
      </table>
    </div>

    <!-- Footer / Disclaimer -->
    <div style="position:absolute;bottom:20mm;left:22mm;right:22mm;border-top:1px solid #dee2e6;padding-top:12px;">
      <p style="font-size:9px;color:#999;line-height:1.6;text-align:justify;">
        <strong>Disclaimer:</strong> This report is generated for informational purposes only and does not constitute financial advice, a recommendation, or an offer to buy or sell any securities. WealthMax Financial Services Ltd. (SEBI Reg. No. INZ000012345 | AMFI ARN-67890) is a registered investment advisor. Past performance is not indicative of future results. All investments are subject to market risks. Please read all scheme-related documents carefully before investing. The 30-30-30-10 rule is a general guideline and may not be suitable for all individuals. Consult a qualified financial advisor for personalized advice. Grievance Officer: grievance@wealthmax.in | SEBI SCORES: https://scores.gov.in
      </p>
      <div style="text-align:center;margin-top:8px;font-size:9px;color:#bbb;">
        This is a system-generated document. No signature is required. Generated on ${dateStr} at ${timeStr} IST.
      </div>
    </div>

  </div>
</body>
</html>`;
}

// ── Validation ────────────────────────────────────────

function validatePayload(body: any): string[] {
  const errors: string[] = [];
  if (!body.userName || typeof body.userName !== "string") errors.push("userName is required");
  if (!body.clientId || typeof body.clientId !== "string") errors.push("clientId is required");
  if (typeof body.healthScore !== "number" || body.healthScore < 0 || body.healthScore > 1000) errors.push("healthScore must be 0-1000");
  if (!body.grade || typeof body.grade !== "string") errors.push("grade is required");
  if (!body.riskClass || typeof body.riskClass !== "string") errors.push("riskClass is required");
  if (!body.persona || typeof body.persona !== "string") errors.push("persona is required");
  if (!Array.isArray(body.gapAnalysis)) errors.push("gapAnalysis must be an array");
  if (!Array.isArray(body.actionItems)) errors.push("actionItems must be an array");
  if (!body.scoreBreakdown || typeof body.scoreBreakdown !== "object") errors.push("scoreBreakdown is required");
  return errors;
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
    const errors = validatePayload(body);

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = generateReportHTML(body as ReportPayload);

    // Check if caller wants HTML or JSON-wrapped HTML
    const acceptHeader = req.headers.get("Accept") || "";
    if (acceptHeader.includes("text/html")) {
      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="WealthMax_Report_${body.clientId}.html"`,
        },
      });
    }

    // Default: return JSON with the HTML string
    return new Response(
      JSON.stringify({ html, generatedAt: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
