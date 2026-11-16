import React from 'react';
import { PerformanceMetrics } from '@/types/equity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';

interface Props {
    performance?: PerformanceMetrics;
    loading?: boolean;
}

export const TechnicalAndPerformance: React.FC<Props> = ({ performance, loading }) => {
    
    const PerformanceItem = ({ label, value }: { label: string, value: number | null | undefined }) => {
        if (loading) return (
            <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <div className="h-4 bg-gray-100 rounded animate-pulse w-12" />
            </div>
        );
        if (value === null || value === undefined) return (
            <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-semibold text-gray-400">N/A</span>
            </div>
        );

        const isPositive = value >= 0;
        return (
            <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{value.toFixed(2)}%
                </span>
            </div>
        );
    };

    const TechIndicator = ({ name, value, action }: { name: string, value: string, action: 'Buy' | 'Sell' | 'Neutral' }) => {
        let actionColor = 'text-gray-500 bg-gray-50';
        if (action === 'Buy') actionColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
        if (action === 'Sell') actionColor = 'text-rose-700 bg-rose-50 border-rose-100';

        return (
            <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                <div>
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{value}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${actionColor}`}>
                    {action}
                </span>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <Tabs defaultValue="performance" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Analysis</h2>
                    <TabsList className="bg-gray-50">
                        <TabsTrigger value="performance" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Performance</TabsTrigger>
                        <TabsTrigger value="technicals" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Technicals</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="performance" className="mt-0">
                    <div className="space-y-1">
                        <PerformanceItem label="Today's Return" value={performance?.todayReturn} />
                        <PerformanceItem label="1 Week Return" value={performance?.weeklyReturn} />
                        <PerformanceItem label="1 Month Return" value={performance?.monthlyReturn} />
                        <PerformanceItem label="3 Month Return" value={performance?.threeMonthReturn} />
                        <PerformanceItem label="6 Month Return" value={performance?.sixMonthReturn} />
                        <PerformanceItem label="YTD Return" value={performance?.ytdReturn} />
                        <PerformanceItem label="1 Year Return" value={performance?.oneYearReturn} />
                        <PerformanceItem label="3 Year CAGR" value={performance?.threeYearCAGR} />
                        <PerformanceItem label="5 Year CAGR" value={performance?.fiveYearCAGR} />
                    </div>
                </TabsContent>

                <TabsContent value="technicals" className="mt-0">
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Summary</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Strong Buy</span>
                    </div>

                    <div className="space-y-1 h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        <TechIndicator name="RSI (14)" value="65.42" action="Buy" />
                        <TechIndicator name="MACD (12, 26, 9)" value="12.50" action="Buy" />
                        <TechIndicator name="SMA (20)" value="₹1,450.20" action="Buy" />
                        <TechIndicator name="SMA (50)" value="₹1,320.50" action="Buy" />
                        <TechIndicator name="SMA (200)" value="₹1,180.00" action="Buy" />
                        <TechIndicator name="Bollinger Bands" value="Upper Band" action="Neutral" />
                        <TechIndicator name="Stochastic RSI" value="82.10" action="Sell" />
                        <TechIndicator name="ADX (14)" value="28.5" action="Buy" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
