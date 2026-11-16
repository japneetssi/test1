import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_LTV = 0.80;
const DEFAULT_HAIRCUT = 0.20;

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

// ── Calculate pledge value for a list of holdings ─────
function calculatePledgeValue(
  holdings: { quantity: number; current_nav: number; haircut: number }[]
): { items: { pledgeAmount: number }[]; totalAvailableCredit: number } {
  const items = holdings.map((h) => ({
    pledgeAmount: h.quantity * h.current_nav * (1 - (h.haircut ?? DEFAULT_HAIRCUT)),
  }));
  const totalAvailableCredit = items.reduce((sum, i) => sum + i.pledgeAmount, 0);
  return { items, totalAvailableCredit: Math.min(totalAvailableCredit, totalAvailableCredit * MAX_LTV) };
}

// ── Handlers ──────────────────────────────────────────

async function handleCalculate(authHeader: string) {
  const supabase = getSupabaseUser(authHeader);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: holdings, error } = await supabase
    .from("holdings")
    .select("id, scrip_name, quantity, current_nav, haircut, status")
    .eq("status", "free");

  if (error) throw new Error(error.message);

  const result = calculatePledgeValue(holdings || []);
  return {
    holdings: (holdings || []).map((h, i) => ({
      ...h,
      pledgeAmount: result.items[i]?.pledgeAmount ?? 0,
    })),
    totalAvailableCredit: result.totalAvailableCredit,
  };
}

async function handlePledge(authHeader: string, holdingIds: string[]) {
  if (!holdingIds?.length) throw new Error("No holdings specified for pledging");

  const supabaseAdmin = getSupabaseAdmin();
  const supabaseUser = getSupabaseUser(authHeader);
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch holdings to pledge (must be free and owned by user)
  const { data: holdings, error: fetchErr } = await supabaseAdmin
    .from("holdings")
    .select("*")
    .in("id", holdingIds)
    .eq("user_id", user.id)
    .eq("status", "free");

  if (fetchErr) throw new Error(fetchErr.message);
  if (!holdings?.length) throw new Error("No eligible free holdings found");

  // Calculate pledge values
  const pledgeCalc = calculatePledgeValue(holdings);

  // ATOMIC: Lock holdings + create ledger entries + update margin account
  // Step 1: Lock all holdings
  const { error: lockErr } = await supabaseAdmin
    .from("holdings")
    .update({ status: "pledged", updated_at: new Date().toISOString() })
    .in("id", holdings.map((h) => h.id));

  if (lockErr) throw new Error(`Failed to lock holdings: ${lockErr.message}`);

  // Step 2: Create ledger entries
  const ledgerEntries = holdings.map((h, i) => ({
    user_id: user.id,
    holding_id: h.id,
    action: "pledge" as const,
    units: h.quantity,
    nav_at_action: h.current_nav,
    pledge_value: pledgeCalc.items[i].pledgeAmount,
  }));

  const { error: ledgerErr } = await supabaseAdmin
    .from("pledge_ledger")
    .insert(ledgerEntries);

  if (ledgerErr) {
    // Rollback: unlock holdings
    await supabaseAdmin
      .from("holdings")
      .update({ status: "free", updated_at: new Date().toISOString() })
      .in("id", holdings.map((h) => h.id));
    throw new Error(`Failed to create ledger: ${ledgerErr.message}`);
  }

  // Step 3: Upsert margin account
  const { data: existingAccount } = await supabaseAdmin
    .from("margin_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const newPledgeValue = (existingAccount?.total_pledge_value ?? 0) + pledgeCalc.totalAvailableCredit;
  const newAvailableCredit = newPledgeValue - (existingAccount?.borrowed_amount ?? 0);
  const utilization = newPledgeValue > 0
    ? ((existingAccount?.borrowed_amount ?? 0) / newPledgeValue) * 100
    : 0;

  if (existingAccount) {
    const { error: updateErr } = await supabaseAdmin
      .from("margin_accounts")
      .update({
        total_pledge_value: newPledgeValue,
        available_credit: newAvailableCredit,
        utilization_pct: utilization,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateErr) throw new Error(`Failed to update margin account: ${updateErr.message}`);
  } else {
    const { error: insertErr } = await supabaseAdmin
      .from("margin_accounts")
      .insert({
        user_id: user.id,
        total_pledge_value: newPledgeValue,
        available_credit: newAvailableCredit,
        borrowed_amount: 0,
        utilization_pct: 0,
      });

    if (insertErr) throw new Error(`Failed to create margin account: ${insertErr.message}`);
  }

  return {
    pledgedCount: holdings.length,
    totalPledgeValue: pledgeCalc.totalAvailableCredit,
    newTotalPledgeValue: newPledgeValue,
    availableCredit: newAvailableCredit,
  };
}

async function handleUnpledge(authHeader: string, holdingIds: string[]) {
  if (!holdingIds?.length) throw new Error("No holdings specified for unpledging");

  const supabaseAdmin = getSupabaseAdmin();
  const supabaseUser = getSupabaseUser(authHeader);
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: holdings, error: fetchErr } = await supabaseAdmin
    .from("holdings")
    .select("*")
    .in("id", holdingIds)
    .eq("user_id", user.id)
    .eq("status", "pledged");

  if (fetchErr) throw new Error(fetchErr.message);
  if (!holdings?.length) throw new Error("No pledged holdings found");

  const pledgeCalc = calculatePledgeValue(holdings);

  // Check if unpledging would cause utilization > 100%
  const { data: account } = await supabaseAdmin
    .from("margin_accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (account) {
    const remainingPledge = account.total_pledge_value - pledgeCalc.totalAvailableCredit;
    if (remainingPledge < account.borrowed_amount) {
      throw new Error(
        `Cannot unpledge: would result in negative margin. ` +
        `Borrowed: ₹${account.borrowed_amount}, Remaining pledge: ₹${remainingPledge}`
      );
    }
  }

  // Unlock holdings
  const { error: unlockErr } = await supabaseAdmin
    .from("holdings")
    .update({ status: "free", updated_at: new Date().toISOString() })
    .in("id", holdings.map((h) => h.id));

  if (unlockErr) throw new Error(`Failed to unlock: ${unlockErr.message}`);

  // Ledger entries
  const ledgerEntries = holdings.map((h, i) => ({
    user_id: user.id,
    holding_id: h.id,
    action: "unpledge" as const,
    units: h.quantity,
    nav_at_action: h.current_nav,
    pledge_value: pledgeCalc.items[i].pledgeAmount,
  }));

  await supabaseAdmin.from("pledge_ledger").insert(ledgerEntries);

  // Update margin account
  if (account) {
    const newPledge = account.total_pledge_value - pledgeCalc.totalAvailableCredit;
    const newCredit = newPledge - account.borrowed_amount;
    const util = newPledge > 0 ? (account.borrowed_amount / newPledge) * 100 : 0;

    await supabaseAdmin
      .from("margin_accounts")
      .update({
        total_pledge_value: newPledge,
        available_credit: newCredit,
        utilization_pct: util,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  return { unpledgedCount: holdings.length, releasedValue: pledgeCalc.totalAvailableCredit };
}

async function handleStatus(authHeader: string) {
  const supabaseUser = getSupabaseUser(authHeader);
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = getSupabaseAdmin();

  const [holdingsRes, accountRes, ledgerRes] = await Promise.all([
    supabaseAdmin.from("holdings").select("*").eq("user_id", user.id),
    supabaseAdmin.from("margin_accounts").select("*").eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("pledge_ledger").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  return {
    holdings: holdingsRes.data || [],
    marginAccount: accountRes.data || null,
    recentLedger: ledgerRes.data || [],
  };
}

// ── HTTP router ───────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const body = req.method === "POST" ? await req.json() : {};
    const { action } = body;

    let result: unknown;

    switch (action) {
      case "calculate":
        result = await handleCalculate(authHeader);
        break;
      case "pledge":
        result = await handlePledge(authHeader, body.holdingIds);
        break;
      case "unpledge":
        result = await handleUnpledge(authHeader, body.holdingIds);
        break;
      case "status":
        result = await handleStatus(authHeader);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: calculate, pledge, unpledge, status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = err.message === "Unauthorized" ? 401 : 500;
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
