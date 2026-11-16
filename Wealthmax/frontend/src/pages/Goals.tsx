import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, X, GraduationCap, Home, Palmtree, Car, Briefcase, Heart, Target, Trash2 } from "lucide-react";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import api from "@/lib/api";
import { calculateRequiredSIP } from "@/lib/financialMath";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────
interface Goal {
    id: string;
    name: string;
    target_amount: number;
    target_date: string;
    current_amount: number;
    monthly_contribution: number;
    priority: "High" | "Medium" | "Low";
    is_family_goal: boolean;
    time_horizon?: "short-term" | "medium-term" | "long-term";
    category?: string;
    step_up_percentage?: number;
    created_at?: string;
}

interface AddGoalForm {
    name: string;
    target_amount: string;
    years_away: string;
    inflation_percent: string;
    current_amount: string;
    priority: "High" | "Medium" | "Low";
    is_family_goal: boolean;
    time_horizon: "short-term" | "medium-term" | "long-term" | "";
    category: string;
    step_up_percentage: string;
}

// ── Icon & Goal Helpers ────────────────────────────────────────────────────
const getGoalIcon = (name: string, category?: string) => {
    const textToMatch = (name + " " + (category || "")).toLowerCase();
    if (textToMatch.includes("home") || textToMatch.includes("house") || textToMatch.includes("property")) return Home;
    if (textToMatch.includes("education") || textToMatch.includes("college") || textToMatch.includes("school")) return GraduationCap;
    if (textToMatch.includes("retire") || textToMatch.includes("pension")) return Palmtree;
    if (textToMatch.includes("car") || textToMatch.includes("vehicle")) return Car;
    if (textToMatch.includes("business") || textToMatch.includes("startup")) return Briefcase;
    if (textToMatch.includes("wedding") || textToMatch.includes("marriage") || textToMatch.includes("vacation")) return Heart;
    return Target;
};

const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString("en-IN")}`;
};

const CATEGORIES = {
    "short-term": ["Vacation", "Vehicle purchase", "Emergency reserve funds", "Other short-term goals"],
    "medium-term": ["Child education", "Home purchase", "Business funds", "Other medium-term goals"],
    "long-term": ["Retirement goal", "Wedding goal", "Other long-term goals"]
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function Goals({ impersonatedId }: { impersonatedId?: string }) {
    const [activeTab, setActiveTab] = useState<"short-term" | "medium-term" | "long-term">("short-term");
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState<AddGoalForm>({
        name: "",
        target_amount: "",
        years_away: "",
        inflation_percent: "6",
        current_amount: "0",
        priority: "Medium",
        is_family_goal: false,
        time_horizon: "",
        category: "",
        step_up_percentage: "0",
    });

    const fetchGoals = async () => {
        try {
            const url = impersonatedId ? `/goals?userId=${impersonatedId}` : "/goals";
            const { data } = await api.get(url);
            setGoals(data?.data || []);
        } catch {
            toast({ title: "Could not load goals", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGoals(); }, [impersonatedId]);

    // Inflation-adjusted target = P × (1 + r)^n
    const getInflationAdjustedTarget = (base: number, years: number, rate: number) =>
        Math.round(base * Math.pow(1 + rate / 100, years));

    const handleAdd = async () => {
        if (!form.name || !form.target_amount || !form.years_away) {
            toast({ title: "Please fill all required fields.", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            const yearsAway = parseFloat(form.years_away);
            const baseTarget = parseFloat(form.target_amount);
            const inflationRate = parseFloat(form.inflation_percent);
            const adjustedTarget = getInflationAdjustedTarget(baseTarget, yearsAway, inflationRate);
            const targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() + yearsAway);
            
            const stepUpPct = parseFloat(form.step_up_percentage) || 0;
            const requiredSIP = calculateRequiredSIP(adjustedTarget, yearsAway, stepUpPct);

            await api.post("/goals", {
                name: form.name,
                target_amount: adjustedTarget,
                target_date: targetDate.toISOString().split("T")[0],
                current_amount: parseFloat(form.current_amount) || 0,
                monthly_contribution: requiredSIP,
                priority: form.priority,
                is_family_goal: form.is_family_goal,
                time_horizon: form.time_horizon,
                category: form.category,
                step_up_percentage: stepUpPct
            });

            toast({ title: "Goal added!", description: `${form.name} is now being tracked.` });
            setShowModal(false);
            setForm({ name: "", target_amount: "", years_away: "", inflation_percent: "6", current_amount: "0", priority: "Medium", is_family_goal: false, time_horizon: "", category: "", step_up_percentage: "0" });
            await fetchGoals();
        } catch (e: any) {
            toast({ title: "Failed to add goal", description: e.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await api.delete(`/goals/${id}`);
            setGoals(prev => prev.filter(g => g.id !== id));
            toast({ title: "Goal removed" });
        } catch {
            toast({ title: "Failed to delete goal", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    // ── Derived Metrics ──
    const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
    const totalFunded = goals.reduce((s, g) => s + Number(g.current_amount), 0);
    const overallPct = totalTarget > 0 ? Math.round((totalFunded / totalTarget) * 100) : 0;

    const getGoalProgress = (goal: Goal) => {
        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        let expectedPct = 0;
        if (goal.created_at) {
            const start = new Date(goal.created_at).getTime();
            const end = new Date(goal.target_date).getTime();
            const now = new Date().getTime();
            const totalDuration = end - start;
            if (totalDuration > 0) {
                expectedPct = Math.max(0, Math.min(100, ((now - start) / totalDuration) * 100));
            } else {
                 expectedPct = 100;
            }
        } else {
            // Fallback if no created_at
            const targetYear = new Date(goal.target_date).getFullYear();
            const currentYear = new Date().getFullYear();
            const createdYear = currentYear - 1;
            const totalYears = Math.max(1, targetYear - createdYear);
            const elapsed = currentYear - createdYear;
            expectedPct = Math.min(100, (elapsed / totalYears) * 100);
        }
        
        const onTrack = progress >= expectedPct - 5;
        return { pct: Math.round(progress), expectedPct: Math.round(expectedPct), onTrack };
    };

    const getGoalAlert = (goal: Goal) => {
        const endDate = new Date(goal.target_date);
        const now = new Date();
        const monthsLeft = (endDate.getFullYear() - now.getFullYear()) * 12 + (endDate.getMonth() - now.getMonth());
        const gap = goal.target_amount - goal.current_amount;
        
        if (monthsLeft <= 0 || gap <= 0) return null;
        
        const needed = Math.round(gap / monthsLeft);
        const current = Number(goal.monthly_contribution);
        if (needed > current) {
            const shortfall = needed - current;
            return `Increase SIP by ${formatAmount(shortfall)}/mo to stay on track.`;
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[#f5f7fa] flex flex-col font-sans">
            {!impersonatedId && (
                <>
                    <TopNav />
                    <SubNav />
                </>
            )}

            <main className={`flex-1 max-w-[1400px] w-full mx-auto px-6 py-6 ${impersonatedId ? 'pt-0' : ''}`}>

                {/* ── Summary Strip ── */}
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 mb-8 items-center">
                    {[
                        { label: "Total Goal Target", value: formatAmount(totalTarget), sub: "Across all goals" },
                        { label: "Currently Funded", value: formatAmount(totalFunded), sub: `${overallPct}% of target` },
                        { label: "Goal Preparedness", value: `${overallPct}%`, sub: "Based on current progress" },
                    ].map(card => (
                        <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">{card.label}</p>
                            <p className="text-3xl font-extrabold text-[#00458c] leading-none">{card.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                        </div>
                    ))}

                    {!impersonatedId && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-[#f37920] hover:bg-[#e06b18] text-white px-6 py-4 rounded-xl font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Add New Goal
                        </button>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="flex space-x-2 mb-6">
                    {(["short-term", "medium-term", "long-term"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab ? "bg-[#00458c] text-white" : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 shadow-sm"}`}
                        >
                            {tab === "short-term" ? "Short-term (0-3 yrs)" : tab === "medium-term" ? "Medium-term (3-7 yrs)" : "Long-term (7+ yrs)"}
                        </button>
                    ))}
                </div>

                {/* ── Goals Grid ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-[#f37920]" />
                    </div>
                ) : goals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-[#00458c]/5 rounded-full flex items-center justify-center mb-5">
                            <Target className="w-10 h-10 text-[#00458c]" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-[#00458c] mb-2">No Goals Set Yet</h2>
                        <p className="text-gray-500 text-sm mb-6">Track your milestones — from home purchases to retirement corpus.</p>
                        {!impersonatedId && (
                            <button onClick={() => setShowModal(true)} className="bg-[#f37920] hover:bg-[#e06b18] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all">
                                + Add Your First Goal
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {goals.filter(g => g.time_horizon === activeTab || (!g.time_horizon && activeTab === "short-term")).map((goal) => {
                            const GoalIcon = getGoalIcon(goal.name, goal.category);
                            const { pct, expectedPct, onTrack } = getGoalProgress(goal);
                            const alert = getGoalAlert(goal);
                            const barColor = pct >= 75 ? "#28a745" : pct >= 40 ? "#f37920" : "#dc3545";
                            const targetYear = new Date(goal.target_date).getFullYear();

                            return (
                                <div key={goal.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between p-5 pb-3 border-b border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#00458c]/8 flex items-center justify-center" style={{ backgroundColor: "rgba(0,69,140,0.08)" }}>
                                                <GoalIcon className="w-5 h-5 text-[#00458c]" />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-[#00458c] text-base leading-tight">{goal.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${goal.priority === "High" ? "bg-red-50 text-red-600" : goal.priority === "Medium" ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-600"}`}>
                                                        {goal.priority} Priority
                                                    </span>
                                                    {goal.is_family_goal && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-blue-50 text-blue-600 border border-blue-100 italic">
                                                            Family Goal
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wide">Target Year</p>
                                                <p className="text-[#00458c] font-extrabold text-lg">{targetYear}</p>
                                            </div>
                                            {!impersonatedId && (
                                                <button onClick={() => handleDelete(goal.id)} disabled={deletingId === goal.id} className="ml-2 text-gray-300 hover:text-red-400 transition-colors">
                                                    {deletingId === goal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="flex-1 p-5">
                                        <div className="flex justify-between mb-4">
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Target Amount</p>
                                                <p className="text-xl font-extrabold text-gray-800">{formatAmount(goal.target_amount)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Current Saved</p>
                                                <p className="text-xl font-extrabold text-gray-800">{formatAmount(goal.current_amount)}</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5">
                                                <span>{pct}% Funded</span>
                                                <span className={onTrack ? "text-green-600" : "text-orange-500"}>{onTrack ? "✓ On Track" : "⚠ Behind"}</span>
                                            </div>
                                            <div className="relative h-4 bg-gray-100 rounded-full overflow-visible">
                                                {/* Actual Fill */}
                                                <div
                                                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
                                                />
                                                {/* Where You Should Be Today hash mark */}
                                                {expectedPct > 0 && expectedPct < 100 && (
                                                    <div
                                                        className="absolute top-[-4px] bottom-[-4px] w-[3px] bg-[#00458c] z-10 rounded"
                                                        style={{ left: `${Math.min(97, expectedPct)}%` }}
                                                        title={`Expected: ${expectedPct}%`}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                <span>₹0</span>
                                                <span className="text-[10px] text-[#00458c] font-bold">│ Expected today</span>
                                                <span>{formatAmount(goal.target_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Monthly SIP */}
                                        {Number(goal.monthly_contribution) > 0 && (
                                            <p className="text-xs text-gray-500 font-medium mb-2">
                                                Monthly SIP: <span className="font-bold text-gray-700">{formatAmount(goal.monthly_contribution)}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Card Footer Alert */}
                                    {alert && (
                                        <div className="bg-orange-50 border-t border-orange-100 px-5 py-3 flex items-center gap-2">
                                            <span className="text-orange-400 text-sm">⚡</span>
                                            <p className="text-[11px] font-semibold text-orange-700">{alert}</p>
                                        </div>
                                    )}
                                    {!alert && pct >= 75 && (
                                        <div className="bg-green-50 border-t border-green-100 px-5 py-3 flex items-center gap-2">
                                            <span className="text-green-500 text-sm">✅</span>
                                            <p className="text-[11px] font-semibold text-green-700">Great progress! You are on track to meet this goal.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ── Add Goal Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />

                    {/* Modal Card */}
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 mx-4">
                        {/* Modal Header */}
                        <div className="bg-[#00458c] px-7 py-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-white font-extrabold text-lg">Set a New Goal</h2>
                                <p className="text-blue-200 text-xs mt-0.5">Define your financial milestone</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-7 space-y-5">
                            {/* Goal Name */}
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Goal Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g., Child's Education Fund"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c]"
                                />
                            </div>

                            {/* Time Horizon & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Time Horizon</label>
                                    <select
                                        value={form.time_horizon}
                                        onChange={e => setForm(f => ({ ...f, time_horizon: e.target.value as any, category: "" }))}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c] bg-white"
                                    >
                                        <option value="">Select Horizon</option>
                                        <option value="short-term">Short-term (0-3 yrs)</option>
                                        <option value="medium-term">Medium-term (3-7 yrs)</option>
                                        <option value="long-term">Long-term (7+ yrs)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                        disabled={!form.time_horizon}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c] bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                    >
                                        <option value="">Select Category</option>
                                        {form.time_horizon && CATEGORIES[form.time_horizon as keyof typeof CATEGORIES]?.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 2-column Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Target Amount (₹) *</label>
                                    <input
                                        type="number"
                                        value={form.target_amount}
                                        onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))}
                                        placeholder="e.g., 5000000"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c]"
                                    />
                                    {form.target_amount && form.years_away && (
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Inflation-adjusted ({form.inflation_percent}%/yr): <span className="font-bold text-[#00458c]">{formatAmount(getInflationAdjustedTarget(parseFloat(form.target_amount) || 0, parseFloat(form.years_away) || 0, parseFloat(form.inflation_percent) || 6))}</span>
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Years Away *</label>
                                    <input
                                        type="number"
                                        value={form.years_away}
                                        onChange={e => setForm(f => ({ ...f, years_away: e.target.value }))}
                                        placeholder="e.g., 10"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Expected Inflation %</label>
                                    <input
                                        type="number"
                                        value={form.inflation_percent}
                                        onChange={e => setForm(f => ({ ...f, inflation_percent: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Annual Step-up SIP (%)</label>
                                    <input
                                        type="number"
                                        value={form.step_up_percentage}
                                        onChange={e => setForm(f => ({ ...f, step_up_percentage: e.target.value }))}
                                        placeholder="e.g., 5"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Projected 12% ROI SIP (₹)</label>
                                    <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-4 py-3 text-sm font-bold text-gray-600 flex items-center">
                                        {form.target_amount && form.years_away 
                                            ? `~ ${Math.round(calculateRequiredSIP(getInflationAdjustedTarget(parseFloat(form.target_amount) || 0, parseFloat(form.years_away) || 0, parseFloat(form.inflation_percent) || 6), parseFloat(form.years_away) || 0, parseFloat(form.step_up_percentage) || 0)).toLocaleString("en-IN")}/mo`
                                            : "Enter target & years"}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Amount Already Saved (₹)</label>
                                    <input
                                        type="number"
                                        value={form.current_amount}
                                        onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))}
                                        placeholder="0"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Priority</label>
                                    <select
                                        value={form.priority}
                                        onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00458c]/30 focus:border-[#00458c] bg-white"
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>

                            {/* Family Sharing Toggle */}
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Heart className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-900">Share with Family</p>
                                        <p className="text-[10px] text-blue-700">Make this goal visible to all family members</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={form.is_family_goal}
                                        onChange={e => setForm(f => ({ ...f, is_family_goal: e.target.checked }))}
                                    />
                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-7 pb-6 flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 px-4 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={submitting}
                                className="flex-1 bg-[#f37920] hover:bg-[#e06b18] disabled:opacity-60 text-white px-4 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {submitting ? "Saving..." : "Add Goal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
