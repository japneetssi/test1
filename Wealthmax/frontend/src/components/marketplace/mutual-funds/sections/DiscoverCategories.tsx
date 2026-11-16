import { ChevronRight } from "lucide-react";

export function DiscoverCategories() {
    const categories = [
        { name: "Large Cap", icon: "🏢", count: 42, color: "bg-blue-50 border-blue-100" },
        { name: "Mid Cap", icon: "🏭", count: 35, color: "bg-emerald-50 border-emerald-100" },
        { name: "Small Cap", icon: "🚀", count: 28, color: "bg-purple-50 border-purple-100" },
        { name: "Flexi Cap", icon: "🔀", count: 40, color: "bg-amber-50 border-amber-100" },
        { name: "ELSS", icon: "🛡️", count: 38, color: "bg-rose-50 border-rose-100" },
        { name: "Index Funds", icon: "📊", count: 45, color: "bg-cyan-50 border-cyan-100" },
        { name: "Debt", icon: "🏦", count: 120, color: "bg-slate-50 border-slate-100" },
        { name: "Hybrid", icon: "⚖️", count: 65, color: "bg-indigo-50 border-indigo-100" }
    ];

    return (
        <section className="mb-10">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">Discover Categories</h2>
            <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                {categories.map(cat => (
                    <div key={cat.name} className={`shrink-0 w-[160px] p-5 rounded-2xl border cursor-pointer hover:shadow-md transition-all group ${cat.color}`}>
                        <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-bottom-left">{cat.icon}</div>
                        <h3 className="font-bold text-gray-900 leading-tight mb-1">{cat.name}</h3>
                        <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-gray-500 font-medium">{cat.count} funds</span>
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                <ChevronRight className="h-3 w-3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
