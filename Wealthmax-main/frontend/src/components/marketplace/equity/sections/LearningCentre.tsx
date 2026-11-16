import React from 'react';
import { BookOpen, PlayCircle, FileText, Lightbulb } from 'lucide-react';

export const LearningCentre = () => {
    return (
        <div>
            <div className="flex items-center justify-between mb-4 mt-8">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-[#00458c]" />
                    Learning Centre
                </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="mb-4 text-[#00458c] bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlayCircle className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Basics of Stock Market</h3>
                    <p className="text-sm text-gray-500">Learn what stocks are, how the market works, and how to start investing.</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="mb-4 text-purple-600 bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Fundamental Analysis</h3>
                    <p className="text-sm text-gray-500">How to read balance sheets, P&L statements, and evaluate company health.</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="mb-4 text-emerald-600 bg-emerald-50 w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Technical Analysis</h3>
                    <p className="text-sm text-gray-500">Understanding charts, trends, support/resistance, and technical indicators.</p>
                </div>

                <div className="bg-[image:var(--gradient-accent)] rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden text-white flex flex-col justify-between">
                    <div className="absolute inset-0 bg-white/10 opacity-50 backdrop-blur-3xl mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-2">WealthMax Masterclass</h3>
                        <p className="text-sm text-white/90">Join live webinars with top industry experts.</p>
                    </div>
                    <button className="relative z-10 mt-4 bg-white text-[#00458c] text-sm font-bold py-2 px-4 rounded-lg self-start">
                        Register Now
                    </button>
                </div>

            </div>
        </div>
    );
};
