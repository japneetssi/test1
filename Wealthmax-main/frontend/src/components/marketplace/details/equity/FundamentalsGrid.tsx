import React from 'react';
import { Fundamentals } from '@/types/equity';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
    fundamentals?: Fundamentals;
    product?: any;
    loading?: boolean;
}

const Skeleton = () => (
    <div className="h-4 bg-gray-100 rounded animate-pulse w-16 mt-1" />
);

export const FundamentalsGrid: React.FC<Props> = ({ fundamentals, product, loading }) => {
    
    const DataItem = ({ label, value, tooltip }: { label: string, value: any, tooltip?: string }) => (
        <div>
            <div className="flex items-center gap-1 mb-1">
                <p className="text-xs text-gray-500 font-medium">{label}</p>
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
                <Skeleton />
            ) : (
                <p className="font-bold text-gray-900 text-sm">{value !== null && value !== undefined ? value : 'N/A'}</p>
            )}
        </div>
    );

    const fmt = (val: number | null | undefined, suffix = '') =>
        val != null ? `${val}${suffix}` : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Fundamentals</h2>
                {!loading && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Live Data
                    </span>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-8 gap-x-4">
                <DataItem label="Market Cap" value={fundamentals?.marketCap || product?.marketCap} />
                <DataItem label="Enterprise Value" value={fundamentals?.enterpriseValue} />
                <DataItem label="P/E Ratio (TTM)" value={fundamentals?.peRatio || product?.peRatio} tooltip="Trailing 12-month Price to Earnings Ratio" />
                <DataItem label="Forward P/E" value={fundamentals?.forwardPe} tooltip="Price / Expected Next Year EPS from analyst consensus" />
                <DataItem label="P/B Ratio" value={fundamentals?.pbRatio || product?.pbRatio} tooltip="Price to Book Ratio" />
                
                <DataItem label="Industry P/E" value={fundamentals?.industryPE || product?.industryPe} />
                <DataItem label="EPS (TTM)" value={fundamentals?.eps || product?.eps} />
                <DataItem label="Book Value" value={fundamentals?.bookValue} tooltip="Shareholders Equity / Outstanding Shares" />
                <DataItem label="Face Value" value={fundamentals?.faceValue} />
                <DataItem label="Div Yield" value={fmt(fundamentals?.dividendYield, '%')} />
                
                <DataItem label="ROE" value={fmt(fundamentals?.roe, '%')} tooltip="Net Income / Average Shareholders Equity" />
                <DataItem label="ROCE" value={fmt(fundamentals?.roce, '%')} tooltip="EBIT / Capital Employed" />
                <DataItem label="ROA" value={fmt(fundamentals?.roa, '%')} tooltip="Net Income / Average Total Assets" />
                <DataItem label="Debt to Equity" value={fundamentals?.debtToEquity || product?.debtToEquity} tooltip="Total Debt / Shareholders Equity" />
                <DataItem label="Div Payout" value={fmt(fundamentals?.dividendPayout, '%')} tooltip="Dividend Per Share / EPS" />

                <DataItem label="Current Ratio" value={fundamentals?.currentRatio} tooltip="Current Assets / Current Liabilities" />
                <DataItem label="Quick Ratio" value={fundamentals?.quickRatio} tooltip="(Current Assets - Inventory) / Current Liabilities" />
                <DataItem label="Interest Coverage" value={fundamentals?.interestCoverage} tooltip="EBIT / Interest Expense" />
                <DataItem label="Net Profit Margin" value={fmt(fundamentals?.netProfitMargin, '%')} tooltip="Net Income / Revenue" />
                <DataItem label="Operating Margin" value={fmt(fundamentals?.operatingMargin, '%')} tooltip="Operating Income / Revenue" />
            </div>
        </div>
    );
};
