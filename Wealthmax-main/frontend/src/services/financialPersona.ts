import api from '@/lib/api';

// ── Types (kept identical for component compatibility) ────────────────────────

export interface HealthGap {
  ideal: { expenses: number; liabilities: number; investment: number; emergency: number };
  actual: { expenses: number; liabilities: number; investment: number; emergency: number };
  deviation: { expenses: number; liabilities: number; investment: number; emergency: number };
  overallHealthScore: number;
}

export interface PersonaResult {
  persona: 'A_Accumulator' | 'B_ActiveTrader' | 'C_HNI_Preservation';
  personaLabel: string;
  focus: string;
  riskCategory: 'Conservative' | 'Moderate' | 'Aggressive';
  recommendedProducts: string[];
  healthGap: HealthGap;
  flags: string[];
}

export interface PersonaInput {
  age: number;
  grossIncome: number;
  monthlyExpenses: number;
  liabilities: number;
  riskScore: number;
  netWorth?: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Classifies the user's financial persona by submitting a profile update.
 * The backend profiling engine re-runs on every profile update and stores
 * the result in `financial_profiles.persona_data`.
 */
export async function classifyFinancialPersona(
  input: PersonaInput
): Promise<PersonaResult> {
  const { data } = await api.post('/profile/update', {
    age: input.age,
    gross_income: input.grossIncome,
    monthly_expenses: input.monthlyExpenses,
    liabilities: input.liabilities,
    risk_score: input.riskScore,
    net_worth: input.netWorth,
  });

  const profile = data?.data ?? {};
  const personaData = profile.persona_data ?? {};

  // Map backend persona_data → PersonaResult shape
  const rawPersona = personaData?.persona?.name ?? 'A_Accumulator';
  const personaMap: Record<string, PersonaResult['persona']> = {
    A_Accumulator: 'A_Accumulator',
    B_ActiveTrader: 'B_ActiveTrader',
    C_HNI_Preservation: 'C_HNI_Preservation',
  };

  return {
    persona: personaMap[rawPersona] ?? 'A_Accumulator',
    personaLabel: personaData?.persona?.label ?? rawPersona,
    focus: personaData?.persona?.focus ?? '',
    riskCategory: profile.risk_class ?? 'Moderate',
    recommendedProducts: personaData?.recommendedProducts ?? [],
    healthGap: {
      ideal: personaData?.healthGap?.ideal ?? { expenses: 30, liabilities: 30, investment: 30, emergency: 10 },
      actual: personaData?.healthGap?.actual ?? { expenses: 0, liabilities: 0, investment: 0, emergency: 0 },
      deviation: personaData?.healthGap?.deviation ?? { expenses: 0, liabilities: 0, investment: 0, emergency: 0 },
      overallHealthScore: profile.health_score ?? 0,
    },
    flags: personaData?.flags ?? [],
  };
}

/**
 * Fetches the currently computed persona from the profile endpoint.
 */
export async function getFinancialPersona(): Promise<PersonaResult | null> {
  try {
    const { data } = await api.get('/profile/');
    const profile = data?.data ?? {};
    if (!profile.persona_data) return null;
    return classifyFinancialPersona({
      age: profile.age ?? 30,
      grossIncome: profile.gross_income ?? 0,
      monthlyExpenses: profile.monthly_expenses ?? 0,
      liabilities: profile.liabilities ?? 0,
      riskScore: profile.risk_score ?? 50,
      netWorth: profile.net_worth,
    });
  } catch {
    return null;
  }
}
