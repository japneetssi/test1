import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getRiskQuestions, submitRiskSurvey, RiskQuestion } from "@/services/riskProfiler";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import logo from "@/assets/wealthmax-logo.png";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
// Assuming we have a service for persona bundling. For now, we'll mock the integration or use the existing ones.
import api from '@/lib/api';
// import { computeHealthScore } from "@/services/healthScore";

export default function Survey() {
    const [questions, setQuestions] = useState<RiskQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<{ bucket: string, score: number, hasContradiction: boolean } | null>(null);
    const [personaMetrics, setPersonaMetrics] = useState<any>(null);
    const [showPersona, setShowPersona] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const snapshotData = location.state?.snapshotData;

    useEffect(() => {
        const checkExistingProfile = async () => {
            try {
                const { data } = await api.get('/profile');
                if (data?.data?.risk_class && data?.data?.risk_class !== 'Unassigned' && !location.state?.retake) {
                    // User already has a risk profile and didn't request a retake
                    setResult({
                        bucket: data.data.risk_class,
                        score: data.data.risk_score || 50,
                        hasContradiction: false
                    });
                    if (data.data.persona_data) {
                        setPersonaMetrics(data.data.persona_data);
                    }
                    setLoading(false); // Fix: Ensure loading is set to false when profile exists
                } else {
                    fetchQuestions();
                }
            } catch (err) {
                fetchQuestions();
            }
        };
        checkExistingProfile();
    }, []);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const data = await getRiskQuestions();
            setQuestions(data);
        } catch (err: any) {
            toast({ title: "Failed to load survey", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (questionId: string, value: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const currentQuestion = questions[currentIndex];
    const progressPercent = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;
    const isCurrentAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((p) => p + 1);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex((p) => p - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            // 1. Submit the Risk Survey to Backend
            const surveyResult = await submitRiskSurvey(answers);

            // 2. Submit the Financial Profile to generate the Persona via Backend
            if (snapshotData) {
                // The backend API expects:
                // dob, gross_income (annual), monthly_emi, fixed_expenses, etc.
                const profileUpdatePayload = {
                    dob: snapshotData.dob,
                    gross_income: snapshotData.gross_income || 0,
                    other_income: snapshotData.additional_income || 0,
                    monthly_household_expenses: snapshotData.monthly_household_expenses || 0,
                    monthly_obligations: snapshotData.monthly_obligations || 0,
                    emergency_fund_amount: snapshotData.emergency_fund_amount || 0,
                    dependents: snapshotData.dependents || 0,
                    occupation: snapshotData.occupation,
                    marital_status: snapshotData.marital_status,
                    pan_number: snapshotData.pan_number,
                    income_details: snapshotData.income_details || [],
                    expense_details: snapshotData.expense_details || [],
                    asset_details: snapshotData.asset_details || [],
                    liability_details: snapshotData.liability_details || [],
                    safety_net_details: snapshotData.safety_net_details || [],
                    dependent_details: snapshotData.dependent_details || []
                };

                const { data } = await api.post('/profile/update', profileUpdatePayload);
                const persona_data = data?.data?.persona_data;

                if (persona_data) {
                    setPersonaMetrics(persona_data);
                }
                
                // Save captured goals
                if (snapshotData.goal_details && snapshotData.goal_details.length > 0) {
                    for (const goal of snapshotData.goal_details) {
                        try {
                            const today = new Date();
                            const targetYear = today.getFullYear() + (Number(goal.years_away) || 0);
                            const targetDate = new Date(targetYear, today.getMonth(), today.getDate()).toISOString();

                            await api.post('/goals', {
                                name: goal.name,
                                target_amount: goal.target_amount,
                                target_date: targetDate,
                                priority: goal.priority,
                                category: goal.category,
                                current_amount: goal.current_amount || 0,
                                is_family_goal: false,
                                inflation_percent: 6,
                                step_up_percentage: 0
                            });
                        } catch (err) {
                            console.error('Failed to save goal:', err);
                        }
                    }
                }
            }

            setResult({
                bucket: surveyResult.riskClass,
                score: surveyResult.normalizedScore,
                hasContradiction: surveyResult.contradictionFlag
            });
            toast({ title: "Survey Calculated", description: "Review your Risk Profile results." });

        } catch (err: any) {
            toast({ title: "Submission failed", description: err.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-[#f37920] mb-4" />
                <p className="text-gray-500 font-medium text-sm animate-pulse">Loading Profiler...</p>
            </div>
        );
    }

    if (result) {
        return (
            <div className="min-h-[calc(100vh-52px)] bg-gray-50 flex flex-col font-sans text-[#1d1d1f]">
                <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm sticky top-[52px] z-10">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="WealthMax" className="h-7 w-7 rounded object-cover" />
                            <span className="text-[#00458c] font-bold text-lg hidden sm:inline">WealthMax</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl shadow-[#00458c]/5 border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-8 md:p-12 text-center">
                            <h2 className="text-4xl font-extrabold text-[#1d1d1f] mb-12">Your Risk Profile</h2>

                            <div className="flex items-center justify-center gap-10 mb-16">
                                <div className="bg-[#2b6be3] text-white px-10 py-5 rounded-full text-2xl font-bold shadow-lg shadow-[#2b6be3]/20">
                                    {result.bucket} Investor
                                </div>
                                <div className="text-left">
                                    <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">Aptitude</p>
                                    <p className="text-2xl font-black text-[#1d1d1f]">Score {result.score}/100</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mb-16 text-left px-4">
                                <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-[#2b6be3]/10 flex items-center justify-center text-[#2b6be3]">📈</div>
                                        <h4 className="font-bold text-lg text-[#00458c]">Strategy</h4>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed font-medium">
                                        Based on your score, we recommend a {result.bucket?.toLowerCase()} allocation strategy focusing on
                                        {result.bucket === 'Aggressive' ? ' maximum capital appreciation' : result.bucket === 'Moderate' ? ' balanced growth' : ' capital preservation'}.
                                    </p>
                                </div>

                                <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-500">🛡️</div>
                                        <h4 className="font-bold text-lg text-[#00458c]">Guardrails</h4>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed font-medium">
                                        Our system actively monitors your portfolio against this profile to prevent emotional decision making during market volatility.
                                    </p>
                                </div>
                            </div>

                            {result.hasContradiction && (
                                <div className="mb-12 p-5 bg-orange-50 border border-orange-200 rounded-2xl text-left flex gap-4 text-orange-800">
                                    <span className="text-2xl">🛡️</span>
                                    <div>
                                        <h4 className="font-bold mb-1">Guardrail Activated</h4>
                                        <p className="text-sm font-medium leading-relaxed opacity-90">We detected contradictions in your risk tolerance. To protect your wealth, we have defaulted you to a safer category.</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate("/dashboard")}
                                    className="bg-[#6b5cd1] hover:bg-[#5b4cb1] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#6b5cd1]/20 transition-all hover:-translate-y-0.5"
                                >
                                    Go to Dashboard
                                </button>
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setCurrentIndex(0);
                                        setAnswers({});
                                        setShowPersona(false);
                                        fetchQuestions(); // Ensure questions are fetched when retaking
                                    }}
                                    className="bg-[#f2f2f2] hover:bg-[#e8e8e8] text-[#1d1d1f] px-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-0.5"
                                >
                                    Retake Survey
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!questions.length) {
        return (
            <div className="min-h-[calc(100vh-52px)] flex items-center justify-center bg-gray-50">
                 <p className="text-gray-400">Loading questions...</p>
            </div>
        );
    }

    // ── Persona View ──
    if (showPersona && snapshotData) {
        let metrics = [];
        let insight = "Your financial baseline looks healthy and well-balanced. You are positioned well for aggressive wealth creation.";
        let personaName = "";

        if (personaMetrics?.persona?.name) {
            // Use API-provided persona name
            personaName = personaMetrics.persona.name;
            const backendRatios = personaMetrics.metrics.ratios;
            const devs = personaMetrics.deviations;

            metrics = [
                { id: 'exp', name: "Expenses", actual: Math.round(backendRatios.expenses), target: devs.expenses.ideal, icon: "💳" },
                { id: 'emi', name: "Liabilities", actual: Math.round(backendRatios.liabilities), target: devs.liabilities.ideal, icon: "🏦" },
                { id: 'inv', name: "Investments", actual: Math.round(backendRatios.investments), target: devs.investments.ideal, icon: "📈" },
                { id: 'emg', name: "Emergency Fund", actual: Math.round(backendRatios.emergency_fund), target: devs.emergency_fund.ideal, icon: "🛡️" },
            ];

            insight = personaMetrics.behavior?.description || insight;
        } else {
            // FALLBACK: When API response is missing, calculate metrics locally
            // Note: Persona name SHOULD come from API. If missing, we use a placeholder.
            personaName = "Financial Profile";
            
            const monthlyIncome = snapshotData.gross_income / 12 || 1;
            const actualExpPct = Math.round((snapshotData.monthly_household_expenses / monthlyIncome) * 100) || 0;
            const actualEmiPct = Math.round((snapshotData.monthly_obligations / monthlyIncome) * 100) || 0;
            const remainder = Math.max(0, 100 - actualExpPct - actualEmiPct);
            const actualInvPct = Math.min(remainder, 30);
            const actualEmergPct = Math.max(0, remainder - actualInvPct);

            metrics = [
                { id: 'exp', name: "Expenses", actual: actualExpPct, target: 30, icon: "💳" },
                { id: 'emi', name: "Liabilities", actual: actualEmiPct, target: 30, icon: "🏦" },
                { id: 'inv', name: "Investments", actual: actualInvPct, target: 30, icon: "📈" },
                { id: 'emg', name: "Emergency Fund", actual: actualEmergPct, target: 10, icon: "🛡️" },
            ];
            // Note: In fallback mode, persona name remains "Financial Profile" since API data is unavailable
            // This shouldn't happen in production - persona name should come from the profile API response
        }

        const getBarColor = (actual: number, target: number) => {
            const diff = actual - target;
            if (diff <= 5) return "#28a745"; // Green - On Track
            if (diff > 5 && diff <= 15) return "#f37920"; // Orange - Warning
            return "#dc3545"; // Red - Critical
        };

        return (
            <div className="min-h-[calc(100vh-52px)] bg-gray-50 flex flex-col font-sans text-[#1d1d1f] p-6 items-center justify-center">
                <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl shadow-[#00458c]/5 border border-[#e0e0e0] overflow-hidden">

                    {/* Header */}
                    <div className="border-b border-gray-100 p-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-extrabold text-[#00458c] tracking-tight">Your Financial Persona: {personaName}</h2>
                            <div className="group relative cursor-help">
                                <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold border border-gray-200 transition-colors">i</div>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-3 rounded-lg shadow-lg z-20">
                                    The 30-30-30-10 Rule suggests allocating 30% to Expenses, 30% to EMI, 30% to Investments, and 10% to Emergency/Liquidity.
                                </div>
                            </div>
                        </div>
                        <img src={logo} alt="WealthMax" className="h-6 opacity-80" />
                    </div>

                    {/* Grid */}
                    <div className="p-8 space-y-8">
                        {metrics.map(m => {
                            const barColor = getBarColor(m.actual, m.target);
                            const fillWidth = Math.min(100, (m.actual / Math.max(m.target * 2, 100)) * 100);
                            const targetLineLeft = (m.target / Math.max(m.target * 2, 100)) * 100;

                            return (
                                <div key={m.id} className="flex items-center gap-6">
                                    {/* Left */}
                                    <div className="w-44 flex items-center gap-3 shrink-0">
                                        <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center text-lg">{m.icon}</div>
                                        <span className="font-bold text-gray-700 text-sm tracking-wide uppercase">{m.name}</span>
                                    </div>

                                    {/* Middle (SVG Bar) */}
                                    <div className="flex-1 relative h-6 bg-gray-100 rounded-sm overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
                                            style={{ width: `${fillWidth}%`, backgroundColor: barColor }}
                                        />
                                        {/* Target Line Marker */}
                                        <div
                                            className="absolute top-0 bottom-0 w-[3px] bg-[#00458c] z-10"
                                            style={{ left: `${targetLineLeft}%` }}
                                        />
                                    </div>

                                    {/* Right */}
                                    <div className="w-40 text-right shrink-0">
                                        <p className="text-sm font-extrabold text-[#1d1d1f]">Actual: {m.actual}%</p>
                                        <p className="text-xs font-bold text-gray-400">Target: {m.target}%</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Summary */}
                    <div className="bg-[#f4f6f9] p-6 mx-8 mb-8 rounded-lg border border-blue-100 flex items-center justify-between">
                        <div className="max-w-2xl px-2">
                            <h4 className="text-[11px] font-bold text-[#00458c] uppercase tracking-wider mb-2">AI Diagnostic Insight</h4>
                            <p className="text-[15px] text-gray-800 font-semibold leading-relaxed">{insight}</p>
                        </div>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="bg-[#f37920] hover:bg-[#e06b18] text-white px-8 py-3 rounded-lg shadow-sm font-bold text-sm transition-all whitespace-nowrap ml-4 hover:-translate-y-0.5"
                        >
                            View Action Plan →
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-52px)] bg-gray-50 flex flex-col font-sans text-[#1d1d1f]">

            {/* ── Top Bar ── */}
            <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm sticky top-[52px] z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="WealthMax" className="h-7 w-7 rounded object-cover" />
                        <span className="text-[#00458c] font-bold text-lg hidden sm:inline">WealthMax</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#00458c]">Step 2 of 2</span>
                        <span className="text-sm text-gray-500 hidden sm:inline">Risk Profiling</span>
                        <div className="flex gap-1 ml-2">
                            <div className="w-8 h-1.5 bg-[#f37920] rounded-full" />
                            <div className="w-8 h-1.5 bg-[#f37920] rounded-full" />
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="flex-1 flex flex-col items-center justify-center p-6">

                {/* Progress Text */}
                <div className="w-full max-w-3xl mb-4 flex justify-between items-center text-sm font-semibold text-[#00458c]">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span>{Math.round(progressPercent)}% Completed</span>
                </div>
                <div className="w-full max-w-3xl mb-8">
                    <Progress value={progressPercent} className="h-2 bg-gray-200" />
                </div>

                {/* Question Card */}
                <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl shadow-[#00458c]/5 border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">

                    <div className="p-8 md:p-12 flex-1 flex flex-col">

                        <h2 className="text-2xl md:text-3xl font-bold text-[#00458c] mb-8 leading-snug">
                            {currentQuestion.question}
                        </h2>

                        <div className="flex-1 space-y-4">
                            {currentQuestion.options.map((opt, oIdx) => {
                                const isSelected = answers[currentQuestion.id] === opt.value;
                                return (
                                    <button
                                        key={oIdx}
                                        onClick={() => handleSelect(currentQuestion.id, opt.value)}
                                        className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all flex items-center gap-5 ${isSelected
                                            ? "border-[#f37920] bg-orange-50/30 shadow-sm ring-1 ring-[#f37920]/20"
                                            : "border-gray-100 hover:border-[#00458c]/30 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-[#f37920]" : "border-gray-300"
                                            }`}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-[#f37920] rounded-full" />}
                                        </div>
                                        <span className={`text-[15px] md:text-base ${isSelected ? "font-semibold text-[#00458c]" : "text-gray-600 font-medium"}`}>
                                            {opt.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                    </div>

                    {/* Card Footer Navigation */}
                    <div className="bg-gray-50/80 border-t border-gray-100 p-6 px-8 md:px-12 flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            disabled={currentIndex === 0}
                            className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${currentIndex === 0
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-[#00458c] hover:bg-[#00458c]/5 rounded-lg"
                                }`}
                        >
                            <ArrowLeft className="h-5 w-5" /> Previous
                        </button>

                        {currentIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!isCurrentAnswered || submitting}
                                className="flex items-center gap-2 bg-[#f37920] hover:bg-[#e06b18] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#f37920]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Calculate Risk Profile"}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={!isCurrentAnswered}
                                className="flex items-center gap-2 text-[#00458c] hover:text-[#003875] px-4 py-2 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next <ArrowRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                </div>
            </main>

        </div>
    );
}
