import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowRight, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

export const EquityPortfolio = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://wealthmax-og-backend.onrender.com/api/v1/equity-dashboard/portfolio');
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (e) {
                console.error("Failed to fetch portfolio", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse"></div>;
    }

    if (!data) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-[#00458c]" />
                    Your Equity Portfolio
                </h2>
                <button className="text-sm font-medium text-[#00458c] hover:underline flex items-center gap-1">
                    Details <ArrowRight className="h-4 w-4" />
                </button>
            </div>
            
            <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Current Value</p>
                        <h3 className="text-2xl font-bold text-gray-900">₹{data.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Total Returns</p>
                        <div className={`flex items-center gap-1.5 text-lg font-bold ${data.totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.totalReturns >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                            <span>₹{Math.abs(data.totalReturns).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <p className={`text-xs font-medium mt-0.5 ${data.absoluteReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({data.absoluteReturns > 0 ? '+' : ''}{data.absoluteReturns.toFixed(2)}%)
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center mb-6">
                    <div>
                        <p className="text-xs text-gray-500 font-medium">1D Return</p>
                        <p className={`text-sm font-bold ${data.todaysReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.todaysReturns > 0 ? '+' : ''}₹{data.todaysReturns.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">XIRR</p>
                        <p className="text-sm font-bold text-gray-900">{data.xirr.toFixed(1)}%</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Invested</p>
                        <p className="text-sm font-bold text-gray-900">₹{(data.investedAmount/100000).toFixed(2)}L</p>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-gray-800">Top Holdings</h4>
                    </div>
                    <div className="space-y-3">
                        {data.topHoldings.map((holding: any, i: number) => (
                            <div key={i} className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{holding.symbol}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">₹{(holding.value/1000).toFixed(1)}K</p>
                                    <p className={`text-xs font-medium ${holding.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {holding.returns > 0 ? '+' : ''}{holding.returns.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
            </div>
        </div>
    );
};
