import api from '@/lib/api';

// ── Types (kept identical for component compatibility) ────────────────────────

export interface HoldingWithPledge {
  id: string;
  scrip_name: string;
  quantity: number;
  current_nav: number;
  haircut: number;
  status: string;
  pledgeAmount: number;
}

export interface CalculateResult {
  holdings: HoldingWithPledge[];
  totalAvailableCredit: number;
}

export interface PledgeResult {
  pledgedCount: number;
  totalPledgeValue: number;
  newTotalPledgeValue: number;
  availableCredit: number;
}

export interface UnpledgeResult {
  unpledgedCount: number;
  releasedValue: number;
}

export interface MarginAccount {
  total_pledge_value: number;
  available_credit: number;
  borrowed_amount: number;
  utilization_pct: number;
  margin_call_triggered: boolean;
  last_risk_check: string | null;
}

export interface PledgeStatus {
  holdings: HoldingWithPledge[];
  marginAccount: MarginAccount | null;
  recentLedger: any[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Calculate available pledge value for all free holdings.
 * Derives pledge values from portfolio holdings via the Express backend.
 */
export async function calculatePledgeValue(): Promise<CalculateResult> {
  const { data } = await api.get('/portfolio/holdings');
  const rawHoldings: any[] = data?.data?.holdings ?? [];

  const LTV = 0.8;
  const freeHoldings: HoldingWithPledge[] = rawHoldings
    .filter((h) => h.status === 'free' || !h.status)
    .map((h) => {
      const nav = h.current_nav ?? h.ltp ?? 0;
      const haircut = h.haircut ?? 0;
      const pledgeAmount = h.quantity * nav * ((100 - haircut) / 100) * LTV;
      return {
        id: h.id,
        scrip_name: h.scrip_name ?? h.name,
        quantity: h.quantity,
        current_nav: nav,
        haircut,
        status: h.status ?? 'free',
        pledgeAmount,
      };
    });

  const totalAvailableCredit = freeHoldings.reduce((s, h) => s + h.pledgeAmount, 0);
  return { holdings: freeHoldings, totalAvailableCredit };
}

/**
 * Get full margin account status including pledged holdings.
 */
export async function getMarginStatus(): Promise<PledgeStatus> {
  const { data } = await api.get('/portfolio/holdings');
  const rawHoldings: any[] = data?.data?.holdings ?? [];

  const LTV = 0.8;
  const mapped: HoldingWithPledge[] = rawHoldings.map((h) => {
    const nav = h.current_nav ?? h.ltp ?? 0;
    const haircut = h.haircut ?? 0;
    const pledgeAmount = h.status === 'pledged'
      ? h.quantity * nav * ((100 - haircut) / 100) * LTV
      : 0;
    return {
      id: h.id,
      scrip_name: h.scrip_name ?? h.name,
      quantity: h.quantity,
      current_nav: nav,
      haircut,
      status: h.status ?? 'free',
      pledgeAmount,
    };
  });

  const totalPledge = mapped
    .filter((h) => h.status === 'pledged')
    .reduce((s, h) => s + h.pledgeAmount, 0);

  const marginAccount: MarginAccount = {
    total_pledge_value: totalPledge,
    available_credit: totalPledge,
    borrowed_amount: 0,
    utilization_pct: totalPledge > 0 ? (0 / totalPledge) * 100 : 0,
    margin_call_triggered: false,
    last_risk_check: null,
  };

  return { holdings: mapped, marginAccount, recentLedger: [] };
}

/**
 * Pledge specific holdings by ID (updates holding status to 'pledged').
 */
export async function pledgeHoldings(holdingIds: string[]): Promise<PledgeResult> {
  // Backend updates holding status individually
  await Promise.all(
    holdingIds.map((id) =>
      api.put(`/portfolio/holdings/${id}/status`, { status: 'pledged' })
    )
  );

  const status = await getMarginStatus();
  const pledged = status.holdings.filter((h) => holdingIds.includes(h.id));
  const totalPledgeValue = pledged.reduce((s, h) => s + h.pledgeAmount, 0);

  return {
    pledgedCount: pledged.length,
    totalPledgeValue,
    newTotalPledgeValue: status.marginAccount?.total_pledge_value ?? totalPledgeValue,
    availableCredit: status.marginAccount?.available_credit ?? totalPledgeValue,
  };
}

/**
 * Unpledge specific holdings by ID (updates holding status back to 'free').
 */
export async function unpledgeHoldings(holdingIds: string[]): Promise<UnpledgeResult> {
  await Promise.all(
    holdingIds.map((id) =>
      api.put(`/portfolio/holdings/${id}/status`, { status: 'free' })
    )
  );

  const status = await getMarginStatus();
  const freed = status.holdings.filter((h) => holdingIds.includes(h.id));
  const releasedValue = freed.reduce((s, h) => s + h.pledgeAmount, 0);

  return { unpledgedCount: freed.length, releasedValue };
}
