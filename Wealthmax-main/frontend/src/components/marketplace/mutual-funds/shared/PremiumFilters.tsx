import { Filter, X, ChevronDown, Check } from "lucide-react";

interface PremiumFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        categories: string[];
        amcs: string[];
        risks: string[];
    };
    activeFilters: {
        categories: string[];
        amcs: string[];
        risks: string[];
    };
    onFilterChange: (type: 'categories' | 'amcs' | 'risks', value: string) => void;
    onClearAll: () => void;
}

export function PremiumFilters({ isOpen, onClose, filters, activeFilters, onFilterChange, onClearAll }: PremiumFiltersProps) {
    if (!isOpen) return null;

    const FilterSection = ({ title, options, active, type }: { title: string, options: string[], active: string[], type: 'categories' | 'amcs' | 'risks' }) => (
        <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                {title}
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </h4>
            <div className="space-y-2">
                {options.map(option => {
                    const isSelected = active.includes(option);
                    return (
                        <label key={option} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#00458c] border-[#00458c]' : 'border-gray-300 group-hover:border-[#00458c]'}`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                {option}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="w-72 shrink-0 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-140px)] sticky top-24">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#00458c]" />
                    <span className="font-bold text-gray-900">Filters</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md transition-colors lg:hidden">
                    <X className="h-4 w-4 text-gray-500" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <FilterSection title="Category" options={filters.categories} active={activeFilters.categories} type="categories" />
                <FilterSection title="Risk Profile" options={filters.risks} active={activeFilters.risks} type="risks" />
                <FilterSection title="Fund House" options={filters.amcs} active={activeFilters.amcs} type="amcs" />
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button 
                    onClick={onClearAll}
                    className="w-full py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                >
                    Clear All Filters
                </button>
            </div>
        </div>
    );
}
