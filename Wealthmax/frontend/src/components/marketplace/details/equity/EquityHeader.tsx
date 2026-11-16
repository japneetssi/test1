import React from 'react';
import { ExtendedEquityProduct } from '@/types/equity';
import { BookmarkPlus, Share2, TrendingUp, TrendingDown, Info, ShieldAlert } from 'lucide-react';
import { useInvestmentCart } from '@/contexts/InvestmentCartContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
    product: any; // The original product from API
    extendedData?: ExtendedEquityProduct; // The future extended data
}

export const EquityHeader: React.FC<Props> = ({ product, extendedData }) => {
    const { addToCart } = useInvestmentCart();
    const { toast } = useToast();

    // Fallbacks
    const currentPrice = extendedData?.liveData?.currentPrice || product.stats?.nav || product.nav || null;
    const previousClose = extendedData?.liveData?.previousClose || null;
    
    let absChange = null;
    let pctChange = null;
    
    if (currentPrice && previousClose) {
        absChange = currentPrice - previousClose;
        pctChange = (absChange / previousClose) * 100;
    }

    const isPositive = (pctChange || 0) >= 0;

    const handleBuy = () => {
        addToCart({
            id: product.id,
            name: product.name,
            amc: product.fundHouse || product.amc || 'Unknown Exchange',
            nav: currentPrice || 0
        });
        toast({ title: "Added to Cart", description: `${product.name} added to your bucket.` });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative overflow-hidden group">
            {/* Background subtle gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:opacity-70 transition-opacity"></div>
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                <div className="flex items-start gap-4">
                    {/* Logo Placeholder */}
                    <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0">
                        {extendedData?.logoUrl ? (
                            <img src={extendedData.logoUrl} alt={product.name} className="w-10 h-10 object-contain" />
                        ) : (
                            <span className="text-2xl font-bold text-gray-300">{product.name.charAt(0)}</span>
                        )}
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                                {extendedData?.exchange || product.amc || 'NSE'}
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                                EQUITY
                            </span>
                            {extendedData?.industry && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                                    {extendedData.industry.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-1">
                            {product.name}
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">{product.description || 'Equity Share'}</p>
                    </div>
                </div>

                <div className="flex flex-col items-start lg:items-end w-full lg:w-auto">
                    <div className="flex items-end gap-3 mb-1">
                        <p className="text-4xl font-bold text-gray-900 tracking-tight">
                            {currentPrice ? `₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                        </p>
                    </div>
                    {currentPrice && (
                        <p className={`font-medium flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {isPositive ? '+' : ''}{absChange?.toFixed(2)} ({isPositive ? '+' : ''}{pctChange?.toFixed(2)}%) 
                            <span className="text-gray-400 text-xs ml-1 font-normal">1D</span>
                        </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-6 lg:mt-4 w-full lg:w-auto">
                        <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200" title="Add to Watchlist">
                            <BookmarkPlus className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200" title="Share">
                            <Share2 className="w-5 h-5" />
                        </button>
                        
                        <div className="h-8 w-px bg-gray-200 mx-1"></div>
                        
                        <button 
                            className="flex-1 lg:flex-none px-6 py-2.5 bg-white border-2 border-rose-500 text-rose-500 hover:bg-rose-50 rounded-xl font-bold transition-all active:scale-95"
                        >
                            SELL
                        </button>
                        <button 
                            onClick={handleBuy}
                            className="flex-1 lg:flex-none px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-sm shadow-emerald-200"
                        >
                            BUY
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
