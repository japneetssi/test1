import React from 'react';
import { Microscope, Activity, LayoutGrid, FileText, ArrowRight } from 'lucide-react';

export const StockAnalysisTools = () => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Microscope className="h-5 w-5 text-indigo-600" />
                    Analysis Tools
                </h2>
            </div>
            
            <div className="p-2">
                <div className="grid grid-cols-1 gap-2">
                    
                    <div className="p-3 rounded-lg hover:bg-indigo-50/50 transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-indigo-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-indigo-100 flex items-center justify-center text-indigo-700">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Technical Screener</h3>
                                <p className="text-[10px] text-gray-500">Find stocks based on RSI, MACD, Moving Averages</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>

                    <div className="p-3 rounded-lg hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-emerald-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-emerald-100 flex items-center justify-center text-emerald-700">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Fundamental Screener</h3>
                                <p className="text-[10px] text-gray-500">Filter by PE, PB, ROE, Debt/Equity ratios</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </div>

                    <div className="p-3 rounded-lg hover:bg-amber-50/50 transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-amber-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-amber-100 flex items-center justify-center text-amber-700">
                                <LayoutGrid className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Sector Heatmaps</h3>
                                <p className="text-[10px] text-gray-500">Visual performance of sectors and constituents</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
                    </div>

                </div>
            </div>
        </div>
    );
};
