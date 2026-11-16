import { Loader2, Search } from "lucide-react";
import { ProductCard, Product } from "./ProductCard";

interface MarketplaceGridProps {
    loading: boolean;
    products: Product[];
    totalCount: number;
    activeCategory: string;
    hasMore: boolean;
    lastElementRef: (node: HTMLDivElement) => void;
    riskColor: (r: string) => string;
    categoryColor: (c: string) => string;
    onInvest: (product: Product) => void;
    onFactsheet: (id: string) => void;
    resetFilters: () => void;
}

export function MarketplaceGrid({
    loading, products, totalCount, activeCategory,
    hasMore, lastElementRef, riskColor, categoryColor,
    onInvest, onFactsheet, resetFilters
}: MarketplaceGridProps) {

    return (
        <main className="flex-1 flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-white/40 backdrop-blur-md px-4 py-3 rounded-xl border border-white/50 shadow-sm animate-enter animate-delay-1 shrink-0">
                <p className="text-sm text-gray-600 font-medium flex flex-wrap items-center gap-2">
                    Showing <span className="text-gradient-brand text-lg font-extrabold">{totalCount.toLocaleString()}</span> products in <span className="text-[#00458c] font-bold">{activeCategory}</span>
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 text-[#00458c]" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                        {products.map((product, index) => (
                            <ProductCard
                                key={`${product.id}-${index}`}
                                product={product}
                                index={index}
                                riskColor={riskColor}
                                categoryColor={categoryColor}
                                onInvest={() => onInvest(product)}
                                onFactsheet={() => onFactsheet(product.id)}
                            />
                        ))}
                        {products.length === 0 && (
                            <div className="col-span-1 lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-32 text-center glass-panel animate-enter h-full">
                                <div className="bg-white/50 p-6 rounded-full mb-4 shadow-sm">
                                    <Search className="h-12 w-12 text-gray-400" />
                                </div>
                                <p className="text-xl text-gray-600 font-bold mb-2">No products found</p>
                                <p className="text-sm text-gray-500 font-medium max-w-sm">No {activeCategory !== "All" ? activeCategory : ""} products match your current filters.</p>
                                <button 
                                    onClick={resetFilters}
                                    className="mt-6 btn-glass-secondary font-bold"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {hasMore && products.length > 0 && (
                        <div ref={lastElementRef} className="py-6 flex justify-center items-center w-full">
                            <Loader2 className="animate-spin h-6 w-6 text-[#00458c]" />
                            <span className="ml-2 text-sm text-gray-500 font-medium">Loading more schemes...</span>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
