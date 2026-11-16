import React, { useState, useEffect } from 'react';
import { Target, Clock, CalendarDays, ArrowRight } from 'lucide-react';

export const MarketOpportunities = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'intraday' | 'swing' | 'longTerm'>('swing');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('https://wealthmax-og-backend.onrender.com/api/v1/equity-dashboard/market-opportunities');
                const json = await res.json();
                if (json.success) setData(json.data);
            } catch (e) {
                console.error("Failed to fetch opportunities", e);
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
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Target className="h-6 w-6 text-red-500" />
                    Trading Opportunities
                </h2>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('intraday')}
                        className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'intraday' ? 'text-[#00458c] border-b-2 border-[#00458c]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Clock className="h-4 w-4" /> Intraday
                    </button>
                    <button 
                        onClick={() => setActiveTab('swing')}
                        className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'swing' ? 'text-[#00458c] border-b-2 border-[#00458c]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <CalendarDays className="h-4 w-4" /> Swing (1-4W)
                    </button>
                    <button 
                        onClick={() => setActiveTab('longTerm')}
                        className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-1.5 transition-colors ${activeTab === 'longTerm' ? 'text-[#00458c] border-b-2 border-[#00458c]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Target className="h-4 w-4" /> Long Term
                    </button>
                </div>

                <div className="p-4">
                    {activeTab === 'intraday' && (
                        <div className="space-y-4">
                            {data.intraday.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{item.symbol}</h4>
                                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                            <span>Target: ₹{item.target}</span>
                                            <span className="text-red-500">SL: ₹{item.stopLoss}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded font-bold text-xs ${item.action === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.action} @ ₹{item.current}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {activeTab === 'swing' && (
                        <div className="space-y-4">
                            {data.swing.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{item.symbol}</h4>
                                        <p className="text-xs text-gray-500 mt-1">Setup: {item.setup}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">Expected: {item.potentialReturn}</p>
                                        <p className="text-xs text-gray-500">{item.timeframe}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'longTerm' && (
                        <div className="space-y-4">
                            {data.longTerm.map((item: any, i: number) => (
                                <div key={i} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-gray-900">{item.symbol}</h4>
                                        <span className="text-sm font-bold text-gray-900">₹{item.current.toLocaleString('en-IN')}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{item.thesis}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <button className="text-xs font-medium text-[#00458c] hover:underline">
                            View All Research & Ideas <ArrowRight className="inline h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
