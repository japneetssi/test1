import { Briefcase, ArrowUpRight, PieChart } from "lucide-react";

interface PortfolioData {
    currentValue: number;
    investedAmount: number;
    totalReturns: number;
    absoluteReturns: number;
    xirr: number;
    todaysReturns: number;
    todaysReturnsPercent: number;
}

export function PortfolioInsights({ data }: { data: PortfolioData }) {
    if (!data) return null;

    return (
        <section className="mb-10 bg-[#00458c] text-white p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <PieChart className="w-64 h-64" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-8 text-white/80">
                    <Briefcase className="h-5 w-5" />
                    <h2 className="font-semibold tracking-wide uppercase text-sm">Your Mutual Fund Portfolio</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <p className="text-white/60 text-sm font-medium mb-1">Current Value</p>
                        <h3 className="text-4xl font-extrabold tracking-tight">₹{(data.currentValue / 100000).toFixed(2)}L</h3>
                    </div>
                    
                    <div className="flex flex-col justify-center">
                        <p className="text-white/60 text-sm font-medium mb-1">Invested Amount</p>
                        <p className="text-xl font-bold">₹{(data.investedAmount / 100000).toFixed(2)}L</p>
                    </div>

                    <div className="flex flex-col justify-center">
                        <p className="text-white/60 text-sm font-medium mb-1">Total Returns</p>
                        <div className="flex items-end gap-2">
                            <p className="text-xl font-bold text-emerald-400">₹{(data.totalReturns / 100000).toFixed(2)}L</p>
                            <span className="text-sm font-semibold text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded flex items-center gap-0.5">
                                <ArrowUpRight className="h-3 w-3" />
                                {data.absoluteReturns}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20 flex gap-6">
                    <div>
                        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">XIRR</p>
                        <p className="font-bold text-lg mt-0.5">{data.xirr}%</p>
                    </div>
                    <div>
                        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">1D Returns</p>
                        <p className="font-bold text-lg mt-0.5 text-emerald-400">+₹{data.todaysReturns} ({data.todaysReturnsPercent}%)</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
