import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { useInvestmentCart } from '@/contexts/InvestmentCartContext';
import { useToast } from '@/hooks/use-toast';

export const MutualFundDetailView = ({ product, history }: { product: any, history: any[] }) => {
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

    const handleInvest = () => {
        addToCart({
            id: product.id,
            name: product.name,
            amc: product.fundHouse || product.amc || 'Unknown AMC',
            nav: product.stats?.nav || product.nav
        });
        toast({ title: "Added to Cart", description: `${product.name} added to your investment bucket.` });
    };

    return (
        <>
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-[#1a365d]/10 text-[#1a365d] px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                                {product.category || 'Mutual Fund'}
                            </span>
                            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                                product.riskLevel === 'Aggressive' ? 'bg-red-100 text-red-700' : 
                                product.riskLevel === 'Conservative' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {product.riskLevel || 'Moderate'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a365d] leading-tight mb-2">
                            {product.name}
                        </h1>
                        <p className="text-gray-500 font-medium">{product.fundHouse || product.amc}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="text-center sm:text-right w-full sm:w-auto">
                            <p className="text-sm text-gray-500 mb-1">Current NAV</p>
                            <p className="text-3xl font-bold text-gray-900">
                                ₹{product.stats?.nav || product.nav || 'N/A'}
                            </p>
                        </div>
                        <button 
                            onClick={handleInvest}
                            className="w-full sm:w-auto bg-[#f37920] hover:bg-[#d96716] text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>

            {/* Historical NAV Chart */}
            {history.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-[#1a365d]">Historical NAV</h2>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
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
                                        return `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().substr(-2)}`;
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

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">3Y CAGR</p>
                    <p className={`text-xl font-extrabold ${parseFloat(product.stats?.cagr3Y || product.cagr3y || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'} flex items-center justify-center gap-1`}>
                        {parseFloat(product.stats?.cagr3Y || product.cagr3y || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {product.stats?.cagr3Y || product.cagr3y ? `${parseFloat(product.stats?.cagr3Y || product.cagr3y).toFixed(2)}%` : 'N/A'}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">AUM (Size)</p>
                    <p className="text-xl font-extrabold text-gray-900">{product.aum || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Min SIP</p>
                    <p className="text-xl font-extrabold text-gray-900">₹{product.minSIP || 500}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Expense Ratio</p>
                    <p className="text-xl font-extrabold text-gray-900">{product.expenseRatio || 'N/A'}</p>
                </div>
            </div>

            {/* About the Fund */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-[#1a365d] mb-4">About {product.name}</h2>
                <div className="prose prose-sm max-w-none text-gray-600">
                    <p className="mb-4">{product.description}</p>
                    {product.fundManager && (
                        <p className="mb-2"><strong className="text-gray-900">Fund Manager:</strong> {product.fundManager}</p>
                    )}
                    {product.exitLoad && (
                        <p><strong className="text-gray-900">Exit Load:</strong> {product.exitLoad}</p>
                    )}
                </div>
            </div>
        </>
    );
};
