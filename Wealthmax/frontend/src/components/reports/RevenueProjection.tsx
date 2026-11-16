import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Database, Shield, HeartPulse, PieChart, Landmark, FileText, Briefcase, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

type ProductInput = {
  id: string;
  name: string;
  type: 'monthly' | 'yearly';
  count: number;
  amount: number;
  icon: React.ElementType;
  color: string;
};

const INITIAL_INPUTS: ProductInput[] = [
  { id: 'mf_sip', name: 'MF SIPs', type: 'monthly', count: 1, amount: 20000, icon: TrendingUp, color: '#f97316' },
  { id: 'mf_lumpsum', name: 'MF Lumpsum', type: 'monthly', count: 0, amount: 50000, icon: Database, color: '#fba75f' },
  { id: 'fd_bonds', name: 'FD/Bonds', type: 'monthly', count: 0, amount: 20000, icon: Landmark, color: '#2563eb' },
  { id: 'ncd', name: 'NCD', type: 'monthly', count: 0, amount: 15000, icon: FileText, color: '#b45309' },
  { id: 'health_ins', name: 'Health Insurance', type: 'monthly', count: 1, amount: 25000, icon: HeartPulse, color: '#fcd34d' },
  { id: 'life_ins', name: 'Life Insurance', type: 'monthly', count: 1, amount: 12000, icon: Shield, color: '#06b6d4' },
  { id: 'pms', name: 'PMS', type: 'yearly', count: 0, amount: 5000000, icon: PieChart, color: '#84cc16' },
  { id: 'aif', name: 'AIF', type: 'yearly', count: 0, amount: 10000000, icon: Briefcase, color: '#8b5cf6' },
];

const COMMISSION_RATES = {
  mf_trail: 0.01, // 1% per annum
  fd_bonds: 0.015, // 1.5% upfront
  ncd: 0.015, // 1.5% upfront
  equity: 0.015,
  emergency_fund: 0.015,
  liquid_funds: 0.015,
  health_ins: 0.15, // 15% upfront
  life_ins: 0.25, // 25% upfront
  pms: 0.02, // 2% upfront
  aif: 0.02 // 2% upfront
};

const formatINR = (val: number) => {
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
  return `${(val / 1000).toFixed(0)} K`;
};

interface RevenueProjectionProps {
  onScoreChange?: (score: number) => void;
}

export default function RevenueProjection({ onScoreChange }: RevenueProjectionProps) {
  const { user } = useAuth();
  const isUserRole = user?.role === 'user';

  const [years, setYears] = useState(3);
  const [growthRate, setGrowthRate] = useState(25);
  const [annualIncome, setAnnualIncome] = useState(1200000);

  const getProjectedScore = (item: ProductInput) => {
    let score = 0;
    const totalAmount = (item.id === 'health_ins' || item.id === 'life_ins') ? item.amount : item.amount * item.count;
    if (totalAmount === 0 && item.count === 0) return 0;

    switch (item.id) {
      case 'mf_sip':
        score = Math.floor(totalAmount / 3000);
        break;
      case 'mf_lumpsum':
        score = Math.floor(totalAmount / 10000);
        break;
      case 'equity':
        score = Math.floor(totalAmount / 100000);
        break;
      case 'emergency_fund':
        score = Math.floor(totalAmount / 10000);
        break;
      case 'pms':
      case 'aif':
        score = item.count * 10;
        break;
      case 'health_ins': {
        let recommendedBaseCover = 0;
        if (annualIncome <= 750000) {
          recommendedBaseCover = 1200000;
        } else if (annualIncome <= 2000000) {
          recommendedBaseCover = 2500000;
        } else if (annualIncome <= 3000000) {
          recommendedBaseCover = 4000000;
        } else {
          recommendedBaseCover = Math.min(annualIncome * 2, 50000000);
        }

        if (totalAmount < recommendedBaseCover) {
          const shortfallPercentage = (recommendedBaseCover - totalAmount) / recommendedBaseCover;
          score = Math.round(5 - (shortfallPercentage * 10));
        } else if (totalAmount === recommendedBaseCover) {
          score = 5;
        } else {
          const excessPercentage = (totalAmount - recommendedBaseCover) / recommendedBaseCover;
          score = Math.round(5 - (excessPercentage * 10));
        }
        break;
      }
      case 'life_ins': {
        const recommendedBaseCover = (annualIncome || 1) * 20;

        if (totalAmount < recommendedBaseCover) {
          const shortfallPercentage = (recommendedBaseCover - totalAmount) / recommendedBaseCover;
          score = Math.round(5 - (shortfallPercentage * 10));
        } else if (totalAmount === recommendedBaseCover) {
          score = 5;
        } else {
          const excessPercentage = (totalAmount - recommendedBaseCover) / recommendedBaseCover;
          score = Math.round(5 - (excessPercentage * 10));
        }
        break;
      }
      case 'fd_bonds':
      case 'ncd':
      case 'liquid_funds':
        // For FD Based on the Projected Score
        score = Math.floor(totalAmount / 10000);
        break;
      default:
        score = Math.floor(totalAmount / 10000);
    }
    return score;
  };
  const getUserInputs = () => [
    { id: 'mf_sip', name: 'MF SIPs', type: 'monthly', count: 1, amount: 1000, icon: TrendingUp, color: '#f97316' },
    { id: 'mf_lumpsum', name: 'MF Lumpsum', type: 'monthly', count: 1, amount: 5000, icon: Database, color: '#fba75f' },
    { id: 'equity', name: 'Equity', type: 'monthly', count: 1, amount: 10000, icon: Landmark, color: '#2563eb' },
    { id: 'emergency_fund', name: 'Emergency Fund', type: 'monthly', count: 1, amount: 100000, icon: FileText, color: '#b45309' },
    { id: 'liquid_funds', name: 'Liquid Funds', type: 'monthly', count: 1, amount: 5000, icon: Database, color: '#6366f1' },
    { id: 'health_ins', name: 'Health Insurance', type: 'monthly', count: 1, amount: 25000, icon: HeartPulse, color: '#fcd34d' },
    { id: 'life_ins', name: 'Life Insurance', type: 'monthly', count: 1, amount: 12000, icon: Shield, color: '#06b6d4' },
    { id: 'pms', name: 'PMS', type: 'yearly', count: 1, amount: 5000000, icon: PieChart, color: '#84cc16' },
    { id: 'aif', name: 'AIF', type: 'yearly', count: 1, amount: 10000000, icon: Briefcase, color: '#8b5cf6' },
  ];

  const [inputs, setInputs] = useState<ProductInput[]>(() => 
    isUserRole ? getUserInputs() : INITIAL_INPUTS
  );

  useEffect(() => {
    setInputs(isUserRole ? getUserInputs() : INITIAL_INPUTS);
    
    // Fetch profile to get gross_income
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile');
        if (data?.data) {
          if (data.data.gross_income) {
            setAnnualIncome(Number(data.data.gross_income));
          }
          if (data.data.health_insurance_cover) {
            setInputs(prev => prev.map(item => 
              item.id === 'health_ins' 
                ? { ...item, amount: Number(data.data.health_insurance_cover) } 
                : item
            ));
          }
          if (data.data.life_insurance_cover) {
            setInputs(prev => prev.map(item => 
              item.id === 'life_ins' 
                ? { ...item, amount: Number(data.data.life_insurance_cover) } 
                : item
            ));
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    if (isUserRole) {
      fetchProfile();
    }
  }, [isUserRole]);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    import('html2pdf.js').then((html2pdfModule) => {
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const opt = {
        margin: [5, 5, 5, 5],
        filename: 'Financial_Health_Score_Projections.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: 1400 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      html2pdf().set(opt).from(reportRef.current).save().then(() => {
        setIsDownloading(false);
      });
    }).catch(err => {
      console.error('Failed to load html2pdf.js', err);
      setIsDownloading(false);
    });
  };

  const updateInput = (id: string, field: 'count' | 'amount', value: number) => {
    setInputs(prev => prev.map(item => item.id === id ? { ...item, [field]: Math.max(0, value) } : item));
  };

  const totalProjectedScore = useMemo(() => {
    return inputs.reduce((acc, item) => acc + getProjectedScore(item), 0);
  }, [inputs, annualIncome]);

  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(totalProjectedScore);
    }
  }, [totalProjectedScore, onScoreChange]);

  const { chartData, yearlyIncome, yearlyAUM, totalIncome } = useMemo(() => {
    const data = [];
    let cumulativeMFAUM = 0;

    let currentInputs = inputs.map(i => ({ ...i }));

    const yearlyIncomeData: number[] = new Array(years).fill(0);
    const yearlyAUMData: number[] = new Array(years).fill(0);

    const startDate = new Date();

    for (let year = 1; year <= years; year++) {
      if (year > 1) {
        // Increase count by growth rate for each new year
        currentInputs = currentInputs.map(item => ({
          ...item,
          count: item.count * (1 + growthRate / 100)
        }));
      }

      for (let month = 1; month <= 12; month++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + (year - 1) * 12 + month - 1);
        const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        let mfRevenue = 0;
        let fdRevenue = 0;
        let ncdRevenue = 0;
        let healthRevenue = 0;
        let lifeRevenue = 0;
        let pmsRevenue = 0;
        let aifRevenue = 0;

        // Process monthly items
        const sip = currentInputs.find(i => i.id === 'mf_sip')!;
        const lumpsum = currentInputs.find(i => i.id === 'mf_lumpsum')!;
        const fd = currentInputs.find(i => i.id === 'fd_bonds');
        const ncd = currentInputs.find(i => i.id === 'ncd');
        const equity = currentInputs.find(i => i.id === 'equity');
        const emergency_fund = currentInputs.find(i => i.id === 'emergency_fund');
        const liquid_funds = currentInputs.find(i => i.id === 'liquid_funds');
        const health = currentInputs.find(i => i.id === 'health_ins')!;
        const life = currentInputs.find(i => i.id === 'life_ins')!;

        // Add to AUM
        cumulativeMFAUM += sip.count * sip.amount;
        cumulativeMFAUM += lumpsum.count * lumpsum.amount;

        // Trail commission on total AUM (1% per annum / 12)
        mfRevenue = cumulativeMFAUM * (COMMISSION_RATES.mf_trail / 12);

        // Upfront commissions
        fdRevenue = fd ? fd.count * fd.amount * COMMISSION_RATES.fd_bonds : 0;
        ncdRevenue = ncd ? ncd.count * ncd.amount * COMMISSION_RATES.ncd : 0;
        const equityRevenue = equity ? equity.count * equity.amount * COMMISSION_RATES.equity : 0;
        const emergencyFundRevenue = emergency_fund ? emergency_fund.count * emergency_fund.amount * COMMISSION_RATES.emergency_fund : 0;
        const liquidFundsRevenue = liquid_funds ? liquid_funds.count * liquid_funds.amount * COMMISSION_RATES.liquid_funds : 0;
        healthRevenue = 0; // Excluded from Total Income Projection
        lifeRevenue = 0; // Excluded from Total Income Projection

        // Process yearly items (assume revenue books in first month of the year or evenly distributed? 
        // We will evenly distribute yearly count across 12 months for smoother charts)
        const pms = currentInputs.find(i => i.id === 'pms')!;
        const aif = currentInputs.find(i => i.id === 'aif')!;

        pmsRevenue = (pms.count / 12) * pms.amount * COMMISSION_RATES.pms;
        aifRevenue = (aif.count / 12) * aif.amount * COMMISSION_RATES.aif;

        const totalMonthRevenue = mfRevenue + fdRevenue + ncdRevenue + healthRevenue + lifeRevenue + pmsRevenue + aifRevenue + equityRevenue + emergencyFundRevenue + liquidFundsRevenue;

        yearlyIncomeData[year - 1] += totalMonthRevenue;

        data.push({
          month: monthLabel,
          'Mutual Funds': Math.round(mfRevenue),
          'FD/Bonds': Math.round(fdRevenue),
          'NCD': Math.round(ncdRevenue),
          'Equity': Math.round(equityRevenue),
          'Emergency Fund': Math.round(emergencyFundRevenue),
          'Liquid Funds': Math.round(liquidFundsRevenue),
          'Health Insurance': Math.round(healthRevenue),
          'Life Insurance': Math.round(lifeRevenue),
          'PMS': Math.round(pmsRevenue),
          'AIF': Math.round(aifRevenue),
          total: totalMonthRevenue
        });
      }

      yearlyAUMData[year - 1] = cumulativeMFAUM;
    }

    const total = yearlyIncomeData.reduce((a, b) => a + b, 0);

    return { chartData: data, yearlyIncome: yearlyIncomeData, yearlyAUM: yearlyAUMData, totalIncome: total };
  }, [years, growthRate, inputs]);

  return (
    <div className="w-full font-sans">
      <div className="w-full mx-auto pb-12" ref={reportRef}>
        <div className="space-y-6 md:space-y-8 print:p-8">

          {/* Header Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-100 print:hidden">
            <div className="flex flex-wrap items-center gap-3 text-lg font-medium text-slate-800">
              <span>I want to see my revenue potential for</span>
              <Select value={years.toString()} onValueChange={v => setYears(parseInt(v))}>
                <SelectTrigger className="w-32 bg-white font-semibold shadow-sm border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 10].map(y => <SelectItem key={y} value={y.toString()}>{y} Years</SelectItem>)}
                </SelectContent>
              </Select>
              <span>and I am aiming to increase my business every year by</span>
              <Select value={growthRate.toString()} onValueChange={v => setGrowthRate(parseInt(v))}>
                <SelectTrigger className="w-24 bg-white font-semibold shadow-sm border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 10, 15, 20, 25, 30, 40, 50].map(r => <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>)}
                </SelectContent>
              </Select>
              <span>with an annual income of</span>
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white px-2 shadow-sm h-10">
                <span className="text-slate-500 font-semibold">₹</span>
                <input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(parseInt(e.target.value) || 0)}
                  className="w-24 h-full focus:outline-none font-semibold text-slate-800 bg-transparent text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-10 px-5 rounded-lg bg-emerald-600 text-white font-semibold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isDownloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>

          {/* Input Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
            {inputs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: item.color, opacity: 0.8 }} />

                  <div className="flex items-center gap-2 mb-2 mt-1">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-[13px] text-slate-800 leading-tight">{item.name}</h3>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
                    {item.id === 'health_ins' || item.id === 'life_ins' ? 'Modify Cover' : `per ${item.type === 'monthly' ? 'month' : 'year'}`}
                  </p>

                  {item.id === 'health_ins' || item.id === 'life_ins' ? (
                    <div className="flex items-center justify-between w-full border border-slate-200 rounded-lg overflow-hidden mb-4 shadow-sm group-hover:border-slate-300 transition-colors">
                      <button onClick={() => updateInput(item.id, 'amount', Math.max(0, item.amount - 50000))} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border-r border-slate-200 transition-colors">-</button>
                      <span className="flex-1 font-bold text-sm text-slate-800">Adjust</span>
                      <button onClick={() => updateInput(item.id, 'amount', item.amount + 50000)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border-l border-slate-200 transition-colors">+</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full border border-slate-200 rounded-lg overflow-hidden mb-4 shadow-sm group-hover:border-slate-300 transition-colors">
                      <button onClick={() => updateInput(item.id, 'count', Math.max(0, item.count - 1))} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border-r border-slate-200 transition-colors">-</button>
                      <span className="flex-1 font-bold text-sm text-slate-800">{typeof item.count === 'number' ? Math.round(item.count * 10) / 10 : item.count}</span>
                      <button onClick={() => updateInput(item.id, 'count', item.count + 1)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border-l border-slate-200 transition-colors">+</button>
                    </div>
                  )}

                  <p className="text-[10px] font-medium text-slate-500 mb-1.5 w-full text-left">
                    {item.id === 'health_ins' || item.id === 'life_ins' ? 'Insurance Coverage' : `Each ${item.name.split(' ')[1] || item.name}`} (₹)
                  </p>
                  <div className="w-full relative">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateInput(item.id, 'amount', parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg h-10 px-3 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm print:hidden"
                    />
                    <div className="hidden print:flex w-full border border-slate-200 rounded-lg h-10 items-center justify-center text-sm font-semibold shadow-sm bg-white text-slate-800">
                      {item.amount}
                    </div>
                  </div>
                  
                  {(() => {
                    const score = getProjectedScore(item);
                    const isNegative = score < 0;
                    return (
                      <div className={`mt-3 w-full rounded-md p-1.5 flex items-center justify-center gap-1.5 border ${isNegative ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <HeartPulse className={`w-3.5 h-3.5 ${isNegative ? 'text-red-500' : 'text-emerald-500'}`} />
                        <span className={`text-xs font-bold ${isNegative ? 'text-red-700' : 'text-emerald-700'}`}>
                          {score >= 0 ? '+' : ''}{score} Projected Score
                        </span>
                      </div>
                    );
                  })()}
                </motion.div>
              )
            })}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-10">

            {/* Chart Area */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3 bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
            >
              <h2 className="text-xl font-extrabold text-slate-800 mb-8 flex items-center gap-3">
                Financial Health Score Projections
                <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[11px] font-bold">i</div>
              </h2>
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(val) => val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val.toLocaleString()} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 500, fontSize: '13px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '30px' }} iconType="circle" />
                    <Bar dataKey="Mutual Funds" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                    {!isUserRole && <Bar dataKey="FD/Bonds" stackId="a" fill="#2563eb" />}
                    {!isUserRole && <Bar dataKey="NCD" stackId="a" fill="#b45309" />}
                    {isUserRole && <Bar dataKey="Equity" stackId="a" fill="#2563eb" />}
                    {isUserRole && <Bar dataKey="Emergency Fund" stackId="a" fill="#b45309" />}
                    {isUserRole && <Bar dataKey="Liquid Funds" stackId="a" fill="#6366f1" />}
                    <Bar dataKey="Life Insurance" stackId="a" fill="#06b6d4" />
                    <Bar dataKey="Health Insurance" stackId="a" fill="#fcd34d" />
                    <Bar dataKey="PMS" stackId="a" fill="#84cc16" />
                    <Bar dataKey="AIF" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            {/* Right Sidebar */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-7 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <h3 className="text-sm font-semibold text-emerald-50 mb-1 relative z-10">Total Income Projection</h3>
                <p className="text-4xl font-extrabold text-white mb-6 tracking-tight relative z-10">{formatINR(totalIncome)}</p>

                <div className="space-y-3 relative z-10">
                  {yearlyIncome.map((inc, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-emerald-400/30 pb-3 last:border-0 last:pb-0">
                      <span className="text-emerald-50">{i + 1}<sup>{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}</sup> year</span>
                      <span className="font-bold text-white text-base">{formatINR(inc)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-3xl p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
              >
                <h3 className="text-sm font-semibold text-slate-500 mb-1">Mutual Fund AUM</h3>
                <p className="text-4xl font-extrabold text-slate-800 mb-6 tracking-tight">{formatINR(yearlyAUM[yearlyAUM.length - 1] || 0)}</p>

                <div className="space-y-3">
                  {yearlyAUM.map((aum, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <span className="text-slate-500">{i + 1}<sup>{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}</sup> year end</span>
                      <span className="font-bold text-slate-800 text-base">{formatINR(aum)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
