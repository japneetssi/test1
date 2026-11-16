import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Info, Loader2 } from "lucide-react";
import api from '@/lib/api';

export default function PersonaCard() {
    const [personaMetrics, setPersonaMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/profile');
                if (data?.data?.persona_data) {
                    setPersonaMetrics(data.data.persona_data);
                }
            } catch (error) {
                console.error("Failed to load persona data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 items-center justify-center min-h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!personaMetrics) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center flex-1 min-h-[300px]">
                <p className="text-slate-500 mb-4 font-medium">Complete your profiling to generate your Financial Persona.</p>
                <Link to="/survey" className="bg-[#f37920] hover:bg-[#e06b18] text-white px-6 py-2 rounded font-semibold text-sm">
                    Start Survey
                </Link>
            </div>
        );
    }

    const personaName = personaMetrics.persona?.name || "The Balanced Builder";
    const backendRatios = personaMetrics.metrics?.ratios || { expenses: 40, liabilities: 20, investments: 30, emergency_fund: 10 };
    const devs = personaMetrics.deviations || { 
        expenses: { ideal: 30 }, 
        liabilities: { ideal: 20 }, 
        investments: { ideal: 40 }, 
        emergency_fund: { ideal: 10 } 
    };
    const insight = personaMetrics.behavior?.description || "Your baseline is solid, but reallocating 10% from discretionary expenses to investments will optimize your long-term growth trajectory.";

    const getBarColor = (actual: number, target: number, metricId: string) => {
        switch (metricId) {
            case 'exp':
            case 'emi':
                // Lower is better: Expenses & Liabilities
                if (actual <= target + 5) return "#10b981";   // Green (Allow 5% buffer)
                if (actual <= target + 15) return "#f59e0b";  // Orange
                return "#ef4444";                             // Red

            case 'inv':
            case 'emg':
                // Higher is better: Investments & Emergency Fund
                if (actual >= target) return "#10b981";       // Green
                if (actual >= target * 0.5) return "#f59e0b"; // Orange (Allow down to half of target)
                return "#ef4444";                             // Red

            default:
                return "#10b981";
        }
    };

    const metrics = [
        { id: 'exp', name: "Expenses", actual: Math.round(backendRatios.expenses), target: devs.expenses.ideal, icon: "💳" },
        { id: 'emi', name: "Liabilities", actual: Math.round(backendRatios.liabilities), target: devs.liabilities.ideal, icon: "🏦" },
        { id: 'inv', name: "Investments", actual: Math.round(backendRatios.investments), target: devs.investments.ideal, icon: "📈" },
        { id: 'emg', name: "Emergency Fund", actual: Math.round(backendRatios.emergency_fund), target: devs.emergency_fund.ideal, icon: "🛡️" },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
            {/* Header */}
            <div className="border-b border-slate-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Financial Persona: {personaName}</h2>
                    <div className="group relative cursor-help flex items-center justify-center">
                        <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-56 bg-slate-800 text-white text-xs p-2.5 rounded-lg shadow-xl z-20">
                            The 30-30-30-10 Rule suggests allocating 30% to Expenses, 30% to EMI, 30% to Investments, and 10% to Emergency/Liquidity.
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="p-6 flex-1 flex flex-col gap-5">
                {metrics.map(m => {
                    const barColor = getBarColor(m.actual, m.target, m.id);
                    const fillWidth = `${Math.min(100, (m.actual / Math.max(m.target * 2, 100)) * 100)}%`;
                    const targetLineLeft = `${(m.target / Math.max(m.target * 2, 100)) * 100}%`;

                    return (
                        <div key={m.id} className="flex items-center gap-4">
                            {/* Left Label */}
                            <div className="w-36 flex items-center gap-3 shrink-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-base border border-slate-100">{m.icon}</div>
                                <span className="font-bold text-slate-600 text-xs tracking-wide uppercase">{m.name}</span>
                            </div>

                            {/* Middle (Progress Bar) */}
                            <div className="flex-1 relative h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: fillWidth, backgroundColor: barColor }}
                                />
                                <div
                                    className="absolute top-0 bottom-0 w-[3px] bg-slate-800 z-10"
                                    style={{ left: targetLineLeft }}
                                />
                            </div>

                            {/* Right Values */}
                            <div className="w-20 text-right shrink-0">
                                <p className="text-[13px] font-bold text-slate-800">Act: {m.actual}%</p>
                                <p className="text-[11px] font-bold text-slate-400 mt-0.5">Tgt: {m.target}%</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Summary */}
            <div className="bg-blue-50/50 p-5 m-6 mt-2 rounded-xl border border-blue-100/50">
                <h4 className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1.5">AI Diagnostic Insight</h4>
                <p className="text-sm text-blue-900 font-medium leading-relaxed">
                    {insight}
                </p>
            </div>
        </div>
    );
}
