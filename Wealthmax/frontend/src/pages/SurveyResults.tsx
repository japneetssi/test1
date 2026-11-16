import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import logo from "@/assets/wealthmax-logo.png";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';

export default function SurveyResults() {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<{ bucket: string, score: number, hasContradiction?: boolean } | null>(null);

    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        fetchProfileResults();
    }, []);

    const fetchProfileResults = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/profile');
            if (data?.data && data.data.risk_class) {
                setResult({
                    bucket: data.data.risk_class,
                    score: data.data.risk_score || 0
                });
            }
        } catch (err: any) {
            toast({ title: "Failed to load results", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-[#f37920] mb-4" />
                <p className="text-gray-500 font-medium text-sm animate-pulse">Loading Risk Profile...</p>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-[calc(100vh-52px)] flex flex-col items-center justify-center bg-gray-50 p-6">
                <h2 className="text-2xl font-bold text-[#00458c] mb-4">No Risk Profile Found</h2>
                <p className="text-gray-600 mb-8 max-w-md text-center">You haven't completed the risk assessment survey yet. Take the survey to discover your investor persona.</p>
                <button
                    onClick={() => navigate("/survey")}
                    className="bg-[#f37920] hover:bg-[#e06b18] text-white px-8 py-3 rounded-lg shadow-sm font-bold text-sm transition-all whitespace-nowrap"
                >
                    Take Survey Now
                </button>
            </div>
        );
    }

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

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="bg-[#6b5cd1] hover:bg-[#5b4cb1] text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-[#6b5cd1]/20 transition-all hover:-translate-y-0.5"
                            >
                                Go to Dashboard
                            </button>
                            <button
                                onClick={() => navigate("/survey")}
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
