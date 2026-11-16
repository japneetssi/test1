import React from 'react';
import { LiveMarketData as ILiveMarketData } from '@/types/equity';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
    data?: ILiveMarketData;
    loading?: boolean;
}

export const LiveMarketData: React.FC<Props> = ({ data, loading }) => {
    
    const MetricItem = ({ label, value, tooltip }: { label: string, value: string | number | null, tooltip?: string }) => (
        <div className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-gray-500 font-medium">{label}</span>
                {tooltip && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs max-w-xs">{tooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            {loading ? (
                <div className="h-4 bg-gray-100 rounded animate-pulse w-20 mt-0.5" />
            ) : (
                <span className="font-semibold text-gray-900 text-sm">
                    {value !== null && value !== undefined ? value : 'N/A'}
                </span>
            )}
        </div>
    );
    
    const fmtPrice = (n: number | null | undefined) =>
        n ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Market Data</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <MetricItem 
                    label="Previous Close" 
                    value={fmtPrice(data?.previousClose)} 
                />
                <MetricItem 
                    label="Open Price" 
                    value={fmtPrice(data?.open)} 
                />
                <MetricItem 
                    label="Volume" 
                    value={data?.volume?.toLocaleString('en-IN')} 
                />
                
                <MetricItem 
                    label="Day High" 
                    value={fmtPrice(data?.high)} 
                />
                <MetricItem 
                    label="Day Low" 
                    value={fmtPrice(data?.low)} 
                />
                <MetricItem 
                    label="Average Volume" 
                    value={data?.averageVolume?.toLocaleString('en-IN')} 
                    tooltip="Average daily trading volume over the last 30 days"
                />
                
                <MetricItem 
                    label="52W High" 
                    value={fmtPrice(data?.week52High)} 
                />
                <MetricItem 
                    label="52W Low" 
                    value={fmtPrice(data?.week52Low)} 
                />
                <MetricItem 
                    label="VWAP" 
                    value={fmtPrice(data?.vwap)} 
                    tooltip="Volume Weighted Average Price — calculated from intraday 5-min bars as Σ(TypicalPrice×Volume)/ΣVolume"
                />
                
                <MetricItem 
                    label="Upper Circuit" 
                    value={fmtPrice(data?.upperCircuit)} 
                    tooltip={`Maximum price today. Source: ${data?.circuitSource || 'Estimated (20%)'}`}
                />
                <MetricItem 
                    label="Lower Circuit" 
                    value={fmtPrice(data?.lowerCircuit)} 
                    tooltip={`Minimum price today. Source: ${data?.circuitSource || 'Estimated (20%)'}`}
                />
                <MetricItem 
                    label="Market Cap" 
                    value={data?.marketCap ? `₹${(data.marketCap / 1e7).toFixed(2)} Cr` : null} 
                />
            </div>

            {/* Market Depth UI (Simplified representation) */}
            <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Market Depth</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Real-time</span>
                </div>
                
                <div className="flex gap-4">
                    {/* Buyers (Bid) */}
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-2 border-b border-gray-100 pb-1">
                            <span>Bid Price</span>
                            <span>Qty</span>
                        </div>
                        {data?.marketDepth?.buyers ? (
                            <div className="space-y-1">
                                {data.marketDepth.buyers.map((b, i) => (
                                    <div key={i} className="flex justify-between text-xs font-medium text-emerald-700">
                                        <span>{b.price}</span>
                                        <span>{b.qty}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="flex justify-between text-xs text-gray-300">
                                        <span>--</span>
                                        <span>--</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-2 text-xs font-bold text-emerald-600">Total Buy Qty: N/A</div>
                    </div>
                    
                    {/* Sellers (Ask) */}
                    <div className="flex-1">
                        <div className="flex justify-between text-xs text-gray-500 mb-2 border-b border-gray-100 pb-1">
                            <span>Ask Price</span>
                            <span>Qty</span>
                        </div>
                        {data?.marketDepth?.sellers ? (
                            <div className="space-y-1">
                                {data.marketDepth.sellers.map((s, i) => (
                                    <div key={i} className="flex justify-between text-xs font-medium text-rose-700">
                                        <span>{s.price}</span>
                                        <span>{s.qty}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="flex justify-between text-xs text-gray-300">
                                        <span>--</span>
                                        <span>--</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-2 text-xs font-bold text-rose-600">Total Sell Qty: N/A</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
