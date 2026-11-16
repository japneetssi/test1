import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Search, CalendarDays, BarChart3, ArrowLeftRight, Target, Calculator, Landmark, ShieldCheck, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HomeDashboard({ setActiveCategory, setSearchQuery }: { setActiveCategory: (c: string) => void, setSearchQuery: (q: string) => void }) {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [globalSearch, setGlobalSearch] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch('https://wealthmax-og-backend.onrender.com/api/v1/marketplace/dashboard');
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.message);
                }
            } catch (err) {
                setError("Failed to load dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (globalSearch.length > 0) {
            setSearchQuery(globalSearch);
            // Don't change category, let user search across all natively or keep them on 'All' but redirecting to grid is needed
            // If they are on Home Dashboard, we need them to see the grid to see results.
            setActiveCategory("MF"); // Default to MF to show results in grid, or create a 'Search Results' view. Let's do MF for now.
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-32 animate-enter min-h-[60vh]">
                <Loader2 className="animate-spin h-10 w-10 text-[#00458c] mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Building your intelligent dashboard...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-32 animate-enter">
                <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-gray-800 font-bold mb-2">Something went wrong</p>
                <p className="text-gray-500 text-sm">{error || "Failed to load dashboard data"}</p>
                <button onClick={() => window.location.reload()} className="mt-6 btn-glass-secondary">Retry</button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col gap-8 w-full mx-auto animate-enter">
            
            {/* Section 1: Welcome Header */}
            <section className="bg-gradient-to-r from-[#002f6c] to-[#00458c] rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-extrabold mb-1">
                        <span className="opacity-80 font-medium">{data.header.greeting},</span> {data.header.userName}
                    </h1>
                    <p className="text-white/80 text-sm mb-6 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Here's your personalized wealth snapshot
                    </p>
                    
                    <div className="flex gap-6 md:gap-10">
                        <div>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Net Worth</p>
                            <p className="text-2xl md:text-3xl font-black tracking-tight">{data.header.netWorth}</p>
                        </div>
                        <div className="w-px bg-white/20"></div>
                        <div>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Today's P&L</p>
                            <p className={`text-xl md:text-2xl font-bold tracking-tight ${data.header.todaysGainLoss.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {data.header.todaysGainLoss.amount} <span className="text-sm opacity-80 font-medium">({data.header.todaysGainLoss.percentage})</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 w-full md:max-w-md">
                    <form onSubmit={handleSearch} className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#00458c] transition-colors" />
                        <input
                            type="text"
                            placeholder="Global Search (Stocks, MF, FD...)"
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/50 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium shadow-inner"
                        />
                    </form>
                </div>
            </section>

            {/* Section 2: Market Snapshot */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Market Snapshot</h2>
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Live</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {data.marketSnapshot.map((idx: any, i: number) => (
                        <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-gray-200 hover:shadow-md transition-all">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{idx.name}</p>
                            <p className="text-sm font-extrabold text-gray-900 my-1">{idx.price.toLocaleString('en-IN')}</p>
                            <p className={`text-[11px] font-bold ${idx.isPositive ? 'text-emerald-600' : 'text-rose-600'} flex items-center gap-1`}>
                                {idx.isPositive ? '+' : ''}{idx.change.toFixed(2)} ({idx.isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%)
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 3: Quick Actions */}
            <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {data.quickActions.map((action: any, i: number) => {
                    const icons: any = { TrendingUp, CalendarDays, BarChart3, ArrowLeftRight, Target, Calculator, Landmark, ShieldCheck };
                    const Icon = icons[action.icon];
                    return (
                        <button key={i} className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all group">
                            <div className={`p-2.5 rounded-full mb-2 bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                                <Icon className={`w-5 h-5 text-${action.color}-600`} />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 text-center leading-tight">{action.title}</span>
                        </button>
                    )
                })}
            </section>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (Wider) */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    
                    {/* Section 5: Explore Categories */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Explore Asset Classes</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {data.exploreCategories.slice(0,8).map((cat: any, i: number) => (
                                <div key={i} onClick={() => setActiveCategory(cat.name)} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-sm border border-gray-200 cursor-pointer hover:border-[#00458c]/30 hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
                                    <h3 className="font-bold text-gray-900 text-sm mb-1">{cat.name}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-1 mb-3">{cat.description}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-[10px] font-bold text-[#00458c] bg-[#00458c]/10 px-2 py-0.5 rounded">{cat.count > 0 ? `${cat.count}+ Live` : 'Coming Soon'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 6: Trending Across WealthMax */}
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            Trending <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] uppercase font-bold rounded">Hot</span>
                        </h2>
                        
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Top Mutual Funds</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {data.trendingAcrossWealthMax.mutualFunds.slice(0,4).map((mf: any, i: number) => (
                                <div key={i} onClick={() => navigate(`/marketplace/product/${mf.id}`)} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-gray-900 truncate">{mf.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{mf.amc}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <p className="text-sm font-extrabold text-emerald-600">{mf.return}</p>
                                        <p className="text-[9px] text-gray-400 uppercase font-bold">3Y CAGR</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Most Active Stocks</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.trendingAcrossWealthMax.stocks.slice(0,4).map((stock: any, i: number) => (
                                <div key={i} onClick={() => navigate(`/marketplace/product/${stock.id}`)} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-gray-900 truncate">{stock.name}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{stock.amc}</p>
                                    </div>
                                    <button className="shrink-0 text-xs font-bold text-[#00458c] bg-[#00458c]/10 px-3 py-1.5 rounded-lg hover:bg-[#00458c]/20 transition-colors">Trade</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column (Narrower) */}
                <div className="flex flex-col gap-8">
                    
                    {/* Section 7: Recommended For You */}
                    <section className="bg-gradient-to-b from-[#00458c]/5 to-transparent rounded-2xl p-5 border border-[#00458c]/10">
                        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-[#00458c]" /> For Your Portfolio
                        </h2>
                        <div className="space-y-4">
                            {data.recommendedForYou.map((rec: any, i: number) => (
                                <div key={i} onClick={() => navigate(`/marketplace/product/${rec.id}`)} className="bg-white rounded-xl p-4 shadow-sm border border-[#00458c]/10 cursor-pointer hover:-translate-y-1 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-sm text-gray-900">{rec.name}</p>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{rec.matchScore}% Match</span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                                        "{rec.reason}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 10: Financial Health */}
                    <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h2 className="text-base font-bold text-gray-900 mb-4">Financial Health</h2>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Risk Score</p>
                                <p className="text-2xl font-black text-[#00458c]">{data.financialHealth.riskScore}<span className="text-sm text-gray-400 font-normal">/100</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Status</p>
                                <p className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">{data.financialHealth.healthStatus}</p>
                            </div>
                        </div>
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Asset Allocation</h3>
                        <div className="flex h-3 rounded-full overflow-hidden mb-2">
                            {data.financialHealth.assetAllocation.map((asset: any, i: number) => (
                                <div key={i} style={{ width: `${asset.value}%`, backgroundColor: asset.color }} />
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-600">
                            {data.financialHealth.assetAllocation.map((asset: any, i: number) => (
                                <span key={i} className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }}></span>
                                    {asset.name} ({asset.value}%)
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Section 9: Market News */}
                    <section>
                        <h2 className="text-base font-bold text-gray-900 mb-4">Latest Headlines</h2>
                        <div className="space-y-4">
                            {data.marketIntelligence.map((news: any, i: number) => (
                                <a key={i} href={news.link} target="_blank" rel="noopener noreferrer" className="block group">
                                    <p className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-[#00458c] transition-colors mb-1">{news.title}</p>
                                    <p className="text-[10px] text-gray-500">{news.publisher} • {new Date(news.providerPublishTime * 1000).toLocaleDateString()}</p>
                                </a>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
