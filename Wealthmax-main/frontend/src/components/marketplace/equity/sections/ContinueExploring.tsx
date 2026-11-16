import React from 'react';
import { History, Bookmark, SlidersHorizontal, ArrowRight } from 'lucide-react';

export const ContinueExploring = () => {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Continue Exploring</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-[#00458c] group-hover:bg-[#00458c] group-hover:text-white transition-colors">
                            <History className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Recently Viewed</h3>
                            <p className="text-xs text-gray-500">TCS, HDFCBANK, RELIANCE</p>
                        </div>
                    </div>
                    <div className="flex items-center text-sm font-medium text-[#00458c] group-hover:translate-x-1 transition-transform">
                        View History <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Bookmark className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Core Watchlist</h3>
                            <p className="text-xs text-gray-500">12 stocks tracked</p>
                        </div>
                    </div>
                    <div className="flex items-center text-sm font-medium text-purple-600 group-hover:translate-x-1 transition-transform">
                        Open Watchlist <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <SlidersHorizontal className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Saved Screeners</h3>
                            <p className="text-xs text-gray-500">High Dividend, Undervalued</p>
                        </div>
                    </div>
                    <div className="flex items-center text-sm font-medium text-green-600 group-hover:translate-x-1 transition-transform">
                        View Screeners <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                </div>
            </div>
        </div>
    );
};
