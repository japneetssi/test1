import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MARGIN_CALL_THRESHOLD = 90;   // %
const AUTO_LIQUIDATE_THRESHOLD = 100; // %
const DEFAULT_HAIRCUT = 0.20;

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Fetch all margin accounts with active borrows
    const { data: accounts, error: accErr } = await supabase
      .from("margin_accounts")
      .select("*")
      .gt("borrowed_amount", 0);

    if (accErr) throw new Error(accErr.message);
    if (!accounts?.length) {
      return new Response(
        JSON.stringify({ message: "No active margin accounts", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: {
      userId: string;
      utilization: number;
      action: "ok" | "margin_call" | "auto_liquidate";
    }[] = [];

    for (const account of accounts) {
      // Recalculate current pledge value from pledged holdings
      const { data: pledgedHoldings } = await supabase
        .from("holdings")
        .select("quantity, current_nav, haircut")
        .eq("user_id", account.user_id)
        .eq("status", "pledged");

      const currentPledgeValue = (pledgedHoldings || []).reduce(
        (sum, h) => sum + h.quantity * h.current_nav * (1 - (h.haircut ?? DEFAULT_HAIRCUT)),
        0
      );

      const utilization = currentPledgeValue > 0
        ? (account.borrowed_amount / currentPledgeValue) * 100
        : account.borrowed_amount > 0 ? 999 : 0;

      // Update margin account with fresh values
      await supabase
        .from("margin_accounts")
        .update({
          total_pledge_value: currentPledgeValue,
          available_credit: Math.max(0, currentPledgeValue - account.borrowed_amount),
          utilization_pct: Math.round(utilization * 100) / 100,
          last_risk_check: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", account.user_id);

      if (utilization >= AUTO_LIQUIDATE_THRESHOLD) {
        // Auto-liquidate: unpledge all and mark debt
        console.log(`AUTO-LIQUIDATE triggered for user ${account.user_id} — utilization ${utilization.toFixed(1)}%`);

        const { data: toLiquidate } = await supabase
          .from("holdings")
          .select("*")
          .eq("user_id", account.user_id)
          .eq("status", "pledged");

        if (toLiquidate?.length) {
          // Create liquidation ledger entries
          const ledgerEntries = toLiquidate.map((h) => ({
            user_id: account.user_id,
            holding_id: h.id,
            action: "auto_liquidate" as const,
            units: h.quantity,
            nav_at_action: h.current_nav,
            pledge_value: h.quantity * h.current_nav * (1 - (h.haircut ?? DEFAULT_HAIRCUT)),
          }));

          await supabase.from("pledge_ledger").insert(ledgerEntries);

          // Free the holdings
          await supabase
            .from("holdings")
            .update({ status: "free", updated_at: new Date().toISOString() })
            .eq("user_id", account.user_id)
            .eq("status", "pledged");

          // Zero out margin account
          await supabase
            .from("margin_accounts")
            .update({
              total_pledge_value: 0,
              available_credit: 0,
              utilization_pct: 0,
              margin_call_triggered: false,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", account.user_id);
        }

        results.push({ userId: account.user_id, utilization, action: "auto_liquidate" });

      } else if (utilization >= MARGIN_CALL_THRESHOLD) {
        // Margin call: flag account
        console.log(`MARGIN CALL for user ${account.user_id} — utilization ${utilization.toFixed(1)}%`);

        await supabase
          .from("margin_accounts")
          .update({ margin_call_triggered: true, updated_at: new Date().toISOString() })
          .eq("user_id", account.user_id);

        // In production: sendMarginCallEmail(account.user_id)
        results.push({ userId: account.user_id, utilization, action: "margin_call" });

      } else {
        // Clear any previous margin call flag
        if (account.margin_call_triggered) {
          await supabase
            .from("margin_accounts")
            .update({ margin_call_triggered: false, updated_at: new Date().toISOString() })
            .eq("user_id", account.user_id);
        }
        results.push({ userId: account.user_id, utilization, action: "ok" });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
