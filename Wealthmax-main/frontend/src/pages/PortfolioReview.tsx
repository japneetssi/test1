import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import api from '../lib/api';

interface AllocationSlice {
  name: string;
  value: number;
  color: string;
}

interface ActionItem {
  action: 'BUY' | 'SELL' | 'HOLD';
  assetClass: string;
  currentPercent: number;
  targetPercent: number;
  deviationPercent: number;
  amount: number;
  rationale: string;
}

/**
 * Review response as returned by PortfolioReviewController
 * (GET /api/v1/advisor/portfolio-review/:clientId). FIX: the page previously
 * consumed an invented shape and hit a raw fetch() with a hand-read
 * localStorage token - both replaced with the shared api client and the
 * controller's real response.
 */
interface ReviewResponse {
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
}

const COLORS_CURRENT = ['#10b981', '#ef4444']; // Equity green, Debt red
const COLORS_TARGET = ['#00458c', '#f37920']; // Navy blue, Orange

const PortfolioReview: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        // FIX (useless.md): shared client handles the Bearer header - no
        // manual localStorage token reads, no wrong /api base path.
        const res = await api.get(`/advisor/portfolio-review/${clientId}`);
        setData(res.data?.data ?? null);
      } catch (e: any) {
        setError(e?.response?.data?.message || e.message || 'Failed to fetch portfolio review');
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [clientId]);

  if (loading) return <div className="p-4">Loading portfolio review...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return null;

  // Build pie slices from the controller's percentage fields.
  const currentSlices: AllocationSlice[] = [
    { name: 'Equity', value: data.currentAllocation.equity, color: COLORS_CURRENT[0] },
    { name: 'Debt/MF', value: data.currentAllocation.debt, color: COLORS_CURRENT[1] },
  ];
  const targetSlices: AllocationSlice[] = [
    { name: 'Equity', value: data.targetAllocation.equity, color: COLORS_TARGET[0] },
    { name: 'Debt/MF', value: data.targetAllocation.debt, color: COLORS_TARGET[1] },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1">Portfolio Review for {data.client.name}</h2>
      <p className="text-sm text-slate-600 mb-4">
        {data.client.persona} profile · {data.client.riskClass} risk class · Alignment{' '}
        <span className="font-bold">{data.alignmentScore}</span>/100
      </p>

      <div className="flex flex-col md:flex-row justify-center items-center gap-8">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-medium mb-2">Current Allocation</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={currentSlices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {currentSlices.map((slice, i) => (
                <Cell key={`cell-current-${i}`} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            <Legend />
          </PieChart>
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-medium mb-2">Target Allocation</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={targetSlices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {targetSlices.map((slice, i) => (
                <Cell key={`cell-target-${i}`} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
            <Legend />
          </PieChart>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Action Plan</h3>
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Asset Class</th>
              <th className="px-4 py-2 text-left">Current → Target</th>
              <th className="px-4 py-2 text-left">Amount (₹)</th>
              <th className="px-4 py-2 text-left">Rationale</th>
            </tr>
          </thead>
          <tbody>
            {(data.actionPlan || []).map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="px-4 py-2 font-medium">{item.action}</td>
                <td className="px-4 py-2">{item.assetClass}</td>
                <td className="px-4 py-2">
                  {item.currentPercent.toFixed(1)}% → {item.targetPercent.toFixed(1)}%
                </td>
                <td className="px-4 py-2">{item.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-2 text-slate-600">{item.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioReview;
