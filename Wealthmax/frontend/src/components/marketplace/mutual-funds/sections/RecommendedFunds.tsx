import { Sparkles } from "lucide-react";
import { Product } from "../../../ProductCard";
import { PremiumFundCard } from "../shared/PremiumFundCard";

interface RecommendedFundsProps {
    funds: Product[];
    onInvest: (fund: Product) => void;
    onFactsheet: (id: string) => void;
    onCompare: (fund: Product) => void;
}

export function RecommendedFunds({ funds, onInvest, onFactsheet, onCompare }: RecommendedFundsProps) {
    if (!funds || funds.length === 0) return null;

    return (
        <section className="mb-10 bg-gradient-to-r from-amber-50 to-orange-50/30 -mx-4 px-4 py-8 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12 rounded-3xl border border-amber-100/50">
            <div className="flex items-center gap-2 mb-6">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-lg shadow-sm">
                    <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-gray-900">Recommended For You</h2>
                    <p className="text-sm text-gray-600 mt-0.5 font-medium">AI-powered picks based on your Aggressive risk profile</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {funds.map(fund => (
                    <div key={fund.id} className="relative">
                        {/* Recommendation Reason Tooltip/Badge */}
                        <div className="absolute -top-3 left-4 z-10 bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md border border-gray-700">
                            ✨ {(fund as any).reason || 'Matches your profile'}
                        </div>
                        <PremiumFundCard 
                            fund={fund} 
                            onInvest={() => onInvest(fund)}
                            onFactsheet={() => onFactsheet(fund.id)}
                            onCompare={() => onCompare(fund)}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
