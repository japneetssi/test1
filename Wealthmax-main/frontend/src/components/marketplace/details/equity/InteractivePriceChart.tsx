import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, CartesianGrid } from 'recharts';
import { Maximize2, LineChart, BarChart2, Download, SlidersHorizontal } from 'lucide-react';

interface Props {
    productId?: string;
    history: any[];
}

export const InteractivePriceChart: React.FC<Props> = ({ productId, history: initialHistory }) => {
    const [timeframe, setTimeframe] = useState<string>('1Y');
    const [chartType, setChartType] = useState<'line' | 'candle'>('line');
    const [showVolume, setShowVolume] = useState(true);
    const [history, setHistory] = useState<any[]>(initialHistory);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        const fetchHistory = async () => {
            if (!productId) return;
            setLoading(true);
            try {
                const res = await fetch(`https://wealthmax-og-backend.onrender.com/api/v1/marketplace/catalog/${productId}/history?range=${timeframe}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setHistory(data.data);
                    }
                }
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchHistory();
    }, [timeframe, productId]);

    const getFilteredHistory = () => {
        if (!history.length || timeframe === 'ALL' || timeframe === 'MAX') return history;
        const now = new Date();
        const cutoff = new Date();
        
        switch (timeframe) {
            case '1D': cutoff.setDate(now.getDate() - 1); break;
            case '5D': cutoff.setDate(now.getDate() - 5); break;
            case '1M': cutoff.setMonth(now.getMonth() - 1); break;
            case '3M': cutoff.setMonth(now.getMonth() - 3); break;
            case '6M': cutoff.setMonth(now.getMonth() - 6); break;
            case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break;
            case '3Y': cutoff.setFullYear(now.getFullYear() - 3); break;
            case '5Y': cutoff.setFullYear(now.getFullYear() - 5); break;
        }
        
        return history.filter(h => new Date(h.date) >= cutoff);
    };

    const chartData = getFilteredHistory();
    const hasData = chartData.length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Price Chart</h2>
                    
                    {/* Chart Type Toggles */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 ml-4">
                        <button 
                            onClick={() => setChartType('line')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Line Chart"
                        >
                            <LineChart className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setChartType('candle')}
                            className={`p-1.5 rounded-md transition-all ${chartType === 'candle' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Candlestick Chart (Requires lightweight-charts)"
                        >
                            <BarChart2 className="w-4 h-4" />
                        </button>
                    </div>

                    <button 
                        onClick={() => setShowVolume(!showVolume)}
                        className={`ml-2 text-xs font-medium px-2 py-1 rounded transition-colors ${showVolume ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        Vol
                    </button>
                </div>
                
                {/* Tools & Timeframes */}
                <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto hide-scrollbar">
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors" title="Technical Indicators">
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors" title="Export">
                        <Download className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors mr-2" title="Full Screen">
                        <Maximize2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 shrink-0">
                        {['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'].map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                                    timeframe === tf 
                                    ? 'bg-white text-emerald-600 shadow-sm border border-gray-200' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[400px] relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading market data...</p>
                    </div>
                ) : !hasData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <LineChart className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">No historical data available for this timeframe.</p>
                    </div>
                ) : chartType === 'line' ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    if (['1D', '5D'].includes(timeframe)) {
                                        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                                    }
                                    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
                                }}
                                minTickGap={40}
                            />
                            <YAxis 
                                yAxisId="price"
                                domain={['auto', 'auto']} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                                orientation="right"
                                width={60}
                            />
                            {showVolume && (
                                <YAxis 
                                    yAxisId="volume"
                                    domain={[0, 'auto']}
                                    hide={true} // Hidden scale for volume bars at the bottom
                                />
                            )}
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'volume') return [value.toLocaleString(), 'Volume'];
                                    return [`₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Price'];
                                }}
                                labelFormatter={(label) => {
                                    const d = new Date(label);
                                    return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                }}
                            />
                            {showVolume && (
                                <Bar 
                                    yAxisId="volume"
                                    dataKey="volume" 
                                    fill="#e5e7eb" 
                                    opacity={0.5}
                                    barSize={4}
                                />
                            )}
                            <Area 
                                yAxisId="price"
                                type="monotone" 
                                dataKey="value" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorPrice)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <BarChart2 className="w-8 h-8 text-emerald-300 mb-2" />
                        <p className="text-gray-500 text-sm font-medium">Candlestick View Selected</p>
                        <p className="text-gray-400 text-xs mt-1 max-w-xs text-center">To render high-performance candlesticks, integration with TradingView Lightweight Charts is required.</p>
                        <button onClick={() => setChartType('line')} className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-emerald-600 hover:bg-gray-50 transition-colors">
                            Switch to Area Chart
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
