import React, { useState, useEffect } from 'react';
import { Newspaper, ArrowRight, ExternalLink } from 'lucide-react';

export const MarketIntelligence = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://wealthmax-og-backend.onrender.com/api/v1/equity-dashboard/news');
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (e) {
                console.error("Failed to fetch news", e);
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

    const getImpactColor = (impact: string) => {
        if (impact === 'Positive') return 'bg-green-100 text-green-700 border-green-200';
        if (impact === 'Negative') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-gray-700" />
                    Live Market Intelligence
                </h2>
                <button className="text-xs font-medium text-[#00458c] hover:underline flex items-center">
                    All News <ArrowRight className="h-3 w-3 ml-0.5" />
                </button>
            </div>
            
            <div className="divide-y divide-gray-100">
                {data.map((item: any, i: number) => (
                    <div key={i} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.source}</span>
                                    <span className="text-[10px] text-gray-400">• {item.time}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#00458c] leading-snug">
                                    {item.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getImpactColor(item.impact)}`}>
                                        {item.impact}
                                    </span>
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                                        {item.type}
                                    </span>
                                </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-[#00458c] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
