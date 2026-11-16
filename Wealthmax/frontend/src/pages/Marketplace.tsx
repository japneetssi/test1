import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInvestmentCart } from "@/contexts/InvestmentCartContext";
import { useNavigate } from "react-router-dom";
import { Product } from "@/components/marketplace/ProductCard";
import { MarketplaceSidebar } from "@/components/marketplace/MarketplaceSidebar";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { HomeDashboard } from "@/components/marketplace/HomeDashboard";
import { MutualFundsDashboard } from "@/components/marketplace/mutual-funds/MutualFundsDashboard";
import { EquityDashboard } from "@/components/marketplace/equity/EquityDashboard";

const CATEGORIES = ["All", "Mutual Funds", "Equity", "Insurance (Life/Term)", "Insurance (Health)", "Loan", "FD", "AIF", "PMS", "Real Estate", "Other Assets"];

export default function Marketplace() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { addToCart } = useInvestmentCart();
    const [products, setProducts] = useState<Product[]>([]);
    
    // Pagination & Loading
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
    const [selectedAMCs, setSelectedAMCs] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"cagr3y" | "nav" | "aum" | "rating">("nav");
    const [amcList, setAmcList] = useState<string[]>([]);

    // Intersection Observer Ref
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore || activeCategory === 'All') return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, activeCategory]);

    // Fetch filters from backend
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await fetch('https://wealthmax-og-backend.onrender.com/api/v1/marketplace/filters');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data.fundHouses) {
                        setAmcList(data.data.fundHouses);
                    }
                }
            } catch(e) {}
        };
        fetchFilters();
    }, []);

    // Main fetch effect
    useEffect(() => {
        if (activeCategory === 'All') {
            setLoading(false);
            return;
        }

        const fetchProducts = async () => {
            if (page === 1) setLoading(true);
            else setLoadingMore(true);

            try {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('limit', '40');
                if (activeCategory !== 'All') params.append('category', activeCategory);
                if (searchQuery.length >= 2) params.append('q', searchQuery);
                if (selectedRisks.length > 0) params.append('riskLevels', selectedRisks.join(','));
                if (selectedAMCs.length > 0) params.append('amcs', selectedAMCs.join(','));
                params.append('sortBy', sortBy);

                const res = await fetch(`https://wealthmax-og-backend.onrender.com/api/v1/marketplace/catalog?${params.toString()}`);
                const data = await res.json();
                
                if (data.success) {
                    const fetchedProducts = data.data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        shortName: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                        category: p.category === 'Insurance' ? 'Insurance (Life/Term)' : p.category, 
                        risk: p.riskLevel || p.risk || 'Moderate',
                        amc: p.amc || p.fundHouse || "N/A",
                        nav: p.nav !== undefined && p.nav !== null ? p.nav : (p.stats?.nav !== undefined && p.stats?.nav !== null ? p.stats.nav : undefined),
                        cagr3y: p.cagr3y !== undefined && p.cagr3y !== null ? p.cagr3y : undefined,
                        cagr1y: p.cagr1y !== undefined && p.cagr1y !== null ? p.cagr1y : undefined,
                        aum: p.aum || "N/A",
                        rating: p.rating || 0,
                        minSIP: p.minSIP || p.minInvestment || 0,
                        isRecommended: p.isRecommended || (p.relevanceScore > 50),
                        isin: p.isin || "",
                        description: p.description
                    }));
                    
                    setProducts(prev => page === 1 ? fetchedProducts : [...prev, ...fetchedProducts]);
                    setHasMore(data.hasMore);
                    setTotalCount(data.totalCount);
                } else {
                    if (page === 1) setProducts([]);
                    setHasMore(false);
                }
            } catch (err) {
                console.error("Backend fetch failed.", err);
                if (page === 1) setProducts([]);
                setHasMore(false);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        };

        const debounceId = setTimeout(() => {
            fetchProducts();
        }, page === 1 ? 400 : 0); 

        return () => clearTimeout(debounceId);
    }, [page, activeCategory, searchQuery, selectedRisks, selectedAMCs, sortBy]);

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
    }, [activeCategory, searchQuery, selectedRisks, selectedAMCs, sortBy]);

    const riskColor = (risk: string) => {
        if (risk === "Conservative") return "text-blue-700 bg-blue-100 border border-blue-200";
        if (risk === "Moderate") return "text-amber-700 bg-amber-100 border border-amber-200";
        return "text-red-700 bg-red-100 border border-red-200";
    };

    const categoryColor = (cat: string) => {
        if (cat === "Equity" || cat === "PMS" || cat === "AIF") return "bg-[#00458c]/10 text-[#00458c] border border-[#00458c]/20";
        if (cat === "Debt" || cat === "FD") return "bg-green-100 text-green-700 border border-green-200";
        if (cat.includes("Insurance") || cat === "Loan") return "bg-purple-100 text-purple-700 border border-purple-200";
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    };

    const handleInvest = (product: Product) => {
        addToCart({
            id: product.id,
            name: product.name,
            amc: product.amc || product.fundHouse || 'Unknown',
            nav: product.nav
        });
        toast({ title: "Added to Cart", description: `${product.name} added to your investment bucket.` });
    };

    const resetFilters = () => {
        setSelectedRisks([]);
        setSelectedAMCs([]);
        setSearchQuery("");
        setActiveCategory("All");
    };

    return (
        <div className="min-h-screen bg-[image:var(--gradient-hero)] bg-cover bg-fixed flex flex-col text-gray-900 overflow-x-hidden">
            <TopNav />
            <SubNav />

            {/* Page Header (Only show for Grid, HomeDashboard, MutualFundsDashboard, and EquityDashboard have their own) */}
            {activeCategory !== 'All' && activeCategory !== 'Mutual Funds' && activeCategory !== 'Equity' && (
                <div className="bg-[image:var(--gradient-accent)] px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-white/5 opacity-50 backdrop-blur-3xl mix-blend-overlay"></div>
                    <div className="relative z-10 w-full md:w-auto text-center md:text-left">
                        <h1 className="text-white text-3xl font-extrabold tracking-tight drop-shadow-md">Marketplace</h1>
                        <p className="text-white/90 text-sm mt-1.5 font-medium">Discover and invest in curated financial products designed for you.</p>
                    </div>
                    <div className="relative z-10 w-full max-w-2xl flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#00458c] opacity-60 group-focus-within:opacity-100 transition-opacity" />
                        <input
                            type="text"
                            placeholder="Search schemes (e.g. HDFC), ISIN, or Asset Class..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 text-[15px] glass-input text-gray-900 placeholder-gray-500 font-medium"
                        />
                    </div>
                    <div className="relative z-10 flex items-center gap-3 w-full md:w-auto justify-end">
                        <span className="text-white/90 text-sm font-medium drop-shadow-sm">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as typeof sortBy)}
                            className="text-sm bg-white/20 text-white font-medium border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all cursor-pointer backdrop-blur-sm hover:bg-white/30"
                        >
                            <option value="cagr3y" className="text-gray-900">3Y CAGR</option>
                            <option value="nav" className="text-gray-900">NAV</option>
                            <option value="rating" className="text-gray-900">Rating</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Body */}
            <div className={`flex flex-col md:flex-row flex-1 gap-6 w-full mx-auto px-4 py-6 min-h-0 ${activeCategory === 'All' ? 'max-w-[1400px]' : 'max-w-[1600px]'}`}>
                
                {activeCategory !== 'All' && activeCategory !== 'Mutual Funds' && activeCategory !== 'Equity' && (
                    <MarketplaceSidebar 
                        selectedRisks={selectedRisks}
                        setSelectedRisks={setSelectedRisks}
                        selectedAMCs={selectedAMCs}
                        setSelectedAMCs={setSelectedAMCs}
                        amcList={amcList}
                    />
                )}

                <main className="flex-1 flex flex-col min-w-0">
                    {/* Horizontal Tabs */}
                    <div className="w-full overflow-x-auto custom-scrollbar pb-3 mb-4 animate-enter" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="profile-tabs inline-flex min-w-max bg-white/40 shadow-sm border-white/60">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    aria-selected={activeCategory === cat}
                                    className="profile-tab px-4 py-2 text-[13px]"
                                >
                                    {cat === 'All' ? 'Home' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeCategory === 'All' ? (
                        <HomeDashboard setActiveCategory={setActiveCategory} setSearchQuery={setSearchQuery} />
                    ) : activeCategory === 'Mutual Funds' ? (
                        <MutualFundsDashboard />
                    ) : activeCategory === 'Equity' ? (
                        <EquityDashboard />
                    ) : (
                        <MarketplaceGrid
                            loading={loading}
                            products={products}
                            totalCount={totalCount}
                            activeCategory={activeCategory}
                            hasMore={hasMore}
                            lastElementRef={lastElementRef}
                            riskColor={riskColor}
                            categoryColor={categoryColor}
                            onInvest={handleInvest}
                            onFactsheet={(id) => navigate(`/marketplace/product/${id}`)}
                            resetFilters={resetFilters}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
