import api from '@/lib/api';

// ── Types (kept identical for component compatibility) ────────────────────────

export interface RiskQuestion {
  id: string;
  question: string;
  options: { label: string; value: number }[];
  category?: string;
}

export interface RiskProfileResult {
  normalizedScore: number;
  rawNormalizedScore: number;
  riskClass: 'Conservative' | 'Moderate' | 'Aggressive';
  contradictionFlag: boolean;
  contradictions: string[];
  categoryAverages: Record<string, number>;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetches the risk survey questions from the backend.
 */
export async function getRiskQuestions(): Promise<RiskQuestion[]> {
  const { data } = await api.get('/survey/questions');
  const raw: any[] = data?.data ?? [];

  // Backend uses { id, text, category, options: [{ text, weight }] }
  // Frontend expects { id, question, category, options: [{ label, value }] }
  return raw.map((q: any) => ({
    id: String(q.id),
    question: q.text ?? q.question ?? '',
    category: q.category,
    options: (q.options ?? []).map((o: any) => ({
      label: o.text ?? o.label ?? '',
      value: o.weight ?? o.value ?? 0,
    })),
  }));
}

/**
 * Submits the 25-question risk survey to the backend.
 * Responses is a map of questionId → answer value (1–5).
 */
export async function submitRiskSurvey(
  responses: Record<string, number>
): Promise<RiskProfileResult> {
  // Backend expects array format: [{ questionId: number, weight: number }]
  const formattedResponses = Object.entries(responses).map(([questionId, answer]) => ({
    questionId: Number(questionId),
    weight: answer,
  }));

  const { data } = await api.post('/survey/submit', {
    responses: formattedResponses,
  });

  const result = data?.data ?? {};
  return {
    normalizedScore: result.score ?? 0,
    rawNormalizedScore: result.score ?? 0,
    riskClass: result.riskClass ?? 'Moderate',
    contradictionFlag: (result.contradictions?.length ?? 0) > 0,
    contradictions: result.contradictions ?? [],
    categoryAverages: result.categoryAverages ?? {},
  };
}
