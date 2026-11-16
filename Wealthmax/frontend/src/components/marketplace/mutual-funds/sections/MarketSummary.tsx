import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface Category {
    id: string;
    name: string;
    return: string;
    risk: string;
    count: number;
    trending: boolean;
}

export function MarketSummary({ categories }: { categories: Category[] }) {
    if (!categories || categories.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-gray-900">Market Summary</h2>
                <button className="text-sm font-semibold text-[#00458c] hover:text-[#005bb5] flex items-center gap-1 group">
                    View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900 text-sm group-hover:text-[#00458c] transition-colors">{cat.name}</span>
                            {cat.trending ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
                        </div>
                        <div className="flex flex-col mt-3">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Avg Return</span>
                            <span className="text-lg font-extrabold text-emerald-600">+{cat.return}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs">
                            <span className="text-gray-500 font-medium">{cat.count} funds</span>
                            <span className="px-2 py-0.5 bg-gray-50 rounded text-gray-600 font-semibold">{cat.risk}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
