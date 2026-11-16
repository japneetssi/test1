import { useState, useEffect, useCallback, useRef } from "react";
import { Search, SlidersHorizontal, Loader2, PackageOpen } from "lucide-react";
import { PremiumFundCard } from "../shared/PremiumFundCard";
import { Product } from "../../../ProductCard";

interface BrowseAllFundsProps {
    onInvest: (fund: Product) => void;
    onFactsheet: (id: string) => void;
    onCompare: (fund: Product) => void;
}

export function BrowseAllFunds({ onInvest, onFactsheet, onCompare }: BrowseAllFundsProps) {
    const [funds, setFunds] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("cagr3y");
    const [riskFilter, setRiskFilter] = useState("");

    const observer = useRef<IntersectionObserver | null>(null);
    const lastRef = useCallback((node: HTMLDivElement | null) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    // Reset on filter change
    useEffect(() => {
        setPage(1);
        setFunds([]);
    }, [debouncedSearch, sortBy, riskFilter]);

    useEffect(() => {
        const fetchFunds = async () => {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);

            try {
                const params = new URLSearchParams();
                params.append('category', 'MF');
                params.append('page', page.toString());
                params.append('limit', '24');
                params.append('sortBy', sortBy);
                if (debouncedSearch.length >= 2) params.append('q', debouncedSearch);
                if (riskFilter) params.append('riskLevels', riskFilter);

                const res = await fetch(`https://wealthmax-og-backend.onrender.com/api/v1/marketplace/catalog?${params.toString()}`);
                const data = await res.json();

                if (data.success) {
                    const mapped: Product[] = data.data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        shortName: p.name,
                        category: p.description || 'Mutual Fund',
                        risk: p.riskLevel || 'Moderate',
                        amc: p.amc || p.fundHouse || 'Unknown',
                        nav: p.nav,
                        cagr3y: p.cagr3y,
                        cagr1y: p.cagr1y,
                        aum: p.aum || p.stats?.aum,
                        rating: p.rating || 0,
                        minSIP: p.minSIP || 500,
                        isRecommended: p.isRecommended || false,
                        fundHouse: p.fundHouse,
                        isin: p.isin || p.id,
                        description: p.description,
                    }));
                    setFunds(prev => page === 1 ? mapped : [...prev, ...mapped]);
                    setHasMore(data.hasMore);
                    setTotalCount(data.totalCount);
                }
            } catch (e) {
                console.error("Failed to load funds", e);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        };
        fetchFunds();
    }, [page, debouncedSearch, sortBy, riskFilter]);

    return (
        <section className="mt-12">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Browse All Funds</h2>
                    {totalCount > 0 && (
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            {totalCount.toLocaleString()} funds available
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search fund name or AMC..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c]/50 shadow-sm"
                        />
                    </div>
                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 shadow-sm"
                    >
                        <option value="cagr3y">3Y Returns</option>
                        <option value="nav">NAV</option>
                        <option value="rating">Rating</option>
                    </select>
                    {/* Risk Filter */}
                    <select
                        value={riskFilter}
                        onChange={e => setRiskFilter(e.target.value)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 shadow-sm"
                    >
                        <option value="">All Risk</option>
                        <option value="Low">Low</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Aggressive">Aggressive</option>
                    </select>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

            {/* Fund Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-8 w-8 text-[#00458c] animate-spin" />
                    <p className="text-gray-500 font-medium">Loading funds...</p>
                </div>
            ) : funds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <PackageOpen className="h-12 w-12 text-gray-300" />
                    <h3 className="font-bold text-gray-700">No funds found</h3>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {funds.map((fund, idx) => (
                            <div
                                key={fund.id}
                                ref={idx === funds.length - 1 ? lastRef : undefined}
                            >
                                <PremiumFundCard
                                    fund={fund}
                                    onInvest={() => onInvest(fund)}
                                    onFactsheet={() => onFactsheet(fund.id)}
                                    onCompare={() => onCompare(fund)}
                                />
                            </div>
                        ))}
                    </div>
                    {loadingMore && (
                        <div className="flex justify-center mt-8">
                            <Loader2 className="h-6 w-6 text-[#00458c] animate-spin" />
                        </div>
                    )}
                    {!hasMore && funds.length > 0 && (
                        <p className="text-center text-sm text-gray-400 font-medium mt-8">
                            All {totalCount.toLocaleString()} funds loaded
                        </p>
                    )}
                </>
            )}
        </section>
    );
}
