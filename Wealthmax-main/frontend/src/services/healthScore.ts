import api from '@/lib/api';

// ── Types (kept identical for component compatibility) ────────────────────────

export interface UserFinancials {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyInvestments: number;
  monthlyEMI: number;
  emergencyFund: number;
  assetClasses: string[];
  hasTermInsurance: boolean;
  hasHealthInsurance: boolean;
  totalGoals: number;
  goalsOnTrack: number;
}

export interface ScoreBreakdown {
  savings: number;
  debt: number;
  liquidity: number;
  diversification: number;
  insurance: number;
  goalProgress: number;
}

export interface HealthScoreResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  improvementTips: string[];
  peerRank: number;
  grade: string;
}

export interface HealthScoreHistoryEntry {
  id: string;
  computed_at: string;
  total_score: number;
  savings_score: number;
  debt_score: number;
  liquidity_score: number;
  diversification_score: number;
  insurance_score: number;
  goal_score: number;
  peer_rank: number;
  improvement_tips: string[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetches the user's current financial profile, which includes the latest health score.
 * Maps backend profile response to HealthScoreResult.
 */
export async function computeHealthScore(
  _financials: UserFinancials
): Promise<HealthScoreResult> {
  // Backend calculates health score from stored profile + survey data.
  // Submit the financials as a profile update, then read back the score.
  const { data } = await api.post('/profile/update', {
    monthly_income: _financials.monthlyIncome,
    monthly_expenses: _financials.monthlyExpenses,
    monthly_investments: _financials.monthlyInvestments,
    monthly_emi: _financials.monthlyEMI,
    emergency_fund: _financials.emergencyFund,
    has_term_insurance: _financials.hasTermInsurance,
    has_health_insurance: _financials.hasHealthInsurance,
  });

  const profile = data?.data ?? {};
  const breakdown: ScoreBreakdown = {
    savings: profile.savings_score ?? 0,
    debt: profile.debt_score ?? 0,
    liquidity: profile.liquidity_score ?? 0,
    diversification: profile.diversification_score ?? 0,
    insurance: profile.insurance_score ?? 0,
    goalProgress: profile.goal_score ?? 0,
  };
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);

  return {
    totalScore: profile.health_score ?? total,
    breakdown,
    improvementTips: profile.improvement_tips ?? [],
    peerRank: profile.peer_rank ?? 50,
    grade: profile.grade ?? 'N/A',
  };
}

/**
 * Fetches health score history from the backend.
 */
export async function getHealthScoreHistory(limit = 10): Promise<HealthScoreHistoryEntry[]> {
  const { data } = await api.get(`/profile/score-history?limit=${limit}`);
  return data?.data ?? [];
}
