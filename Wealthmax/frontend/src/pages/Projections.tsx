import { useState, useMemo, useEffect } from "react";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from "recharts";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { SlidersHorizontal, TrendingUp, LifeBuoy, Target, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Switch } from "@/components/ui/switch";

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtAmount = (v: number) => {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)} L`;
    return `₹${(v / 1000).toFixed(0)}K`;
};

const fmtTick = (v: number) => {
    if (v >= 10000000) return `${(v / 10000000).toFixed(0)} Cr`;
    if (v >= 100000) return `${(v / 100000).toFixed(0)} L`;
    return `${(v / 1000).toFixed(0)}K`;
};

// ── Custom Tooltip: SIP Chart ─────────────────────────────────────────────────
const SIPTooltip = ({ active, payload, label, goals }: any) => {
    if (!active || !payload) return null;
    const invested = payload.find((p: any) => p.dataKey === "invested")?.value || 0;
    const gain = payload.find((p: any) => p.dataKey === "gain")?.value || 0;
    const total = invested + gain;
    const goalsForYear = (goals || []).filter((g: any) => g.year === label);
    return (
        <div className="bg-white border border-gray-200 shadow-xl rounded-lg p-3 text-xs min-w-[190px]">
            <p className="font-bold text-[#00458c] text-sm mb-2">Year {label}</p>
            <div className="space-y-1">
                <div className="flex justify-between gap-4"><span className="text-gray-500">Total Invested</span><span className="font-bold text-gray-800">{fmtAmount(invested)}</span></div>
                <div className="flex justify-between gap-4"><span className="text-gray-500">Wealth Gained</span><span className="font-bold text-[#00458c]">{fmtAmount(gain)}</span></div>
                <div className="flex justify-between gap-4 border-t border-gray-100 pt-1"><span className="text-gray-600 font-semibold">Total Corpus</span><span className="font-extrabold text-[#f37920]">{fmtAmount(total)}</span></div>
            </div>
            {goalsForYear.length > 0 && (
                <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                    {goalsForYear.map((g: any) => {
                        const funded = total >= g.target_amount;
                        return (
                            <div key={g.id} className={`flex items-center gap-2 ${funded ? "text-green-600" : "text-orange-500"}`}>
                                {funded ? <CheckCircle className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
                                <span className="font-semibold">{g.name}: {fmtAmount(g.target_amount)}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ── Custom Tooltip: Glide Path ────────────────────────────────────────────────
const GlideTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    const equity = payload.find((p: any) => p.dataKey === "equity")?.value || 0;
    const debt = payload.find((p: any) => p.dataKey === "debt")?.value || 0;
    return (
        <div className="bg-white border border-gray-200 shadow-xl rounded-lg p-3 text-xs min-w-[160px]">
            <p className="font-bold text-[#00458c] text-sm mb-2">Age {label}</p>
            <div className="space-y-1">
                <div className="flex justify-between gap-4"><span className="text-gray-500">Equity</span><span className="font-bold text-[#00458c]">{equity}%</span></div>
                <div className="flex justify-between gap-4"><span className="text-gray-500">Debt</span><span className="font-bold text-[#f37920]">{debt}%</span></div>
            </div>
        </div>
    );
};

// ── Slider Component ──────────────────────────────────────────────────────────
const Slider = ({ label, value, min, max, step, unit, onChange, color = "#00458c", enabled, onToggle }: {
    label: string; value: number; min: number; max: number; step: number;
    unit: string; onChange: (v: number) => void; color?: string;
    enabled?: boolean; onToggle?: (v: boolean) => void;
}) => (
    <div className={`mb-6 group ${enabled === false ? 'opacity-60 grayscale' : ''} transition-all duration-300`}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-700 transition-colors">{label}</span>
                {onToggle && (
                    <Switch 
                        checked={enabled} 
                        onCheckedChange={onToggle}
                        className="scale-[0.6] origin-left -ml-1"
                    />
                )}
            </div>
            <span className="text-sm font-extrabold px-2 py-0.5 rounded bg-gray-50 border border-gray-100 shadow-sm transition-colors" style={{ color: enabled === false ? '#9ca3af' : color }}>
                {Number(value).toLocaleString("en-IN")}{unit}
            </span>
        </div>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            disabled={enabled === false}
            className={`w-full h-2 rounded-full appearance-none transition-colors ${enabled === false ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'}`}
            style={{ accentColor: enabled === false ? '#9ca3af' : color }}
        />
        <div className="flex justify-between text-[10px] font-medium text-gray-400 mt-1.5">
            <span>{min.toLocaleString("en-IN")}{unit}</span>
            <span>{max.toLocaleString("en-IN")}{unit}</span>
        </div>
    </div>
);

// ── Goal Feasibility Badge ────────────────────────────────────────────────────
const GoalFeasibilityBadge = ({ goal, sipData }: { goal: any; sipData: any[] }) => {
    const yearIndex = (goal.year || 0) - 1;
    const corpusAtYear = sipData[Math.min(yearIndex, sipData.length - 1)]?.total || 0;
    const pct = goal.target_amount > 0 ? Math.round((corpusAtYear / goal.target_amount) * 100) : 0;

    const status = pct >= 100 ? "funded" : pct >= 60 ? "partial" : "at-risk";
    const colors = {
        funded: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700", icon: CheckCircle },
        partial: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", icon: AlertCircle },
        "at-risk": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700", icon: AlertCircle },
    };
    const c = colors[status];
    const Icon = c.icon;

    return (
        <div className={`bg-white border ${c.border} rounded-xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${status === "funded" ? "bg-green-500" : status === "partial" ? "bg-orange-500" : "bg-red-500"}`}></div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.badge} shadow-inner`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-bold text-gray-800 truncate group-hover:text-[#00458c] transition-colors`}>{goal.name}</p>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${c.badge} border ${c.border}`}>
                        {status === "funded" ? "✓ Funded" : status === "partial" ? "Partial" : "At Risk"}
                    </span>
                </div>
                <p className="text-[11px] font-medium text-gray-500 mt-1">Target: <span className="font-bold text-gray-700">{fmtAmount(goal.target_amount)}</span> by {new Date(goal.target_date).getFullYear()}</p>
                <div className="mt-3 relative h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                            width: `${Math.min(100, pct)}%`, 
                            backgroundImage: status === "funded" ? "linear-gradient(to right, #22c55e, #16a34a)" : status === "partial" ? "linear-gradient(to right, #f97316, #ea580c)" : "linear-gradient(to right, #ef4444, #dc2626)",
                            boxShadow: "0 0 10px rgba(0,0,0,0.1) inset" 
                        }}
                    />
                </div>
                <div className="flex justify-between items-center mt-1.5">
                    <p className={`text-[10px] font-bold ${c.text}`}>Corpus: {fmtAmount(corpusAtYear)}</p>
                    <p className={`text-[10px] font-extrabold ${c.text}`}>{pct}%</p>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Projections() {
    const [profileLoading, setProfileLoading] = useState(true);
    const [sip, setSip] = useState(10000);
    const [stepUp, setStepUp] = useState(10);
    const [equityReturn, setEquityReturn] = useState(12);
    const [debtReturn, setDebtReturn] = useState(7);
    const [inflation, setInflation] = useState(6);
    const [enableEquityReturn, setEnableEquityReturn] = useState(true);
    const [enableDebtReturn, setEnableDebtReturn] = useState(true);
    const [enableInflation, setEnableInflation] = useState(false);
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(60);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [goals, setGoals] = useState<any[]>([]);
    const [initialCorpus, setInitialCorpus] = useState(0);

    // ── Pre-populate from backend profile ──
    useEffect(() => {
        const loadData = async () => {
            try {
                const [profileRes, goalsRes, portfolioRes] = await Promise.all([
                    api.get('/profile'),
                    api.get('/goals'),
                    api.get('/portfolio/summary')
                ]);

                const profile = profileRes.data?.data;
                if (profile) {
                    // Derive monthly SIP from surplus (Income - Expenses - EMI)
                    const monthlyIncome = (profile.gross_income || 0) / 12;
                    const monthlySurplus = monthlyIncome - (profile.fixed_expenses || 0) - (profile.monthly_emi || 0);
                    if (monthlySurplus > 1000) setSip(Math.round(monthlySurplus / 500) * 500);

                    // Set age from profile if available
                    if (profile.age) {
                        const age = Number(profile.age);
                        setCurrentAge(age);
                        setRetirementAge(Math.max(age + 20, 60));
                    }

                    // Adjust return assumptions based on risk class
                    const riskClass = profile.risk_class;
                    if (riskClass === "Aggressive") { setEquityReturn(14); setDebtReturn(7); }
                    else if (riskClass === "Conservative") { setEquityReturn(9); setDebtReturn(7); }
                    else { setEquityReturn(12); setDebtReturn(7); }

                    setProfileLoaded(true);
                }

                // Set initial corpus from portfolio
                if (portfolioRes.data?.data?.totalValuation) {
                    setInitialCorpus(portfolioRes.data.data.totalValuation);
                }

                // Load goals
                const rawGoals = goalsRes.data?.data || [];
                const currentYear = new Date().getFullYear();
                const enriched = rawGoals.map((g: any) => ({
                    ...g,
                    year: new Date(g.target_date).getFullYear() - currentYear,
                })).filter((g: any) => g.year > 0 && g.year <= 30);
                setGoals(enriched);

            } catch (e) {
                console.error("Failed to load profile/goals", e);
            } finally {
                setProfileLoading(false);
            }
        };
        loadData();
    }, []);

    // ── Glide Path ──
    const glideData = useMemo(() => {
        const data = [];
        for (let age = currentAge; age <= retirementAge; age++) {
            const yearsToRetire = retirementAge - age;
            let equity = Math.min(80, Math.max(20, 100 - age));
            if (yearsToRetire <= 10) equity = Math.max(20, Math.round(equity - (10 - yearsToRetire) * 3));
            data.push({ age, equity, debt: 100 - equity });
        }
        return data;
    }, [currentAge, retirementAge]);

    // ── SIP Projection Calculation ──
    const sipData = useMemo(() => {
        const data = [];
        let corpus = initialCorpus;
        let monthlySIP = sip;
        let totalInvested = initialCorpus;

        for (let year = 1; year <= 30; year++) {
            if (year > 1) monthlySIP = monthlySIP * (1 + stepUp / 100);
            
            // Calculate blended return for this year based on glide path
            const projAge = currentAge + year - 1;
            let equityPct = 80;
            let debtPct = 20;
            
            const glidePoint = glideData.find(g => g.age === projAge);
            if (glidePoint) {
                equityPct = glidePoint.equity;
                debtPct = glidePoint.debt;
            } else if (projAge > retirementAge) {
                const lastGlide = glideData[glideData.length - 1];
                if (lastGlide) {
                    equityPct = lastGlide.equity;
                    debtPct = lastGlide.debt;
                }
            } else {
                equityPct = glideData[0]?.equity ?? 80;
                debtPct = glideData[0]?.debt ?? 20;
            }

            const effectiveEquityReturn = enableEquityReturn ? equityReturn : 0;
            const effectiveDebtReturn = enableDebtReturn ? debtReturn : 0;
            const effectiveInflation = enableInflation ? inflation : 0;
            const nominalReturn = (equityPct / 100) * effectiveEquityReturn + (debtPct / 100) * effectiveDebtReturn;
            const annualBlendedReturn = nominalReturn - effectiveInflation;
            const monthlyRate = annualBlendedReturn / 100 / 12;

            for (let m = 0; m < 12; m++) {
                corpus = corpus * (1 + monthlyRate) + monthlySIP;
                totalInvested += monthlySIP;
            }
            data.push({
                year,
                invested: Math.round(totalInvested),
                gain: Math.round(Math.max(0, corpus - totalInvested)),
                total: Math.round(corpus),
            });
        }
        return data;
    }, [sip, stepUp, equityReturn, debtReturn, enableEquityReturn, enableDebtReturn, initialCorpus, glideData, currentAge, retirementAge, inflation, enableInflation]);

    const corpus10Y = sipData[9]?.total || 0;
    const corpus20Y = sipData[19]?.total || 0;
    const corpus30Y = sipData[29]?.total || 0;

    const blendedReturn = useMemo(() => {
        const startEquity = glideData[0]?.equity || 70;
        const effectiveEquityReturn = enableEquityReturn ? equityReturn : 0;
        const effectiveDebtReturn = enableDebtReturn ? debtReturn : 0;
        const effectiveInflation = enableInflation ? inflation : 0;
        const nominal = ((startEquity / 100) * effectiveEquityReturn + ((100 - startEquity) / 100) * effectiveDebtReturn);
        return (nominal - effectiveInflation).toFixed(1);
    }, [glideData, equityReturn, debtReturn, enableEquityReturn, enableDebtReturn, inflation, enableInflation]);

    return (
        <div className="min-h-screen bg-[#f5f7fa] flex flex-col font-sans">
            <TopNav />
            <SubNav />

            <main className="flex-1 flex gap-0 max-w-[1600px] w-full mx-auto">

                {/* ── Left Sidebar Controls ── */}
                <aside className="w-72 shrink-0 bg-white/80 backdrop-blur-xl border-r border-white/50 p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] sticky top-[92px] self-start h-[calc(100vh-92px)] overflow-y-auto z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <SlidersHorizontal className="w-5 h-5 text-[#00458c]" />
                        <h2 className="text-sm font-extrabold text-[#00458c] uppercase tracking-widest">Projector Controls</h2>
                    </div>

                    {profileLoading ? (
                        <div className="flex items-center gap-2 mb-5 mt-3">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                            <p className="text-[11px] text-gray-400">Loading your profile...</p>
                        </div>
                    ) : profileLoaded ? (
                        <div className="flex items-center gap-2 mb-5 mt-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <p className="text-[11px] text-green-700 font-semibold">Pre-filled from your WealthMax profile</p>
                        </div>
                    ) : (
                        <div className="mb-5 mt-2" />
                    )}

                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">SIP Parameters</p>
                        <Slider label="Monthly SIP" value={sip} min={1000} max={200000} step={500} unit="₹" onChange={setSip} />
                        <Slider label="Annual Step-up" value={stepUp} min={0} max={30} step={1} unit="%" onChange={setStepUp} />
                    </div>

                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">Return Assumptions</p>
                        <Slider label="Equity Return" value={equityReturn} min={6} max={20} step={0.5} unit="%" onChange={setEquityReturn} color="#28a745" enabled={enableEquityReturn} onToggle={setEnableEquityReturn} />
                        <Slider label="Debt Return" value={debtReturn} min={4} max={12} step={0.5} unit="%" onChange={setDebtReturn} color="#f37920" enabled={enableDebtReturn} onToggle={setEnableDebtReturn} />
                        <Slider label="Inflation" value={inflation} min={0} max={50} step={0.5} unit="%" onChange={setInflation} color="#dc2626" enabled={enableInflation} onToggle={setEnableInflation} />
                    </div>

                    <div className="mb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">Glide Path</p>
                        <Slider label="Current Age" value={currentAge} min={22} max={55} step={1} unit=" yrs" onChange={setCurrentAge} />
                        <Slider label="Retirement Age" value={retirementAge} min={50} max={70} step={1} unit=" yrs" onChange={(v) => setRetirementAge(Math.max(v, currentAge + 5))} />
                    </div>

                    {/* Summary Callout */}
                    <div className="bg-gradient-to-br from-[#00458c] to-[#002b5e] rounded-xl p-5 text-white shadow-[0_8px_30px_rgba(0,69,140,0.3)] border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-3 relative z-10">Quick Projections</p>
                        <div className="space-y-2 relative z-10">
                            {[{ label: "10 Years", val: corpus10Y }, { label: "20 Years", val: corpus20Y }, { label: "30 Years", val: corpus30Y }].map(r => (
                                <div key={r.label} className="flex justify-between items-center">
                                    <span className="text-xs text-blue-200">{r.label}</span>
                                    <span className="text-sm font-extrabold text-white">{fmtAmount(r.val)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/10 pt-3 mt-3">
                            <p className="text-[10px] text-blue-200">Blended Return: <span className="text-white font-bold">{blendedReturn}%</span></p>
                        </div>
                    </div>
                </aside>

                {/* ── Right Main Area ── */}
                <section className="flex-1 p-6 space-y-6 min-w-0">

                    {/* Chart 1: SIP Wealth Growth */}
                    <div className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,69,140,0.08)] hover:-translate-y-0.5">
                        <div className="px-7 py-5 border-b border-gray-50 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00458c]/10 to-[#00458c]/5 border border-[#00458c]/10 shadow-sm">
                                    <TrendingUp className="w-5 h-5 text-[#00458c]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-[#00458c]">SIP Wealth Growth Projection</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        ₹{sip.toLocaleString("en-IN")}/mo with {stepUp}% step-up using dynamic glide-path returns
                                        {goals.length > 0 && ` · ${goals.length} goal${goals.length > 1 ? "s" : ""} overlaid`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-200 inline-block" /><span className="text-gray-500 font-medium">Total Invested</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#00458c] inline-block" /><span className="text-gray-500 font-medium">Wealth Gained</span></div>
                                {goals.length > 0 && <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#f37920] inline-block" /><span className="text-gray-500 font-medium">Goal Milestones</span></div>}
                            </div>
                        </div>

                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={340}>
                                <AreaChart data={sipData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0.3} />
                                        </linearGradient>
                                        <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00458c" stopOpacity={0.85} />
                                            <stop offset="95%" stopColor="#00458c" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} label={{ value: "Years", position: "insideBottom", offset: -2, fontSize: 11, fill: "#9ca3af" }} />
                                    <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={60} />
                                    <Tooltip content={<SIPTooltip goals={goals} />} />

                                    {/* Standard reference lines */}
                                    <ReferenceLine x={10} stroke="#e5e7eb" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "10Y", position: "top", fontSize: 10, fill: "#9ca3af" }} />
                                    <ReferenceLine x={20} stroke="#e5e7eb" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "20Y", position: "top", fontSize: 10, fill: "#9ca3af" }} />

                                    {/* Goal milestone lines */}
                                    {goals.map((goal, i) => {
                                        const corpusAtYear = sipData[Math.min(goal.year - 1, 29)]?.total || 0;
                                        const funded = corpusAtYear >= goal.target_amount;
                                        return (
                                            <ReferenceLine
                                                key={goal.id || i}
                                                x={goal.year}
                                                stroke={funded ? "#28a745" : "#f37920"}
                                                strokeDasharray="5 3"
                                                strokeWidth={2}
                                                label={{
                                                    value: goal.name.length > 10 ? goal.name.slice(0, 10) + "..." : goal.name,
                                                    position: "top",
                                                    fontSize: 9,
                                                    fill: funded ? "#28a745" : "#f37920",
                                                    fontWeight: "bold"
                                                }}
                                            />
                                        );
                                    })}

                                    <Area type="monotone" dataKey="invested" stackId="1" stroke="#d1d5db" strokeWidth={1} fill="url(#investedGrad)" name="Total Invested" />
                                    <Area type="monotone" dataKey="gain" stackId="1" stroke="#00458c" strokeWidth={2} fill="url(#gainGrad)" name="Wealth Gained" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Goal Feasibility Cards */}
                    {goals.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,69,140,0.08)] hover:-translate-y-0.5">
                            <div className="px-7 py-5 border-b border-gray-50 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#f37920]/10 to-[#f37920]/5 border border-[#f37920]/10 shadow-sm">
                                    <Target className="w-5 h-5 text-[#f37920]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-[#00458c]">Goal Feasibility Analysis</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Each goal evaluated against your current SIP trajectory</p>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {goals.map(goal => (
                                    <GoalFeasibilityBadge key={goal.id} goal={goal} sipData={sipData} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chart 2: Glide Path */}
                    <div className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,69,140,0.08)] hover:-translate-y-0.5">
                        <div className="px-7 py-5 border-b border-gray-50 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#f37920]/10 to-[#f37920]/5 border border-[#f37920]/10 shadow-sm">
                                    <LifeBuoy className="w-5 h-5 text-[#f37920]" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-[#00458c]">Retirement Asset Allocation Glide Path</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Age {currentAge} → {retirementAge} | Automatic de-risking as you approach retirement</p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#00458c] inline-block" /><span className="text-gray-500 font-medium">Equity</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#f37920] inline-block" /><span className="text-gray-500 font-medium">Debt</span></div>
                            </div>
                        </div>

                        <div className="p-6">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={glideData} barSize={glideData.length > 20 ? 14 : 22} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} label={{ value: "Age (Years)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#9ca3af" }} />
                                    <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip content={<GlideTooltip />} />
                                    <Bar dataKey="equity" stackId="a" fill="#00458c" name="Equity" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="debt" stackId="a" fill="#f37920" name="Debt" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mx-6 mb-6 bg-gradient-to-r from-[#00458c]/5 to-transparent border border-[#00458c]/10 rounded-xl px-6 py-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#00458c]/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <LifeBuoy className="w-4 h-4 text-[#00458c]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#00458c] mb-1">Automatic De-risking Strategy</p>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Your portfolio automatically shifts from <strong>{glideData[0]?.equity || 80}% equity</strong> at age {currentAge} to <strong>{glideData[glideData.length - 1]?.equity || 20}% equity</strong> at retirement age {retirementAge}.
                                        This glide path preserves capital as you approach your target year by progressively allocating more to stable debt instruments, protecting against market volatility near retirement.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projection Summary Strip */}
                    <div className="grid grid-cols-3 gap-5 pb-6">
                        {[
                            { label: "Corpus at 10 Years", value: fmtAmount(corpus10Y), sub: `Using glide-path returns` },
                            { label: "Corpus at 20 Years", value: fmtAmount(corpus20Y), sub: `${stepUp}% step-up applied` },
                            { label: "Retirement Corpus", value: fmtAmount(corpus30Y), sub: `Using glide-path returns` },
                        ].map((c, i) => (
                            <div key={c.label} className="bg-white rounded-2xl border border-gray-100/80 shadow-[0_8px_20px_rgba(0,0,0,0.03)] px-6 py-5 text-center relative overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,69,140,0.08)] hover:-translate-y-1">
                                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${i === 0 ? 'from-blue-400 to-[#00458c]' : i === 1 ? 'from-[#00458c] to-indigo-600' : 'from-indigo-600 to-[#f37920]'} opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{c.label}</p>
                                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#00458c] to-[#002b5e] mb-1">{c.value}</p>
                                <p className="text-[10px] font-medium text-gray-400">{c.sub}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
