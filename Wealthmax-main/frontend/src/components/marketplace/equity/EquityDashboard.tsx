import React from "react";
import { CompactHeader } from "./sections/CompactHeader";
import { MarketSnapshot } from "./sections/MarketSnapshot";
import { ContinueExploring } from "./sections/ContinueExploring";
import { EquityPortfolio } from "./sections/EquityPortfolio";
import { MarketOpportunities } from "./sections/MarketOpportunities";
import { RecommendedForYou } from "./sections/RecommendedForYou";
import { DiscoverStocks } from "./sections/DiscoverStocks";
import { TrendingStocks } from "./sections/TrendingStocks";
import { MarketIntelligence } from "./sections/MarketIntelligence";
import { StockAnalysisTools } from "./sections/StockAnalysisTools";
import { LearningCentre } from "./sections/LearningCentre";
import { BrowseAllStocks } from "./sections/BrowseAllStocks";

export const EquityDashboard = () => {
    return (
        <div className="flex flex-col w-full min-h-screen bg-gray-50 pb-20 animate-enter">
            {/* Top Fixed Header with search and global actions */}
            <CompactHeader />
            
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                
                {/* Top Section - Live Market Pulses */}
                <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <MarketSnapshot />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - User specific and active trading insights */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <ContinueExploring />
                        </section>
                        
                        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <RecommendedForYou />
                        </section>
                        
                        <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <TrendingStocks />
                        </section>
                        
                        <section className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            <MarketOpportunities />
                        </section>

                    </div>
                    
                    {/* Right Column - Portfolio, News, Tools */}
                    <div className="space-y-8">
                        
                        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <EquityPortfolio />
                        </section>

                        <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <MarketIntelligence />
                        </section>

                        <section className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <StockAnalysisTools />
                        </section>
                    </div>
                </div>

                {/* Bottom Wide Sections - Discovery and Learning */}
                <section className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <DiscoverStocks />
                </section>
                
                <section className="animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                    <LearningCentre />
                </section>

                <section className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                    <BrowseAllStocks />
                </section>

            </div>
        </div>
    );
};
