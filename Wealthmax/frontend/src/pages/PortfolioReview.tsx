import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface AllocationItem {
  name: string;
  value: number;
  color: string;
}

interface ActionItem {
  action: string;
  assetClass: string;
  amount: number;
}

interface ReviewResponse {
  clientId: string;
  clientName: string;
  persona: string;
  totalValue: number;
  currentAllocation: AllocationItem[];
  targetAllocation: AllocationItem[];
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
        const token = localStorage.getItem('wm_token');
        const res = await fetch(`/api/advisor/portfolio-review/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [clientId]);

  if (loading) return <div className="p-4">Loading portfolio review...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Portfolio Review for {data.clientName}</h2>
      <div className="flex flex-col md:flex-row justify-center items-center gap-8">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-medium mb-2">Current Allocation</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={data.currentAllocation}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.currentAllocation.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS_CURRENT[i % COLORS_CURRENT.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
            <Legend />
          </PieChart>
        </div>
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-medium mb-2">Target Allocation</h3>
          <PieChart width={300} height={300}>
            <Pie
              data={data.targetAllocation}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.targetAllocation.map((_, i) => (
                <Cell key={`cell-${i}`} fill={COLORS_TARGET[i % COLORS_TARGET.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
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
              <th className="px-4 py-2 text-left">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.actionPlan.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="px-4 py-2">{item.action}</td>
                <td className="px-4 py-2">{item.assetClass}</td>
                <td className="px-4 py-2">{item.amount.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioReview;
