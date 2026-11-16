import React from 'react';
import { Search, Bell, Bookmark, PieChart, SlidersHorizontal, ArrowRightLeft } from 'lucide-react';

export const CompactHeader = () => {
    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative w-full md:max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#00458c] transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00458c]/20 focus:border-[#00458c] sm:text-sm transition-all"
                        placeholder="Search for stocks, ETFs, indices (e.g. HDFC Bank)..."
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">⌘K</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar hide-scrollbar">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-[#00458c] hover:bg-[#00458c]/5 transition-colors whitespace-nowrap">
                        <Bookmark className="h-4 w-4" />
                        Watchlist
                    </button>
                    <div className="w-px h-4 bg-gray-200 shrink-0"></div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-[#00458c] hover:bg-[#00458c]/5 transition-colors whitespace-nowrap">
                        <PieChart className="h-4 w-4" />
                        Portfolio
                    </button>
                    <div className="w-px h-4 bg-gray-200 shrink-0"></div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-[#00458c] hover:bg-[#00458c]/5 transition-colors whitespace-nowrap">
                        <SlidersHorizontal className="h-4 w-4" />
                        Screener
                    </button>
                    <div className="w-px h-4 bg-gray-200 shrink-0"></div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-[#00458c] hover:bg-[#00458c]/5 transition-colors whitespace-nowrap">
                        <ArrowRightLeft className="h-4 w-4" />
                        Compare
                    </button>
                    <div className="w-px h-4 bg-gray-200 shrink-0"></div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-[#00458c] hover:bg-[#00458c]/5 transition-colors whitespace-nowrap">
                        <Bell className="h-4 w-4" />
                        Alerts
                    </button>
                </div>
            </div>
        </div>
    );
};
