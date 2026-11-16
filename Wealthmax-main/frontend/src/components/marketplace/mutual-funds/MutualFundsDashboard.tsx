import { useState, useEffect } from "react";
import { CompactHeader } from "./sections/CompactHeader";
import { MarketSummary } from "./sections/MarketSummary";
import { RecommendedFunds } from "./sections/RecommendedFunds";
import { DiscoverCategories } from "./sections/DiscoverCategories";
import { CollectionsAndTrending } from "./sections/CollectionsAndTrending";
import { MarketIntelligence } from "./sections/MarketIntelligence";
import { InvestmentTools } from "./sections/InvestmentTools";
import { PortfolioInsights } from "./sections/PortfolioInsights";
import { EducationalCenter } from "./sections/EducationalCenter";
import { BrowseAllFunds } from "./sections/BrowseAllFunds";
import { FundCompareModal } from "./shared/FundCompareModal";
import { PremiumFilters } from "./shared/PremiumFilters";
import { Product } from "../../ProductCard";
import { useInvestmentCart } from "@/contexts/InvestmentCartContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, SlidersHorizontal } from "lucide-react";

export function MutualFundsDashboard() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { addToCart } = useInvestmentCart();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>({
        categories: [],
        trending: [],
        recommended: [],
        collections: [],
        news: [],
        portfolio: null,
        filters: { categories: [], amcs: [], risks: [] }
    });

    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({ categories: [], amcs: [], risks: [] });
    const [compareModalOpen, setCompareModalOpen] = useState(false);
    const [compareFunds, setCompareFunds] = useState<Product[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch all sections concurrently from the mock API routes we created
                const baseUrl = 'https://wealthmax-og-backend.onrender.com/api/v1/mutual-funds';
                
                // Using dummy local endpoints since we just added them to the local backend, 
                // but since frontend points to deployed backend, it might fail. Let's handle it gracefully.
                // We'll use local mock data if the deployed backend fails.
                
                const responses = await Promise.all([
                    fetch(`${baseUrl}/categories`).catch(() => null),
                    fetch(`${baseUrl}/trending`).catch(() => null),
                    fetch(`${baseUrl}/recommended`).catch(() => null),
                    fetch(`${baseUrl}/top-collections`).catch(() => null),
                    fetch(`${baseUrl}/news`).catch(() => null),
                    fetch(`${baseUrl}/portfolio`).catch(() => null),
                    fetch(`${baseUrl}/filter`).catch(() => null)
                ]);

                // Fallback mock data if the live server isn't updated with our new routes yet
                const extractData = async (res: any, fallback: any) => {
                    if (res && res.ok) {
                        const json = await res.json();
                        return json.data || fallback;
                    }
                    return fallback;
                };

                const categories = await extractData(responses[0], [
                    { id: 'c1', name: 'Large Cap', return: '18.4%', risk: 'Moderately High', count: 42, trending: true },
                    { id: 'c2', name: 'Mid Cap', return: '24.2%', risk: 'High', count: 35, trending: true },
                    { id: 'c3', name: 'Small Cap', return: '32.1%', risk: 'Very High', count: 28, trending: false },
                    { id: 'c4', name: 'Flexi Cap', return: '20.5%', risk: 'High', count: 40, trending: true },
                    { id: 'c5', name: 'ELSS', return: '19.8%', risk: 'High', count: 38, trending: false }
                ]);

                const trending = await extractData(responses[1], [
                    { id: 't1', name: 'Parag Parikh Flexi Cap Fund', amc: 'PPFAS', category: 'Flexi Cap', risk: 'Very High', nav: 78.45, cagr3y: 22.4, minSIP: 1000, rating: 5, aum: '60,450 Cr' },
                    { id: 't2', name: 'Nippon India Small Cap Fund', amc: 'Nippon India', category: 'Small Cap', risk: 'Very High', nav: 145.2, cagr3y: 35.8, minSIP: 500, rating: 4, aum: '45,230 Cr' },
                ]);

                const recommended = await extractData(responses[2], [
                    { id: 'r1', name: 'ICICI Prudential Bluechip', amc: 'ICICI Prudential', category: 'Large Cap', risk: 'Very High', nav: 98.5, cagr3y: 18.2, minSIP: 100, rating: 5, isRecommended: true, reason: 'Matches your risk profile' },
                    { id: 'r2', name: 'Mirae Asset Emerging Bluechip', amc: 'Mirae Asset', category: 'Large & Mid Cap', risk: 'Very High', nav: 125.4, cagr3y: 22.5, minSIP: 1000, rating: 5, isRecommended: true, reason: 'High growth potential' }
                ]);

                const collections = await extractData(responses[3], [
                    { id: 'col1', title: 'Best SIP Funds', subtitle: 'Consistent performers for monthly SIPs', fundCount: 12, icon: '📈' },
                    { id: 'col2', title: 'High Growth Funds', subtitle: 'Aggressive funds for maximum returns', fundCount: 8, icon: '🚀' },
                    { id: 'col3', title: 'Tax Saving (ELSS)', subtitle: 'Save tax under section 80C', fundCount: 15, icon: '🛡️' }
                ]);

                const news = await extractData(responses[4], [
                    { id: 'n1', title: 'SEBI mandates new disclosure norms for AMC expenses', date: '2 hours ago', source: 'LiveMint', category: 'SEBI Updates' },
                    { id: 'n2', title: 'HDFC AMC launches new Defence Fund NFO', date: '5 hours ago', source: 'Economic Times', category: 'NFO Launches' }
                ]);

                const portfolio = await extractData(responses[5], {
                    currentValue: 845230, investedAmount: 620000, totalReturns: 225230, absoluteReturns: 36.32, xirr: 18.5, todaysReturns: 4520, todaysReturnsPercent: 0.54
                });

                let filters = await extractData(responses[6], null);
                if (!filters || !filters.categories) {
                    filters = {
                        categories: ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'ELSS'],
                        amcs: filters?.fundHouses || ['HDFC', 'SBI', 'ICICI Prudential', 'Nippon India', 'Kotak'],
                        risks: ['Low', 'Moderate', 'High', 'Very High']
                    };
                }

                setData({ categories, trending, recommended, collections, news, portfolio, filters });
            } catch (err) {
                console.error("Failed to load mutual fund dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleInvest = (fund: Product) => {
        addToCart({
            id: fund.id,
            name: fund.name,
            amc: fund.amc || 'Unknown',
            nav: fund.nav
        });
        toast({ title: "Added to Cart", description: `${fund.name} added to your investment bucket.` });
    };

    // Only navigate to detail page for real catalog funds (IDs start with 'mf-')
    // Mock/curated card IDs like 'r1', 't1' don't exist in the catalog
    const handleFactsheet = (id: string) => {
        if (id.startsWith('mf-')) {
            navigate(`/marketplace/product/${id}`);
        } else {
            toast({ title: "Coming Soon", description: "Detailed view for curated picks is coming soon.", variant: "default" });
        }
    };

    const handleCompare = (fund: Product) => {
        if (!compareFunds.find(f => f.id === fund.id)) {
            const newFunds = [...compareFunds, fund].slice(0, 4); // Max 4 funds
            setCompareFunds(newFunds);
            setCompareModalOpen(true);
        } else {
            setCompareModalOpen(true);
        }
    };

    const handleFilterChange = (type: any, value: string) => {
        setActiveFilters(prev => {
            const curr = prev[type as keyof typeof prev];
            // @ts-ignore
            const next = curr.includes(value) ? curr.filter(v => v !== value) : [...curr, value];
            return { ...prev, [type]: next };
        });
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="h-10 w-10 text-[#00458c] animate-spin mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Loading Premium Experience</h3>
                <p className="text-gray-500 mt-2">Curating the best mutual funds for you...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 animate-enter pb-20">
            <CompactHeader />
            
            <div className="flex items-center justify-end mb-6 lg:hidden">
                <button 
                    onClick={() => setIsFiltersOpen(true)}
                    className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 shadow-sm"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Content Area */}
                <div className="flex-1 min-w-0 flex flex-col">
                    <PortfolioInsights data={data.portfolio} />
                    <MarketSummary categories={data.categories} />
                    <RecommendedFunds 
                        funds={data.recommended} 
                        onInvest={handleInvest} 
                        onFactsheet={handleFactsheet}
                        onCompare={handleCompare}
                    />
                    <DiscoverCategories />
                    <CollectionsAndTrending 
                        collections={data.collections} 
                        trending={data.trending} 
                        onInvest={handleInvest}
                        onFactsheet={handleFactsheet}
                        onCompare={handleCompare}
                    />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <MarketIntelligence news={data.news} />
                        <InvestmentTools />
                    </div>
                    
                    <EducationalCenter />

                    {/* Browse All Real Funds from Catalog */}
                    <BrowseAllFunds
                        onInvest={handleInvest}
                        onFactsheet={(id) => navigate(`/marketplace/product/${id}`)}
                        onCompare={handleCompare}
                    />
                </div>

                {/* Right Sidebar Filters */}
                <div className={`fixed inset-0 z-50 lg:static lg:z-auto bg-gray-900/50 lg:bg-transparent ${isFiltersOpen ? 'flex' : 'hidden lg:block'} justify-end backdrop-blur-sm lg:backdrop-blur-none`}>
                    <div className="h-full lg:h-auto animate-in slide-in-from-right-full lg:animate-none flex items-center pr-4 lg:pr-0">
                        <PremiumFilters 
                            isOpen={true} 
                            onClose={() => setIsFiltersOpen(false)}
                            filters={data.filters}
                            activeFilters={activeFilters}
                            onFilterChange={handleFilterChange}
                            onClearAll={() => setActiveFilters({ categories: [], amcs: [], risks: [] })}
                        />
                    </div>
                </div>
            </div>

            <FundCompareModal 
                isOpen={compareModalOpen} 
                onClose={() => setCompareModalOpen(false)} 
                funds={compareFunds} 
            />
        </div>
    );
}
