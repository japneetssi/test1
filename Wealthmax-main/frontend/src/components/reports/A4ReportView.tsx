import React, { useState, useEffect, useRef } from 'react';
import { Download, Loader2, Phone, User, Target, ShieldCheck, HeartPulse, PieChart, Briefcase, FileSignature, AlertTriangle, CheckCircle2, Share2, TrendingUp, Landmark, Wallet, Building2, Coins, Gem } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateSmartReport } from '@/services/reportService';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

import { FinancialTree } from '@/components/smart-report/FinancialTree';
import { FinancialMatrix } from '@/components/smart-report/FinancialMatrix';
import { AttentionDetails } from '@/components/smart-report/AttentionDetails';
import { PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface A4ReportViewProps {
  data: any; 
  generating?: boolean;
}

const A4ReportView = ({ data, generating }: A4ReportViewProps) => {
  const { user } = useAuth();
  
  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLive = async () => {
      setIsLoading(true);
      if (user?.id) {
        try {
          const res = await generateSmartReport();
          setLiveMetrics(res);
        } catch (e) {
          console.error("Failed fetching live report data", e);
        }
      }
      setIsLoading(false);
    };
    fetchLive();
  }, [user]);

  const clientName = liveMetrics?.global?.clientName || user?.user_metadata?.full_name || data?.clientName || 'Unregistered Profile';
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const globalMetrics = liveMetrics?.global;
  const parameters = liveMetrics?.parameters || data?.parameters || [];
  const rawProfile = liveMetrics?.rawProfile || data?.rawProfile || {};

  const handleDownload = () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    
    import('html2pdf.js').then((html2pdfModule) => {
        const html2pdf = html2pdfModule.default || html2pdfModule;
        const opt = {
            margin: [0, 0, 0, 0],
            filename: `${clientName.replace(/\s+/g, '_')}_Financial_Smart_Report.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 1024 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
            pagebreak: { mode: ['css', 'legacy'], avoid: '.break-inside-avoid' }
        };
        html2pdf().set(opt).from(reportRef.current).save().then(() => {
            setIsDownloading(false);
        });
    }).catch(err => {
        console.error('Failed to load html2pdf.js', err);
        setIsDownloading(false);
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: 'WealthMax Financial Smart Report',
      text: 'Check out this Financial Advisory Report.',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Report link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const fc = (val: number) => `₹${(val || 0).toLocaleString('en-IN')}`;

  // Data for sections
  const age = rawProfile.age || 'Not Specified';
  const occupation = rawProfile.occupation || 'Not Specified';
  const maritalStatus = rawProfile.marital_status || 'Not Specified';
  const riskProfile = rawProfile.risk_profile || 'Moderate to Aggressive';
  const goals = rawProfile.modularData?.goals || [];

  const getRiskDetails = (profileStr: string) => {
    const p = profileStr?.toLowerCase() || '';
    if (p.includes('conservative') || p.includes('low')) {
      return {
        score: 25,
        title: 'Conservative',
        description: 'You prioritize capital preservation over high returns. You prefer stable, predictable growth and are less willing to accept significant market volatility.',
        allocation: 'Suggested: 70-80% Debt / 20-30% Equity',
        color: 'bg-emerald-500'
      };
    }
    if (p.includes('aggressive') && p.includes('moderate')) {
      return {
        score: 75,
        title: 'Moderately Aggressive',
        description: 'You seek higher growth and are willing to accept moderate to high market volatility. You have a longer time horizon to ride out market fluctuations.',
        allocation: 'Suggested: 30% Debt / 70% Equity',
        color: 'bg-amber-500'
      };
    }
    if (p.includes('aggressive') || p.includes('high')) {
      return {
        score: 90,
        title: 'Aggressive',
        description: 'You are focused on maximum capital appreciation and are comfortable with high market volatility and potential short-term losses for long-term gains.',
        allocation: 'Suggested: 10-20% Debt / 80-90% Equity',
        color: 'bg-red-500'
      };
    }
    // Default to Moderate
    return {
      score: 50,
      title: 'Moderate',
      description: 'You seek a balance between growth and income. You are willing to accept some market volatility but also want to protect a portion of your capital.',
      allocation: 'Suggested: 50% Debt / 50% Equity',
      color: 'bg-blue-500'
    };
  };

  const riskDetails = getRiskDetails(riskProfile);

  const insurances = rawProfile.modularData?.safetyNet?.insurance || [];
  const lifeInsurance = insurances.filter((i: any) => i.type?.toLowerCase().includes('life')).reduce((sum: number, i: any) => sum + Number(i.amount||0), 0);
  const requiredLife = (globalMetrics?.totalIncome || 0) * 10; 
  
  const healthInsurance = insurances.filter((i: any) => i.type?.toLowerCase().includes('health')).reduce((sum: number, i: any) => sum + Number(i.amount||0), 0);
  const requiredHealth = 1000000; 

  const assets = rawProfile.modularData?.assets || [];
  const totalAssets = globalMetrics?.totalAssets || 0;
  
  let equities = 0, fixedIncome = 0, cash = 0, realEstate = 0, commodities = 0, alternatives = 0;
  assets.forEach((a: any) => {
    const t = a.type || '';
    const amt = Number(a.amount || 0);
    
    if (['Individual stocks', 'Mutual funds', 'ETFs', 'Index funds'].includes(t)) equities += amt;
    else if (['Individual bonds', 'Annuities'].includes(t)) fixedIncome += amt;
    else if (['Certificates of Deposit (CDs)', 'Cash & Cash Equivalents'].includes(t)) cash += amt;
    else if (['Real Estate', 'REITs'].includes(t)) realEstate += amt;
    else if (['Commodities'].includes(t)) commodities += amt;
    else if (['Options and futures', 'Alternatives'].includes(t)) alternatives += amt;
    else {
      const lower = t.toLowerCase();
      if (lower.includes('equity') || lower.includes('stock') || lower.includes('mutual') || lower.includes('mf')) equities += amt;
      else if (lower.includes('fd') || lower.includes('bond') || lower.includes('pf') || lower.includes('debt')) fixedIncome += amt;
      else if (lower.includes('estate') || lower.includes('property') || lower.includes('house')) realEstate += amt;
      else if (lower.includes('gold')) commodities += amt;
      else if (lower.includes('bank balance') || lower.includes('cash')) cash += amt;
      else alternatives += amt;
    }
  });
  
  const pieData = [
    { name: 'Equities', value: equities, color: '#3b82f6' },
    { name: 'Fixed Income', value: fixedIncome, color: '#10b981' },
    { name: 'Cash', value: cash, color: '#64748b' },
    { name: 'Real Estate', value: realEstate, color: '#f59e0b' },
    { name: 'Commodities', value: commodities, color: '#eab308' },
    { name: 'Alternatives', value: alternatives, color: '#a855f7' },
  ].filter(d => d.value > 0);

  const SectionHeader = ({ icon: Icon, title, num }: { icon: any, title: string, num: string }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-slate-200/60 pb-4">
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 shadow-sm">
        <Icon className="h-5 w-5 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">
        <span className="text-emerald-600 mr-1">{num}.</span> {title}
      </h2>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-500 space-y-4 w-full bg-slate-50 rounded-2xl min-h-[500px]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        <h3 className="text-xl font-bold">Aggregating Financial Intelligence...</h3>
        <p className="text-sm">Calculating core parameter matrix across your profile.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-100 py-8 font-sans print:py-0 print:bg-white relative">
      
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white !important;
            }
            nav, header, aside, .print-hidden {
              display: none !important;
            }
            main {
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Override framer-motion transforms for printing */
            * {
              transform: none !important;
              opacity: 1 !important;
              transition: none !important;
              animation: none !important;
            }
          }
          .html2pdf__page-break {
            height: 0;
            page-break-before: always;
            clear: both;
          }
        `}
      </style>

      {/* Header with Download Button outside the actual PDF */}
      <div className="w-full max-w-[210mm] mx-auto mb-6 flex justify-between items-center px-4 print:hidden">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Report Preview</h2>
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md font-bold flex items-center gap-2 transition-all"
          >
            <Share2 className="h-5 w-5" />
            Share
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading || generating}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-emerald-500/25 font-bold flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            {isDownloading ? "Generating PDF..." : "Download Full PDF"}
          </button>
        </div>
      </div>

      <div className="w-[210mm] mx-auto shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-200 rounded-sm print:shadow-none print:border-none">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          id="pdf-export-container"
          ref={reportRef}
          className="w-full min-h-[297mm] bg-white text-black overflow-hidden box-border relative block pb-8"
        >
        {/* PDF Header Block (Glassmorphic & Premium) */}
        <header className="relative bg-slate-900 overflow-hidden p-10 print:p-10 flex flex-row justify-between items-center gap-8 break-inside-avoid">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>
          
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse print:animate-none"></span> Live Analysis
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase">WealthMax</h1>
            <p className="text-emerald-400 font-medium text-lg tracking-wide">
              Financial Smart Report
            </p>
          </div>
          
          <div className="z-10 text-right bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 min-w-[240px] shadow-2xl">
             <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-black mb-1.5">Prepared Exclusively For</p>
             <div className="text-2xl font-black text-white tracking-tight">{clientName}</div>
             <p className="text-xs text-slate-400 mt-3 font-medium flex justify-between items-center border-t border-white/10 pt-3">
                <span>Date:</span> <span className="text-white">{reportDate}</span>
             </p>
          </div>
        </header>

        <div className="p-10 print:p-10 bg-slate-50/30">
          
          {/* SECTION 1: Client Profile */}
          <motion.section variants={itemVariants} className="mb-14 break-inside-avoid">
            <SectionHeader icon={User} title="Client Profile" num="1" />
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Age', value: age },
                { label: 'Occupation', value: occupation },
                { label: 'Marital Status', value: maritalStatus }
              ].map((item, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center break-inside-avoid">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
                  <p className="text-xl font-black tracking-tight text-slate-800">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm break-inside-avoid">
              <div className="flex flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">Risk Profile & Allocation Strategy</p>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{riskDetails.title}</h3>
                  <p className="text-slate-500 text-sm font-medium mb-3">{riskDetails.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600">
                    <PieChart className="w-3.5 h-3.5 text-slate-400" />
                    {riskDetails.allocation}
                  </div>
                </div>
                
                <div className="w-64 shrink-0 mt-4 md:mt-0">
                   <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                     <span>Conservative</span>
                     <span>Aggressive</span>
                   </div>
                   <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                     <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500 opacity-80"></div>
                   </div>
                   <div className="relative w-full h-4 -mt-3.5">
                     <div 
                       className="absolute top-0 w-4 h-4 bg-white border-2 border-slate-800 rounded-full shadow-md transform -translate-x-1/2 transition-all duration-1000 print:!transition-none"
                       style={{ left: `${riskDetails.score}%` }}
                     ></div>
                   </div>
                   <div className="text-center mt-3">
                     <span className={`text-[10px] font-black px-2.5 py-1 rounded-md text-white shadow-sm uppercase tracking-widest ${riskDetails.color}`}>
                       Risk Level: {riskDetails.score}/100
                     </span>
                   </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* SECTIONS 2 & 3: Cashflow & Net Worth using FinancialMatrix */}
          {globalMetrics && (
            <motion.section variants={itemVariants} className="mb-14">
              <SectionHeader icon={Briefcase} title="Monthly Cashflow & Net Worth" num="2 & 3" />
              <div className="bg-white p-2 rounded-3xl border border-slate-200/60 shadow-sm">
                <FinancialMatrix globalMetrics={globalMetrics} />
              </div>
            </motion.section>
          )}

          {/* SECTION 4: Insurance Protection Analysis */}
          <motion.section variants={itemVariants} className="mb-14 pt-4 break-inside-avoid">
            <SectionHeader icon={ShieldCheck} title="Insurance Protection Analysis" num="4" />
            <div className="grid grid-cols-2 gap-6">
              
              {/* Life Insurance Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6 text-lg tracking-tight">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-500"><HeartPulse className="h-4 w-4" /></div>
                  Life Insurance
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actual Cover</span>
                    <span className="font-black text-slate-800 text-lg">{fc(lifeInsurance)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required (10x Income)</span>
                    <span className="font-black text-slate-800 text-lg">{fc(requiredLife)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner mt-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${lifeInsurance >= requiredLife ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-red-400 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`} 
                      style={{ width: `${Math.min(100, (lifeInsurance / (requiredLife || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="pt-2">
                    {lifeInsurance >= requiredLife 
                      ? <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 className="h-3.5 w-3.5" /> Adequately Covered</div> 
                      : <div className="inline-flex items-center gap-1.5 text-xs font-black text-red-500 bg-red-50 px-2 py-1 rounded-md"><AlertTriangle className="h-3.5 w-3.5" /> Underinsured Critical Risk</div>
                    }
                  </div>
                </div>
              </div>

              {/* Health Insurance Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between break-inside-avoid relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
                <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6 text-lg tracking-tight">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500"><ShieldCheck className="h-4 w-4" /></div>
                  Health Insurance
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actual Cover</span>
                    <span className="font-black text-slate-800 text-lg">{fc(healthInsurance)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Base Cover</span>
                    <span className="font-black text-slate-800 text-lg">{fc(requiredHealth)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner mt-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${healthInsurance >= requiredHealth ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-red-400 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`} 
                      style={{ width: `${Math.min(100, (healthInsurance / requiredHealth) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="pt-2">
                    {healthInsurance >= requiredHealth 
                      ? <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"><CheckCircle2 className="h-3.5 w-3.5" /> Adequately Covered</div> 
                      : <div className="inline-flex items-center gap-1.5 text-xs font-black text-red-500 bg-red-50 px-2 py-1 rounded-md"><AlertTriangle className="h-3.5 w-3.5" /> Underinsured Risk</div>
                    }
                  </div>
                </div>
              </div>

            </div>
          </motion.section>

          {/* SECTION 5: Strategic Asset Allocation */}
          <motion.section variants={itemVariants} className="mb-14 pt-4 break-inside-avoid">
            <SectionHeader icon={PieChart} title="Strategic Asset Allocation & Portfolio Analytics" num="5" />
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
              
              {/* Premium Dashboard Header */}
              <div className="w-full bg-slate-900 rounded-[2rem] p-10 mb-8 relative overflow-hidden shadow-xl flex flex-row items-center justify-between gap-8 break-inside-avoid">
                {/* Decorative Elements (Simplified for PDF stability) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full pointer-events-none transform -translate-x-1/4 translate-y-1/4"></div>
                
                <div className="w-1/2 space-y-5 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-black tracking-widest uppercase shadow-inner backdrop-blur-sm">
                    <PieChart className="w-4 h-4 text-emerald-400" /> Portfolio Composition
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-slate-400 tracking-tight">Total Gross Assets</h3>
                    <p className="text-5xl font-black text-white tracking-tighter drop-shadow-sm">
                      {fc(totalAssets)}
                    </p>
                  </div>
                  <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
                    This represents your complete wealth distribution across all asset classes, giving you a holistic view of your financial standing and diversification strategy.
                  </p>
                </div>
                
                <div className="w-1/2 flex flex-col items-center justify-end relative h-[220px] z-10 pt-6">
                  {totalAssets > 0 ? (
                    <div className="relative flex justify-center w-full">
                       <RechartsPieChart width={340} height={180} style={{ margin: '0 auto' }}>
                         <Pie
                           data={pieData}
                           cx={170}
                           cy={170}
                           startAngle={180}
                           endAngle={0}
                           innerRadius={110}
                           outerRadius={160}
                           paddingAngle={4}
                           dataKey="value"
                           stroke="none"
                           cornerRadius={6}
                           isAnimationActive={false}
                         >
                           {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                       </RechartsPieChart>
                       
                       <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center bg-slate-800 px-6 py-2 rounded-2xl border border-white/10 shadow-lg whitespace-nowrap">
                         <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black block mb-0.5">Total Value</span>
                         <span className="text-white font-black text-xl tracking-tight leading-none">{fc(totalAssets)}</span>
                       </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-64 h-32 bg-white/5 rounded-t-full border-t border-x border-white/10"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Asset Class Cards */}
              <div className="grid grid-cols-3 w-full gap-5">
                {[
                  { label: 'Equities', value: equities, icon: TrendingUp, fromColor: 'from-blue-500', toColor: 'to-indigo-600', shadow: 'shadow-blue-500/20' },
                  { label: 'Fixed Inc.', value: fixedIncome, icon: Landmark, fromColor: 'from-emerald-400', toColor: 'to-emerald-600', shadow: 'shadow-emerald-500/20' },
                  { label: 'Cash', value: cash, icon: Wallet, fromColor: 'from-slate-400', toColor: 'to-slate-600', shadow: 'shadow-slate-500/20' },
                  { label: 'Real Estate', value: realEstate, icon: Building2, fromColor: 'from-amber-400', toColor: 'to-amber-600', shadow: 'shadow-amber-500/20' },
                  { label: 'Commodities', value: commodities, icon: Coins, fromColor: 'from-yellow-400', toColor: 'to-orange-500', shadow: 'shadow-orange-500/20' },
                  { label: 'Alternatives', value: alternatives, icon: Gem, fromColor: 'from-purple-400', toColor: 'to-purple-600', shadow: 'shadow-purple-500/20' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden break-inside-avoid">
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${item.fromColor} ${item.toColor} rounded-bl-full opacity-5 pointer-events-none`}></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${item.fromColor} ${item.toColor} text-white shadow-md ${item.shadow}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Alloc</span>
                        <div className="font-black text-slate-700 text-sm bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                          {totalAssets > 0 ? Math.round((item.value/totalAssets)*100) : 0}%
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="font-black text-slate-800 text-xl tracking-tight leading-tight break-words">
                        {fc(item.value)}
                      </p>
                    </div>
                    
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-5 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${item.fromColor} ${item.toColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${totalAssets > 0 ? Math.round((item.value/totalAssets)*100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </motion.section>

          {/* SECTION 6: Financial Goals Planning */}
          <motion.section variants={itemVariants} className="mb-14 pt-4 break-inside-avoid">
            <SectionHeader icon={Target} title="Financial Goals Planning" num="6" />
            {goals.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {goals.map((g: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Year</p>
                        <p className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-xs">{g.years_away ? new Date().getFullYear() + Number(g.years_away) : 'Not specified'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg tracking-tight mb-3 line-clamp-1">{g.name}</h4>
                      <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Corpus</p>
                        <p className="text-xl font-black text-emerald-600 tracking-tight">{fc(Number(g.target_amount || g.amount))}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center">
                <Target className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No financial goals have been explicitly set in your profile yet.</p>
              </div>
            )}
          </motion.section>

          {/* SECTION 7: Tax Planning & Final Roadmap */}
          <motion.section variants={itemVariants} className="mb-14 pt-4 break-inside-avoid">
            <SectionHeader icon={FileSignature} title="Tax Planning & Final Roadmap" num="7" />
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-8 md:p-10 rounded-3xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
              
              <ul className="space-y-8 relative z-10">
                <li className="flex items-start gap-4">
                  <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="font-medium leading-relaxed">
                    <strong className="text-emerald-300 block mb-1 text-lg tracking-tight">Prioritize Basics Before Tax Harvesting</strong>
                    <p className="text-slate-300 text-base">Prioritize building a liquid emergency fund (6x monthly expenses) and repaying any high-interest debt (like credit cards or personal loans) before locking away capital in illiquid tax-saving investments.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="font-medium leading-relaxed w-full">
                    <strong className="text-emerald-300 block mb-2 text-lg tracking-tight">Maximize Allowable Deductions</strong>
                    <p className="text-slate-300 text-base mb-4">Ensure you are fully utilizing the following sections if opting for the Old Tax Regime:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-emerald-400 font-black text-sm tracking-widest mb-1">SEC 80C</p>
                        <p className="text-white font-bold mb-2">₹1.5 Lakh</p>
                        <p className="text-xs text-slate-400">ELSS Mutual Funds, PPF, and Life Insurance premiums.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-emerald-400 font-black text-sm tracking-widest mb-1">SEC 80CCD(1B)</p>
                        <p className="text-white font-bold mb-2">₹50,000</p>
                        <p className="text-xs text-slate-400">Additional exclusive deduction via National Pension System (NPS).</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-emerald-400 font-black text-sm tracking-widest mb-1">SEC 80D</p>
                        <p className="text-white font-bold mb-2">₹25,000+</p>
                        <p className="text-xs text-slate-400">Health Insurance premiums for self and parents.</p>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/30">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="font-medium leading-relaxed">
                    <strong className="text-emerald-300 block mb-1 text-lg tracking-tight">Annual Review & Step-Up</strong>
                    <p className="text-slate-300 text-base">Conduct a comprehensive portfolio review annually. Crucially, commit to increasing your SIP investments by at least 10% each year (Step-Up SIP) as your income grows to stay aligned with inflation and long-term milestones.</p>
                  </div>
                </li>
              </ul>
            </div>
          </motion.section>

          {/* SECTION 8: Total Financial Picture (The Wealth Tree) */}
          <motion.section variants={itemVariants} className="relative mb-14 pt-4 break-inside-avoid">
            <SectionHeader icon={PieChart} title="Total Financial Picture" num="8" />
            <p className="text-slate-500 mb-8 font-medium bg-slate-100 inline-block px-4 py-2 rounded-lg text-sm">
              A diagnostic Financial Tree Matrix providing a comprehensive view of your 12 core financial parameters.
            </p>
            <div className="transform scale-[0.85] origin-top bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
              <FinancialTree reportData={parameters} />
            </div>
          </motion.section>

          {/* SECTION 9: Diagnostic Deep-Dive */}
          <motion.section variants={itemVariants} className="mb-14 pt-4 break-inside-avoid">
            <SectionHeader icon={Briefcase} title="Diagnostic Deep-Dive" num="9" />
            <p className="text-slate-500 mb-8 font-medium bg-slate-100 inline-block px-4 py-2 rounded-lg text-sm">
              Detailed analysis and strategic action plan for each of the 12 core parameters.
            </p>
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 md:p-6">
              <AttentionDetails reportData={parameters} />
            </div>
          </motion.section>

          {/* SECTION 10: Your Next Steps (Footer / CTA) */}
          <motion.section variants={itemVariants} className="mb-14 break-inside-avoid">
            <div className="relative bg-white border border-emerald-100 p-14 rounded-3xl shadow-[0_20px_60px_-15px_rgba(16,185,129,0.15)] text-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-emerald-400"></div>
              
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 mb-6 shadow-sm border border-emerald-200/50">
                <Target className="h-8 w-8" />
              </div>
              
              <h4 className="text-4xl font-black mb-4 tracking-tight text-slate-800">
                <span className="text-emerald-600 mr-2">10.</span>Your Next Steps
              </h4>
              
              <p className="text-slate-500 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                This diagnostic report highlights the exact structural gaps in your financial foundation. Abstract analysis is meaningless without concrete execution. It is time to bridge the gap. Consult with your financial guide to translate these insights into a highly personalized, actionable wealth management strategy.
              </p>
              
              <div className="flex flex-row justify-center gap-4 print:hidden relative z-10">
                <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black px-10 h-14 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all text-base tracking-wide">
                  <Phone className="w-5 h-5 mr-2" />
                  Schedule Action Consultation
                </Button>
              </div>
            </div>
          </motion.section>

        </div>
        </motion.div>
      </div>
    </div>
  );
};

export default A4ReportView;
