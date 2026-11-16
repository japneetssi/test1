import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, TrendingUp, BarChart2 } from 'lucide-react';

export const RecommendedForYou = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://wealthmax-og-backend.onrender.com/api/v1/equity-dashboard/recommended');
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (e) {
                console.error("Failed to fetch recommended", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="h-48 bg-white rounded-xl border border-gray-200 animate-pulse"></div>;
    }

    if (!data) return null;

    return (
        <div className="bg-[image:var(--gradient-accent)] rounded-xl border border-[#00458c]/20 shadow-lg p-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-50 backdrop-blur-3xl mix-blend-overlay"></div>
            
            <div className="bg-white rounded-lg p-5 relative z-10 h-full w-full">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-[#00458c]" />
                            For You
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">AI-curated picks based on your Moderate risk profile and holdings.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {data.map((stock: any, i: number) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                            
                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#00458c]">
                                    {stock.symbol.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-[#00458c] transition-colors">{stock.symbol}</h3>
                                    <p className="text-xs text-gray-500">{stock.name}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3" />
                                            {stock.matchScore}% Match
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                                <div className="text-left sm:text-right">
                                    <p className="text-sm text-gray-500 max-w-[200px] italic line-clamp-2">"{stock.reason}"</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-gray-900">₹{stock.price.toLocaleString('en-IN')}</p>
                                    <p className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                    </p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
