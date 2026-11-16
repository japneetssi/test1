import React, { useState } from 'react';
import { useInvestmentCart } from '@/contexts/InvestmentCartContext';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Crown, CheckCircle2, ArrowRight } from 'lucide-react';

export const AIFPMSDetailView = ({ product, history }: { product: any, history: any[] }) => {
    const { addToCart } = useInvestmentCart();
    const { toast } = useToast();
    const [timeframe, setTimeframe] = useState<string>('1Y');

    const getFilteredHistory = () => {
        if (!history.length || timeframe === 'ALL') return history;
        const now = new Date();
        const cutoff = new Date();
        if (timeframe === '1M') cutoff.setMonth(now.getMonth() - 1);
        else if (timeframe === '6M') cutoff.setMonth(now.getMonth() - 6);
        else if (timeframe === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
        else if (timeframe === '3Y') cutoff.setFullYear(now.getFullYear() - 3);
        else if (timeframe === '5Y') cutoff.setFullYear(now.getFullYear() - 5);
        
        return history.filter(h => new Date(h.date) >= cutoff);
    };

    const isAIF = product.category === 'AIF';
    const minInvestment = isAIF ? 10000000 : 5000000; // AIF usually 1Cr, PMS 50L

    const handleInvest = () => {
        addToCart({
            id: product.id,
            name: product.name,
            amc: product.fundHouse || product.amc || 'Asset Management',
            nav: product.stats?.nav || product.nav || minInvestment
        });
        toast({ title: "Added to Interest", description: `You have expressed interest in ${product.name}. Our RM will contact you.` });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-slate-900 to-[#1a365d] rounded-2xl shadow-lg border border-slate-800 p-6 md:p-8 mb-6 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-bl-full -z-10 opacity-5"></div>
                <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                {product.category || 'PMS / AIF'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
                            {product.name}
                        </h1>
                        <p className="text-slate-300 font-medium">{product.fundHouse || product.amc || 'Premium Asset Management'}</p>
                    </div>

                    <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                        <p className="text-sm text-slate-400 mb-1">Minimum Investment</p>
                        <p className="text-3xl font-bold text-white tracking-tight flex items-end gap-1">
                            {product.nav !== undefined ? `₹${product.nav.toLocaleString('en-IN')}` : 'N/A'} <span className="text-sm font-normal text-slate-400 mb-1">NAV</span>
                        </p>
                        <p className={`font-medium flex items-center justify-start md:justify-end gap-1 ${parseFloat(product.cagr3y || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {parseFloat(product.cagr3y || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {product.cagr3y !== undefined ? `${product.cagr3y}%` : 'N/A'} <span className="text-slate-400 text-xs ml-1 font-normal">3Y CAGR</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Left Column (Chart & Details) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Historical NAV Chart */}
                    {history.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-gray-900">Strategy Performance</h2>
                                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                                    {['1M', '6M', '1Y', '3Y', '5Y', 'ALL'].map(tf => (
                                        <button
                                            key={tf}
                                            onClick={() => setTimeframe(tf)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                timeframe === tf 
                                                ? 'bg-white text-[#1a365d] shadow-sm' 
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            {tf}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={getFilteredHistory()} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1a365d" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#1a365d" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                                            tickFormatter={(val) => {
                                                const d = new Date(val);
                                                return `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().substring(-2)}`;
                                            }}
                                            minTickGap={30}
                                        />
                                        <YAxis 
                                            domain={['auto', 'auto']} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                                            tickFormatter={(val) => `₹${val}`}
                                            width={60}
                                        />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: number) => [`₹${value.toFixed(2)}`, 'NAV']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#1a365d" 
                                            strokeWidth={2}
                                            fillOpacity={1} 
                                            fill="url(#colorNav)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Features List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Investment Strategy</h2>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            {product.description || `This high-conviction ${product.category} strategy aims to deliver superior risk-adjusted returns by investing in a concentrated portfolio of thoroughly researched companies. It targets long-term capital appreciation across market cycles.`}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {product.features && product.features.length > 0 ? (
                                product.features.map((feature: string, idx: number) => (
                                    <FeatureItem key={idx} text={feature} />
                                ))
                            ) : (
                                <>
                                    <FeatureItem text="Concentrated Portfolio (15-20 Stocks)" />
                                    <FeatureItem text="Active Management by Experts" />
                                    <FeatureItem text="Direct interaction with Fund Manager" />
                                    <FeatureItem text="Transparent Holdings & Fees" />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (Metrics & Action) */}
                <div className="space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Strategy Details</h2>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <span className="text-gray-500 font-medium text-sm">3Y CAGR</span>
                                <span className={`font-bold flex items-center gap-1 ${parseFloat(product.cagr3y || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {parseFloat(product.cagr3y || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />} {product.cagr3y !== undefined ? `${product.cagr3y}%` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <span className="text-gray-500 font-medium text-sm">Benchmark</span>
                                <span className="font-bold text-gray-900">{product.benchmark || 'BSE 500 TRI'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <span className="text-gray-500 font-medium text-sm">AUM</span>
                                <span className="font-bold text-gray-900">{product.aum || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <span className="text-gray-500 font-medium text-sm">Management Fee</span>
                                <span className="font-bold text-gray-900">{product.managementFee || '2.5% p.a.'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <span className="text-gray-500 font-medium text-sm">Performance Fee</span>
                                <span className="font-bold text-gray-900">{product.performanceFee || '20% above 10% hurdle'}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleInvest}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-slate-200"
                        >
                            Express Interest <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4">
                            Available for HNI & Institutional Investors only.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ text }: { text: string }) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-800 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
        </div>
        <p className="text-gray-700 font-medium text-sm">{text}</p>
    </div>
);
