import React, { useState, useEffect } from 'react';
import { Flame, ArrowRight, Zap, Target } from 'lucide-react';

export const TrendingStocks = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://wealthmax-og-backend.onrender.com/api/v1/equity-dashboard/trending');
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (e) {
                console.error("Failed to fetch trending", e);
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

    const renderCard = (stock: any) => (
        <div key={stock.id} className="min-w-[240px] bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-[#00458c] text-sm">
                    {stock.symbol.substring(0, 2)}
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹{stock.price.toLocaleString('en-IN')}</p>
                    <p className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </p>
                </div>
            </div>
            <h4 className="font-bold text-gray-900">{stock.symbol}</h4>
            <p className="text-xs text-gray-500 truncate mb-3">{stock.name}</p>
            <div className="flex items-center gap-2 mt-auto">
                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">MCap: {stock.marketCap}</span>
            </div>
        </div>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Flame className="h-6 w-6 text-orange-500" />
                    Trending Now
                </h2>
            </div>
            
            <div className="space-y-6">
                
                {/* Most Bought Carousel */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700">Most Bought on WealthMax</h3>
                        <button className="text-xs font-medium text-[#00458c] hover:underline flex items-center">
                            View All <ArrowRight className="h-3 w-3 ml-0.5" />
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar hide-scrollbar">
                        {data.mostBought.map(renderCard)}
                        {/* Mocking a few more to show scrolling */}
                        {data.mostTraded.map(renderCard)}
                    </div>
                </div>

                {/* Breakout Stocks Carousel */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            Technical Breakouts
                        </h3>
                        <button className="text-xs font-medium text-[#00458c] hover:underline flex items-center">
                            View All <ArrowRight className="h-3 w-3 ml-0.5" />
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar hide-scrollbar">
                        {data.breakout.map(renderCard)}
                        {/* Mocking more */}
                        {data.mostBought.map(renderCard)}
                    </div>
                </div>
            </div>
        </div>
    );
};
