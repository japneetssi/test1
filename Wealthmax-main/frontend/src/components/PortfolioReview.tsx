import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShieldCheck,
  Loader2,
  BarChart3,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActionItem {
  action: 'BUY' | 'SELL' | 'HOLD';
  assetClass: string;
  currentPercent: number;
  targetPercent: number;
  deviationPercent: number;
  amount: number;
  rationale: string;
}

interface AdvisoryFlag {
  id: string;
  type: 'warning' | 'suggestion' | 'info';
  title: string;
  message: string;
  priority: number;
}

interface ReviewData {
  client: {
    id: string;
    name: string;
    persona: string;
    riskClass: string;
  };
  currentAllocation: {
    equity: number;
    debt: number;
    equityValue: number;
    debtValue: number;
    totalValue: number;
  };
  targetAllocation: {
    equity: number;
    debt: number;
  };
  alignmentScore: number;
  summary: string;
  actionPlan: ActionItem[];
  advisoryFlags: AdvisoryFlag[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatINR = (num: number): string => {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const EQUITY_COLOR = '#3b82f6';
const DEBT_COLOR = '#f59e0b';
const DONUT_COLORS = [EQUITY_COLOR, DEBT_COLOR];

// ── Custom Donut Label ────────────────────────────────────────────────────────

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="800" fontSize={13}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface PortfolioReviewProps {
  clientId: string;
}

const PortfolioReview: React.FC<PortfolioReviewProps> = ({ clientId }) => {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/advisor/portfolio-review/${clientId}`);
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load review');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchReview();
  }, [clientId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-10 w-10 text-[#00458c] animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Analyzing Portfolio...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-sm font-bold text-slate-600">{error}</p>
        <button onClick={fetchReview} className="text-xs font-bold text-[#00458c] underline">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const {
    client,
    currentAllocation,
    targetAllocation,
    alignmentScore,
    summary,
    actionPlan,
    advisoryFlags,
  } = data;

  // Donut data
  const currentDonut = [
    { name: 'Equity', value: currentAllocation.equity },
    { name: 'Debt / MF', value: currentAllocation.debt },
  ];

  const targetDonut = [
    { name: 'Equity', value: targetAllocation.equity },
    { name: 'Debt / MF', value: targetAllocation.debt },
  ];

  // Alignment score color
  const scoreColor =
    alignmentScore >= 80 ? 'text-emerald-600' :
    alignmentScore >= 50 ? 'text-amber-600' :
    'text-red-600';

  const scoreBg =
    alignmentScore >= 80 ? 'from-emerald-50 to-green-50' :
    alignmentScore >= 50 ? 'from-amber-50 to-yellow-50' :
    'from-red-50 to-orange-50';

  return (
    <div className="space-y-8 px-4 py-6 animate-in fade-in duration-500">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00458c] to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
              <RefreshCw className="h-4 w-4 text-white" />
            </div>
            Portfolio Review & Rebalancing
          </h3>
          <p className="text-sm text-slate-500 mt-1 ml-12 font-medium italic">
            {client.name} · {client.persona} Profile
          </p>
        </div>

        <div className={`bg-gradient-to-br ${scoreBg} rounded-2xl px-6 py-4 text-center shadow-sm border border-white/60`}>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Alignment</p>
          <p className={`text-3xl font-black ${scoreColor}`}>{alignmentScore}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">/ 100</p>
        </div>
      </div>

      {/* ── Summary Banner ──────────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start gap-4">
        <ShieldCheck className="h-5 w-5 text-[#00458c] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600 font-medium leading-relaxed">{summary}</p>
      </div>

      {/* ── Side-by-Side Donut Charts ───────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Current Allocation */}
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-slate-50 text-center">
            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Current Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={currentDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                  stroke="none"
                >
                  {currentDonut.map((_, index) => (
                    <Cell key={`current-${index}`} fill={DONUT_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EQUITY_COLOR }} />
                <span className="text-xs font-bold text-slate-600">
                  Equity: {currentAllocation.equity}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  ({formatINR(currentAllocation.equityValue)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEBT_COLOR }} />
                <span className="text-xs font-bold text-slate-600">
                  Debt: {currentAllocation.debt}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  ({formatINR(currentAllocation.debtValue)})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Allocation */}
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-slate-50 text-center">
            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Target Allocation
              <span className="text-[10px] font-bold text-[#00458c] ml-2 normal-case">({client.persona})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={targetDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                  stroke="none"
                >
                  {targetDonut.map((_, index) => (
                    <Cell key={`target-${index}`} fill={DONUT_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EQUITY_COLOR }} />
                <span className="text-xs font-bold text-slate-600">
                  Equity: {targetAllocation.equity}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEBT_COLOR }} />
                <span className="text-xs font-bold text-slate-600">
                  Debt: {targetAllocation.debt}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Rebalancing Action Plan Table ───────────────────────────────── */}
      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
        <CardHeader className="px-8 py-6 border-b border-slate-50">
          <CardTitle className="text-base font-black text-[#00458c] flex items-center gap-2">
            <Target className="h-5 w-5" />
            Rebalancing Action Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/70">
                  <th className="px-8 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Asset Class</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Current %</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Target %</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Deviation</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                  <th className="px-8 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {actionPlan.map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <Badge
                        className={`text-[10px] font-black px-3 py-1 rounded-lg border-none gap-1.5 ${
                          item.action === 'BUY'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.action === 'SELL'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {item.action === 'BUY' && <ArrowUpRight className="h-3.5 w-3.5" />}
                        {item.action === 'SELL' && <ArrowDownRight className="h-3.5 w-3.5" />}
                        {item.action === 'HOLD' && <Minus className="h-3.5 w-3.5" />}
                        {item.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-sm font-extrabold text-slate-800">{item.assetClass}</td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-slate-600">{item.currentPercent}%</td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-[#00458c]">{item.targetPercent}%</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`text-sm font-black ${
                        item.deviationPercent > 0 ? 'text-red-600' : item.deviationPercent < 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {item.deviationPercent > 0 ? '+' : ''}{item.deviationPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-sm font-black text-slate-800">
                      {item.amount > 0 ? formatINR(item.amount) : '—'}
                    </td>
                    <td className="px-8 py-5 text-xs text-slate-500 font-medium max-w-[300px] leading-relaxed">
                      {item.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Advisory Flags ──────────────────────────────────────────────── */}
      {advisoryFlags.length > 0 && (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-slate-50">
            <CardTitle className="text-base font-black text-[#00458c] flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Advisory Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {advisoryFlags.map((flag, idx) => {
              const bgColor =
                flag.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                flag.type === 'suggestion' ? 'bg-blue-50 border-blue-200' :
                'bg-emerald-50 border-emerald-200';
              const iconColor =
                flag.type === 'warning' ? 'text-amber-600' :
                flag.type === 'suggestion' ? 'text-blue-600' :
                'text-emerald-600';
              const FlagIcon =
                flag.type === 'warning' ? AlertTriangle :
                flag.type === 'suggestion' ? Info :
                CheckCircle2;

              return (
                <div key={idx} className={`${bgColor} border rounded-2xl p-5 flex gap-4 items-start`}>
                  <FlagIcon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-sm font-black text-slate-800 mb-1">{flag.title}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{flag.message}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Portfolio Total ─────────────────────────────────────────────── */}
      <div className="text-center py-4 opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Total Portfolio Value: {formatINR(currentAllocation.totalValue)}
        </p>
      </div>
    </div>
  );
};

export default PortfolioReview;
