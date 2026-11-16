import { Star, TrendingUp, Shield, BarChart2 } from "lucide-react";
import { Product } from "../../../ProductCard";

interface PremiumFundCardProps {
    fund: Product;
    onInvest: () => void;
    onFactsheet: () => void;
    onCompare?: () => void;
}

export function PremiumFundCard({ fund, onInvest, onFactsheet, onCompare }: PremiumFundCardProps) {
    const riskColor = (risk: string) => {
        if (risk.includes("High")) return "text-red-700 bg-red-50 border-red-100";
        if (risk.includes("Low")) return "text-emerald-700 bg-emerald-50 border-emerald-100";
        return "text-amber-700 bg-amber-50 border-amber-100";
    };

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-4">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="font-bold text-[#00458c] text-sm">{(fund.amc || fund.fundHouse || 'NA').substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 leading-tight group-hover:text-[#00458c] transition-colors truncate">
                            {fund.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1 truncate">{fund.amc || fund.fundHouse || 'Unknown AMC'} Mutual Fund</p>
                    </div>
                    {fund.isRecommended && (
                        <div className="shrink-0 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-700" />
                            AI Pick
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-[11px] px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md font-semibold border border-gray-100">
                        {fund.category}
                    </span>
                    <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold border ${riskColor(fund.risk)} flex items-center gap-1`}>
                        <Shield className="h-3 w-3" />
                        {fund.risk}
                    </span>
                </div>
            </div>

            {/* Metrics */}
            <div className="px-5 py-4 bg-gray-50/50 border-y border-gray-100 grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">3Y CAGR</span>
                    <span className="text-base font-extrabold text-emerald-600">
                        {fund.cagr3y ? `+${fund.cagr3y}%` : 'N/A'}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Min SIP</span>
                    <span className="text-base font-bold text-gray-900">
                        ₹{fund.minSIP || 500}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">NAV</span>
                    <span className="text-base font-bold text-gray-900">
                        ₹{fund.nav?.toFixed(2) || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 mt-auto flex items-center justify-between gap-3 bg-white">
                <button 
                    onClick={onCompare}
                    className="p-2 text-gray-400 hover:text-[#00458c] hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    title="Compare Fund"
                >
                    <BarChart2 className="h-5 w-5" />
                </button>
                <div className="flex flex-1 gap-2">
                    <button
                        onClick={onFactsheet}
                        className="flex-1 py-2 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                        Details
                    </button>
                    <button
                        onClick={onInvest}
                        className="flex-1 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#00458c] to-[#005bb5] hover:opacity-90 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Invest
                    </button>
                </div>
            </div>
        </div>
    );
}
