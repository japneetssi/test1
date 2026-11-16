
-- Health scores table: stores computed scores and history
CREATE TABLE public.health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 1000),
  savings_score NUMERIC NOT NULL DEFAULT 0,
  debt_score NUMERIC NOT NULL DEFAULT 0,
  liquidity_score NUMERIC NOT NULL DEFAULT 0,
  diversification_score NUMERIC NOT NULL DEFAULT 0,
  insurance_score NUMERIC NOT NULL DEFAULT 0,
  goal_score NUMERIC NOT NULL DEFAULT 0,
  improvement_tips TEXT[] NOT NULL DEFAULT '{}',
  peer_rank NUMERIC NOT NULL DEFAULT 50,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own health scores" ON public.health_scores
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access health_scores" ON public.health_scores
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Index for peer rank aggregation
CREATE INDEX idx_health_scores_total ON public.health_scores (total_score);
CREATE INDEX idx_health_scores_user ON public.health_scores (user_id, computed_at DESC);
