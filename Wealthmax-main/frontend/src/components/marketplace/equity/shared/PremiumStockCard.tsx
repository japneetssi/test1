import React from "react";
import { ArrowUpRight, ArrowDownRight, BarChart2, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface StockProduct {
    id: string;
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: string;
    peRatio: number;
    pbRatio: number;
    industryPe?: number;
    roe?: string;
    dividendYield?: number;
    isRecommended?: boolean;
    tags?: string[];
}

interface Props {
    stock: StockProduct;
    onInvest?: (stock: StockProduct) => void;
}

export const PremiumStockCard: React.FC<Props> = ({ stock, onInvest }) => {
    const navigate = useNavigate();

    const hasPrice = stock.price > 0;
    const isPositive = stock.changePercent >= 0;

    // Derive a clean 2-letter ticker from symbol for the avatar
    const avatarLetters = (stock.symbol || stock.name || '??')
        .replace(/[^A-Z]/gi, '')
        .substring(0, 2)
        .toUpperCase() || '??';

    return (
        <div 
            onClick={() => navigate(`/marketplace/product/${stock.id}`)}
            className="group bg-white rounded-2xl p-5 border border-gray-200 hover:border-[#00458c]/30 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden"
        >
            {/* Top Row: Logo & Price */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00458c]/10 to-blue-50 border border-[#00458c]/10 flex items-center justify-center font-extrabold text-[#00458c] text-base shadow-sm group-hover:scale-105 transition-transform shrink-0">
                        {avatarLetters}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-[#00458c] transition-colors truncate">
                            {stock.symbol || '—'}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium truncate max-w-[130px]">{stock.name}</p>
                    </div>
                </div>
                
                <div className="text-right shrink-0 ml-2">
                    {hasPrice ? (
                        <>
                            <p className="font-bold text-gray-900 text-base">
                                ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                            <div className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                <span>{isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                            </div>
                        </>
                    ) : (
                        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">
                            Price N/A
                        </span>
                    )}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 mb-4 bg-gray-50/50 rounded-lg px-2">
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-medium mb-0.5">Market Cap</p>
                    <p className="text-xs font-bold text-gray-900 truncate">
                        {stock.marketCap && stock.marketCap !== 'N/A' ? stock.marketCap : '—'}
                    </p>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                    <p className="text-[10px] text-gray-500 font-medium mb-0.5">P/E Ratio</p>
                    <p className="text-xs font-bold text-gray-900">
                        {stock.peRatio ? stock.peRatio.toFixed(1) : '—'}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-medium mb-0.5">Div Yield</p>
                    <p className="text-xs font-bold text-gray-900">
                        {stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : '—'}
                    </p>
                </div>
            </div>

            {/* Tags / Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {stock.isRecommended && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                        <TrendingUp className="h-2.5 w-2.5" /> Pick
                    </span>
                )}
                {stock.peRatio > 0 && stock.industryPe && stock.peRatio < stock.industryPe && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        Undervalued
                    </span>
                )}
                {stock.tags?.filter(t => t && t !== 'undefined').slice(0, 2).map((tag, i) => (
                    <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto pt-2">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onInvest) onInvest(stock);
                    }}
                    className="flex-1 bg-[#00458c] hover:bg-blue-800 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                >
                    Buy
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/marketplace/product/${stock.id}`);
                    }}
                    className="flex-none bg-white hover:bg-gray-50 text-[#00458c] border border-gray-200 hover:border-[#00458c] text-sm font-semibold py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center"
                    title="View Details"
                >
                    <BarChart2 className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};
