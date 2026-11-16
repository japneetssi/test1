import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Trophy, AlertTriangle } from 'lucide-react';

export const MarketSnapshot = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://wealthmax-og-backend.onrender.com/api/v1/equity-dashboard/market-overview');
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (e) {
                console.error("Failed to fetch market overview", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="h-40 bg-white rounded-xl border border-gray-200 animate-pulse"></div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Market Snapshot
                    <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Market {data.marketStatus}
                    </span>
                </h2>
                <span className="text-sm text-gray-500">As of {new Date().toLocaleTimeString()}</span>
            </div>

            {/* Indices Marquee / Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
                {data.indices.map((idx: any, i: number) => (
                    <div key={i} className="min-w-[180px] bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex-shrink-0 flex flex-col">
                        <span className="text-sm font-semibold text-gray-600">{idx.name}</span>
                        <span className="text-lg font-bold text-gray-900 mt-1">{idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${idx.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {idx.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            <span>{idx.change > 0 ? '+' : ''}{idx.change.toFixed(2)}</span>
                            <span>({idx.change > 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actionable Market Movers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                        <Trophy className="h-4 w-4 text-green-600" />
                        Top Gainers
                    </h3>
                    <div className="space-y-3">
                        {data.topGainers.map((stock: any, i: number) => (
                            <div key={i} className="flex justify-between items-center group cursor-pointer">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#00458c] transition-colors">{stock.symbol}</p>
                                    <p className="text-xs text-gray-500 truncate w-24">{stock.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">₹{stock.price.toLocaleString('en-IN')}</p>
                                    <p className="text-xs font-medium text-green-600">+{stock.changePercent.toFixed(2)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Top Losers
                    </h3>
                    <div className="space-y-3">
                        {data.topLosers.map((stock: any, i: number) => (
                            <div key={i} className="flex justify-between items-center group cursor-pointer">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#00458c] transition-colors">{stock.symbol}</p>
                                    <p className="text-xs text-gray-500 truncate w-24">{stock.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">₹{stock.price.toLocaleString('en-IN')}</p>
                                    <p className="text-xs font-medium text-red-600">{stock.changePercent.toFixed(2)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                        <Activity className="h-4 w-4 text-blue-600" />
                        Most Active (Vol)
                    </h3>
                    <div className="space-y-3">
                        {data.mostActive.map((stock: any, i: number) => (
                            <div key={i} className="flex justify-between items-center group cursor-pointer">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#00458c] transition-colors">{stock.symbol}</p>
                                    <p className="text-xs text-gray-500 truncate w-24">{stock.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">₹{stock.price.toLocaleString('en-IN')}</p>
                                    <p className="text-xs font-medium text-gray-500">Vol: {stock.volume}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        52W Highs
                    </h3>
                    <div className="space-y-3">
                        {data.high52Week.map((stock: any, i: number) => (
                            <div key={i} className="flex justify-between items-center group cursor-pointer">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 group-hover:text-[#00458c] transition-colors">{stock.symbol}</p>
                                    <p className="text-xs text-gray-500 truncate w-24">{stock.name}</p>
                                </div>
                                <div className="text-right flex items-center justify-end">
                                    <p className="text-sm font-semibold text-gray-900">₹{stock.price.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
