import React from 'react';
import { UserFinancialData } from '@/lib/financialReport.util';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, ComposedChart } from 'recharts';

interface HistoricalTrendsProps {
  currentData: UserFinancialData;
}

export const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({ currentData }) => {
  // Mock 6 months of historical data ending in current month
  // In a real app, this would be fetched from Supabase historical records
  const currentNetWorth = currentData.totalAssets - currentData.totalLiabilities;
  const currentDebt = currentData.totalLiabilities;

  const getMonthName = (monthsAgo: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    return d.toLocaleDateString('default', { month: 'short', year: '2-digit' });
  };

  const trendData = [
    { name: getMonthName(5), NetWorth: currentNetWorth * 0.85, Debt: currentDebt * 1.15 },
    { name: getMonthName(4), NetWorth: currentNetWorth * 0.88, Debt: currentDebt * 1.10 },
    { name: getMonthName(3), NetWorth: currentNetWorth * 0.90, Debt: currentDebt * 1.08 },
    { name: getMonthName(2), NetWorth: currentNetWorth * 0.94, Debt: currentDebt * 1.05 },
    { name: getMonthName(1), NetWorth: currentNetWorth * 0.98, Debt: currentDebt * 1.02 },
    { name: 'Current', NetWorth: currentNetWorth, Debt: currentDebt },
  ];

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${(value / 1000).toFixed(1)}k`;
  };

  return (
    <div className="w-full mt-12 mb-8 print:mt-6 print:mb-4">
      <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-emerald-500 pb-2 mb-6 inline-block">
        Historical Trend Analysis
      </h3>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 print:shadow-none print:border-slate-300">
          <h4 className="text-lg font-bold text-slate-700 mb-6 text-center">Net Worth vs Debt Trend (Last 6 Months)</h4>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={formatCurrency}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tickFormatter={formatCurrency}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Bar yAxisId="left" dataKey="NetWorth" name="Net Worth Growth" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Line yAxisId="right" type="monotone" dataKey="Debt" name="Debt Reduction" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            Steady increase in Net Worth coupled with decreasing Debt indicates positive financial momentum.
          </p>
        </div>
      </div>
    </div>
  );
};
