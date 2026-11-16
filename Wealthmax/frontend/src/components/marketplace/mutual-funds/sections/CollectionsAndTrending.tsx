import { Product } from "../../../ProductCard";
import { PremiumFundCard } from "../shared/PremiumFundCard";
import { ChevronRight } from "lucide-react";

interface Collection {
    id: string;
    title: string;
    subtitle: string;
    fundCount: number;
    icon: string;
}

export function CollectionsAndTrending({ collections, trending, onInvest, onFactsheet, onCompare }: { collections: Collection[], trending: Product[], onInvest: any, onFactsheet: any, onCompare: any }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            {/* Top Collections - 4 Columns */}
            <div className="lg:col-span-4 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-extrabold text-gray-900">Collections</h2>
                    <button className="text-sm font-semibold text-[#00458c] hover:text-[#005bb5]">See All</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 flex-1">
                    {collections.map(col => (
                        <div key={col.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#00458c]/20 transition-all cursor-pointer flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl group-hover:bg-[#00458c]/5 transition-colors shrink-0">
                                {col.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 group-hover:text-[#00458c] transition-colors truncate">{col.title}</h4>
                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{col.subtitle}</p>
                            </div>
                            <div className="shrink-0 text-xs font-bold text-gray-400 group-hover:text-[#00458c] transition-colors flex items-center gap-1">
                                {col.fundCount} <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trending Funds - 8 Columns */}
            <div className="lg:col-span-8 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-extrabold text-gray-900">Trending Funds</h2>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar">
                    {trending.map(fund => (
                        <div key={fund.id} className="w-[300px] shrink-0">
                            <PremiumFundCard 
                                fund={fund} 
                                onInvest={() => onInvest(fund)}
                                onFactsheet={() => onFactsheet(fund.id)}
                                onCompare={() => onCompare(fund)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
