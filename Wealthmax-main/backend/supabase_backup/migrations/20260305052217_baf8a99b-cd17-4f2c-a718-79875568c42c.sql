
-- Holdings table: tracks user's free/pledged assets
CREATE TABLE public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scrip_name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'equity' CHECK (asset_type IN ('equity', 'mutual_fund', 'etf')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  avg_price NUMERIC NOT NULL CHECK (avg_price >= 0),
  current_nav NUMERIC NOT NULL DEFAULT 0,
  haircut NUMERIC NOT NULL DEFAULT 0.20,
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'pledged')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pledge ledger: immutable audit log of pledge/unpledge events
CREATE TABLE public.pledge_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  holding_id UUID REFERENCES public.holdings(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('pledge', 'unpledge', 'auto_liquidate')),
  units NUMERIC NOT NULL,
  nav_at_action NUMERIC NOT NULL,
  pledge_value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Margin accounts: tracks borrowed amount and credit available
CREATE TABLE public.margin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_pledge_value NUMERIC NOT NULL DEFAULT 0,
  available_credit NUMERIC NOT NULL DEFAULT 0,
  borrowed_amount NUMERIC NOT NULL DEFAULT 0,
  utilization_pct NUMERIC NOT NULL DEFAULT 0,
  margin_call_triggered BOOLEAN NOT NULL DEFAULT false,
  last_risk_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margin_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own holdings" ON public.holdings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own pledge ledger" ON public.pledge_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users view own margin account" ON public.margin_accounts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Service role needs full access for edge functions (risk monitor)
CREATE POLICY "Service role full access holdings" ON public.holdings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access pledge_ledger" ON public.pledge_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access margin_accounts" ON public.margin_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);
