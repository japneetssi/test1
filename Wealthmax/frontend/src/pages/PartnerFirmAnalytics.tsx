import React, { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const PartnerFirmAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/partner/analytics');
      if (data.success) setData(data.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load analytics');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // Dynamically calculate Y-axis domain based on fetched data
  const chartDomain = useMemo(() => {
    if (!data?.historical_aum?.length) return { min: 0, max: 100000000 };
    const values = data.historical_aum.map((d: any) => d.aum);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 10000000;
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    };
  }, [data?.historical_aum]);

  if (!data) return <div className="p-8">{loading ? 'Loading analytics...' : 'No analytics data'}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Firm Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total AUM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(data.total_firm_aum || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_active_clients || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Month-over-Month Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.mom_growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{data.mom_growth}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded shadow-sm p-4">
          <h3 className="text-lg font-bold mb-2">AUM Trend (Last 6 months)</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={data.historical_aum || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis domain={[chartDomain.min, chartDomain.max]} tickFormatter={(v) => formatINR(v)} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip formatter={(value: any) => formatINR(value)} />
                <Area type="monotone" dataKey="aum" stroke="#8884d8" fillOpacity={1} fill="url(#colorAum)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm p-4">
          <h3 className="text-lg font-bold mb-2">Top Advisors</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase">
                <th className="py-2">Advisor</th>
                <th className="py-2 text-right">Clients</th>
                <th className="py-2 text-right">AUM</th>
              </tr>
            </thead>
            <tbody>
              {(data.leaderboard || []).map((row: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="py-2 font-semibold">{row.name}</td>
                  <td className="py-2 text-right">{row.client_count}</td>
                  <td className="py-2 text-right">{formatINR(parseFloat(row.aum_managed || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartnerFirmAnalytics;
