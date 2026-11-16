import React, { useState, useEffect } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldCheck, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface ClientAnalyticsHubProps {
  clientId: string | null;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ClientAnalyticsHub: React.FC<ClientAnalyticsHubProps> = ({ clientId, clientName, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/portfolio/analytics-snapshot?userId=${clientId}`);
      if (data.success) {
        setData(data.data);
      }
    } catch (err) {
      console.error('Fetch Analytics Error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && clientId) {
      fetchAnalytics();
    }
  }, [isOpen, clientId]);

  if (!isOpen) return null;

  // ── Chart Data Formatters ──────────────────────────────────────────────────
  
  const healthData = data?.health ? [
    { subject: 'Savings', A: data.health.factors.savings, fullMark: 100 },
    { subject: 'Debt', A: data.health.factors.debt, fullMark: 100 },
    { subject: 'Liquidity', A: data.health.factors.liquidity, fullMark: 100 },
    { subject: 'Diversity', A: data.health.factors.diversity, fullMark: 100 },
    { subject: 'Protection', A: data.health.factors.protection, fullMark: 100 },
    { subject: 'Goals', A: data.health.factors.goals, fullMark: 100 },
    { subject: 'Literacy', A: data.health.factors.literacy, fullMark: 100 },
  ] : [];

  const allocationData = data?.allocation?.categories?.map((cat: any) => ({
    name: cat.label,
    value: cat.value
  })) || [];

  const performanceData = data?.charts?.performance ? 
    data.charts.performance.labels.map((label: string, i: number) => ({
      name: label,
      portfolio: data.charts.performance.portfolio[i],
      benchmark: data.charts.performance.benchmark[i]
    })) : [];

  const COLORS = ['#00458c', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-10 border-none shadow-2xl bg-white/95 backdrop-blur-xl animate-in zoom-in-95 duration-300">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-8 mb-8 border-slate-50">
          <div>
            <DialogTitle className="text-2xl font-black text-[#00458c] mb-1">Risk Analytics Portal</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              Deep-diagnostic profile for <span className="text-slate-900">{clientName}</span>
            </DialogDescription>
          </div>
          <div className="flex gap-4">
             {data?.risk && (
               <Badge variant="outline" className={`h-10 px-4 rounded-xl font-black uppercase tracking-widest bg-slate-50 border-slate-100 ${data.risk.score > 80 ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {data.risk.label} Risk
               </Badge>
             )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center opacity-30 gap-4">
             <Loader2 className="h-10 w-10 animate-spin text-[#00458c]" />
             <p className="font-black text-xs uppercase tracking-[0.2em]">Synthesizing Portfolio Matrix...</p>
          </div>
        ) : !data ? (
          <div className="h-[400px] flex flex-col items-center justify-center opacity-30 gap-4">
             <AlertCircle className="h-10 w-10 text-red-500" />
             <p className="font-black text-xs uppercase tracking-widest">Analytics Unavailable - No assets synced</p>
          </div>
        ) : (
          <div className="space-y-10">
             {/* ── Top Row: Health Radar & Core Metrics ── */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-white shadow-inner">
                   <div className="flex items-center gap-2 mb-6">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Financial Health Radar</h4>
                   </div>
                   <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={healthData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                               name="Health Score"
                               dataKey="A"
                               stroke="#00458c"
                               fill="#00458c"
                               fillOpacity={0.6}
                            />
                         </RadarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2 bg-[#00458c] rounded-[2rem] p-6 text-white shadow-xl shadow-blue-900/10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Portfolio XIRR</p>
                      <h3 className="text-3xl font-black mb-4">{data.summary.xirr}%</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                         <TrendingUp className="h-3 w-3 text-emerald-400" />
                         <span>+12.4% vs Benchmark</span>
                      </div>
                   </div>
                   
                   <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total P&L</p>
                      <h3 className="text-lg font-black text-emerald-600">₹{(data.summary.totalPnL / 100000).toFixed(2)}L</h3>
                   </div>
                   
                   <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Diversification</p>
                      <h3 className="text-lg font-black text-slate-800">{data.summary.holdingsCount} Schemes</h3>
                   </div>
                </div>
             </div>

             {/* ── Mid Row: Allocation & Performance ── */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category Exposure</h4>
                   <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                               data={allocationData}
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                            >
                               {allocationData.map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                               ))}
                            </Pie>
                            <Tooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                            />
                            <Legend 
                               verticalAlign="middle" 
                               align="right" 
                               layout="vertical"
                               iconType="circle"
                               wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingLeft: '20px' }}
                            />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="bg-white space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Growth vs Benchmark</h4>
                   <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={performanceData}>
                            <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip 
                               cursor={{ fill: '#f8fafc' }}
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                            />
                            <Bar dataKey="portfolio" name="Portfolio" fill="#00458c" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="benchmark" name="Benchmark" fill="#f37920" radius={[4, 4, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>

             {/* ── Risk Flags ── */}
             <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                   <AlertCircle className="h-5 w-5 text-orange-600" />
                   <h4 className="text-sm font-black text-orange-950 uppercase tracking-tight">Active Portfolio Risks</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {data.risk.flags.length > 0 ? data.risk.flags.map((flag: string, i: number) => (
                      <div key={i} className="bg-white/50 border border-orange-200 p-3 rounded-2xl flex items-center gap-3 text-[11px] font-bold text-orange-900">
                         <div className="w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0" />
                         {flag}
                      </div>
                   )) : (
                      <div className="col-span-2 text-center py-4 font-bold text-emerald-600">No immediate risk flags identified for this portfolio.</div>
                   )}
                </div>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientAnalyticsHub;
