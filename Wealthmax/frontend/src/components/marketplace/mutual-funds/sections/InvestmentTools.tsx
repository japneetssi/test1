import { Calculator, Target, ShieldAlert, PieChart, Landmark, ArrowRight } from "lucide-react";

export function InvestmentTools() {
    const tools = [
        { name: "SIP Calculator", icon: <Calculator className="text-blue-500" /> },
        { name: "Goal Planner", icon: <Target className="text-red-500" /> },
        { name: "Risk Analyzer", icon: <ShieldAlert className="text-amber-500" /> },
        { name: "Portfolio Analyzer", icon: <PieChart className="text-purple-500" /> },
        { name: "Tax Saving", icon: <Landmark className="text-emerald-500" /> },
    ];

    return (
        <section className="mb-10">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">Investment Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {tools.map(tool => (
                    <div key={tool.name} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#00458c]/30 transition-all cursor-pointer group flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            {tool.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#00458c] transition-colors">{tool.name}</h3>
                    </div>
                ))}
            </div>
        </section>
    );
}
