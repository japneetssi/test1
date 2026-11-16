import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Layers, List, LayoutGrid } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useInvestmentCart } from "@/contexts/InvestmentCartContext";
import { PremiumStockCard, StockProduct } from '../shared/PremiumStockCard';

export const BrowseAllStocks = () => {
    const { toast } = useToast();
    const { addToCart } = useInvestmentCart();
    
    const [stocks, setStocks] = useState<StockProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("marketCap");
    
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    useEffect(() => {
        const fetchStocks = async () => {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);

            try {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('limit', '40');
                params.append('category', 'Equity');
                if (searchQuery.length >= 2) params.append('q', searchQuery);
                params.append('sortBy', sortBy);

                const res = await fetch(`https://wealthmax-og-backend.onrender.com/api/v1/marketplace/catalog?${params.toString()}`);
                const data = await res.json();
                
                if (data.success) {
                    const fetchedStocks: StockProduct[] = data.data.map((p: any) => ({
                        id: p.id,
                        symbol: p.symbol || p.name.split(' ')[0], 
                        name: p.description || p.name,
                        price: p.nav || p.stats?.nav || 0,
                        change: p.cagr1y || 0,
                        changePercent: p.cagr1y || 0,
                        marketCap: p.marketCap || 'N/A',
                        peRatio: p.peRatio || 0,
                        pbRatio: p.pbRatio || 0,
                        industryPe: p.industryPe || 0,
                        dividendYield: p.dividendYield || 0,
                        isRecommended: p.isRecommended,
                        tags: p.tags || []
                    }));
                    
                    setStocks(prev => page === 1 ? fetchedStocks : [...prev, ...fetchedStocks]);
                    setHasMore(data.hasMore);
                    setTotalCount(data.totalCount);
                } else {
                    if (page === 1) setStocks([]);
                    setHasMore(false);
                }
            } catch (err) {
                console.error("Backend fetch failed.", err);
                if (page === 1) setStocks([]);
                setHasMore(false);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        };

        const debounceId = setTimeout(() => {
            fetchStocks();
        }, page === 1 ? 400 : 0); 

        return () => clearTimeout(debounceId);
    }, [page, searchQuery, sortBy]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, sortBy]);

    const handleInvest = (stock: StockProduct) => {
        addToCart({
            id: stock.id,
            name: stock.name,
            amc: 'Equity', // Or derived
            nav: stock.price
        });
        toast({ title: "Added to Cart", description: `${stock.symbol} added to your basket.` });
    };

    return (
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Header & Controls */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Layers className="h-7 w-7 text-[#00458c]" />
                            All Stocks
                        </h2>
                        <p className="text-gray-500 mt-1">Browse, filter, and discover from {totalCount > 0 ? totalCount.toLocaleString('en-IN') : '19,000+'} listed equities.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search stocks or ISIN..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00458c]/20 focus:border-[#00458c] bg-white transition-all"
                            />
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="w-full sm:w-auto py-2.5 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00458c]/20"
                            >
                                <option value="marketCap">Market Cap</option>
                                <option value="volume">Volume</option>
                                <option value="gainer">Top Gainers</option>
                                <option value="loser">Top Losers</option>
                            </select>
                            
                            <button className="flex-none p-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors" title="Filters">
                                <Filter className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="p-6 bg-gray-50/30">
                {loading && page === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : stocks.length === 0 ? (
                    <div className="text-center py-20">
                        <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900">No stocks found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {stocks.map((stock, index) => {
                            if (stocks.length === index + 1) {
                                return (
                                    <div ref={lastElementRef} key={`${stock.id}-${index}`}>
                                        <PremiumStockCard stock={stock} onInvest={handleInvest} />
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={`${stock.id}-${index}`}>
                                        <PremiumStockCard stock={stock} onInvest={handleInvest} />
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
                
                {loadingMore && (
                    <div className="py-8 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00458c]"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
