import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { authService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TIMER_START = 30;

export default function AdvisorSetup() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1: Welcome/Info, 2: Mobile/OTP, 3: Success
    
    const [inviteData, setInviteData] = useState<{
        email: string;
        name: string;
        partnerName: string;
    } | null>(null);
    
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(0);

    const token = new URLSearchParams(location.search).get("token");

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                toast({
                    title: "Missing Token",
                    description: "Invitation link is invalid.",
                    variant: "destructive"
                });
                navigate("/login");
                return;
            }

            try {
                const res = await api.get(`/auth/validate-advisor-invite/${token}`);
                if (res.data.success) {
                    setInviteData(res.data.data);
                } else {
                    throw new Error(res.data.message);
                }
            } catch (err: any) {
                toast({
                    title: "Invalid Invitation",
                    description: err.message || "Invitation link is invalid or expired.",
                    variant: "destructive"
                });
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOTP = async () => {
        if (!mobile || mobile.length < 10) {
            toast({ title: "Error", description: "Please enter a valid mobile number", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            // First update the user's mobile number in the backend?
            // Actually, for advisors, we might need to link their mobile before requesting OTP if identifier is mobile.
            // But they can also use email as identifier.
            
            // For now, let's just use email as identifier since we have it from token
            const res = await authService.requestOTP(inviteData!.email);
            const serverOtp = res?.data?.otp;

            setStep(2);
            setTimer(TIMER_START);
            toast({
                title: "OTP Sent",
                description: serverOtp 
                    ? `OTP for ${inviteData!.email} is ${serverOtp}` 
                    : "Please check your email for the verification code."
            });
        } catch (err: any) {
            toast({ title: "Failed", description: err.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOTP = async () => {
        const joinedOtp = otp.join("");
        if (joinedOtp.length < 6) return;

        setSubmitting(true);
        try {
            const res = await api.post("/auth/activate-advisor", {
                email: inviteData!.email,
                otp: joinedOtp,
                mobile: mobile
            });
            
            if (res.data.success) {
                login(res.data.data);
                setStep(3);
                toast({ title: "Success!", description: "Your account is now active." });
                
                // Redirect after a short delay
                setTimeout(() => {
                    navigate("/advisor/dashboard");
                }, 2000);
            } else {
                throw new Error(res.data.message);
            }
        } catch (err: any) {
            toast({ title: "Verification Failed", description: err.message || "Invalid OTP", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOtpChange = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const newOtp = [...otp];
        newOtp[i] = val.slice(-1);
        setOtp(newOtp);
        
        // Auto-focus next
        if (val && i < 5) {
            const nextInput = document.getElementById(`otp-${i+1}`);
            nextInput?.focus();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#00458c] mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Validating your invitation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Header Banner */}
                <div className="bg-[#00458c] p-8 text-center text-white relative">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <h1 className="text-2xl font-bold mb-2">WealthMax Advisor Network</h1>
                    <p className="text-blue-100/80 text-sm">Professional Onboarding</p>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="h-16 w-16 bg-blue-50 text-[#00458c] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Welcome, {inviteData?.name}!</h2>
                                <p className="text-slate-500 mt-2">
                                    You've been invited by <span className="font-semibold text-slate-700">{inviteData?.partnerName}</span> to join their advisory team.
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>Verified Email: <span className="font-medium">{inviteData?.email}</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>Role Assigned: <span className="font-medium">Investment Advisor</span></span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-semibold text-slate-700">Confirm your Mobile Number</label>
                                <Input 
                                    type="tel" 
                                    placeholder="Enter your mobile number" 
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    className="h-12 text-lg tracking-wider"
                                />
                                <p className="text-xs text-slate-400">We'll use this for secure OTP logins in the future.</p>
                            </div>

                            <Button 
                                onClick={handleSendOTP} 
                                disabled={submitting}
                                className="w-full h-12 bg-[#f37920] hover:bg-[#e06b18] text-white font-bold text-lg"
                            >
                                {submitting ? <Loader2 className="animate-spin mr-2" /> : "Verify & Activate Account"}
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-slate-800">Verify Identity</h2>
                                <p className="text-slate-500 mt-2">
                                    We've sent a 6-digit code to <span className="font-medium text-slate-700">{inviteData?.email}</span>
                                </p>
                            </div>

                            <div className="flex justify-center gap-3">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl border-slate-200 focus:border-[#f37920] focus:outline-none transition-all"
                                    />
                                ))}
                            </div>

                            <div className="text-center">
                                {timer > 0 ? (
                                    <p className="text-sm text-slate-400">Resend code in {timer}s</p>
                                ) : (
                                    <button onClick={handleSendOTP} className="text-sm text-[#00458c] font-semibold hover:underline">
                                        Didn't receive a code? Resend
                                    </button>
                                )}
                            </div>

                            <Button 
                                onClick={handleVerifyOTP} 
                                disabled={submitting || otp.join("").length < 6}
                                className="w-full h-12 bg-[#00458c] hover:bg-blue-800 text-white font-bold text-lg"
                            >
                                {submitting ? <Loader2 className="animate-spin mr-2" /> : "Complete Setup"}
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8 space-y-6">
                            <div className="h-20 w-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Account Activated!</h2>
                                <p className="text-slate-500 mt-2">
                                    Welcome to the team. You're being redirected to your dashboard.
                                </p>
                            </div>
                            <Button 
                                onClick={() => navigate("/advisor/dashboard")}
                                variant="outline"
                                className="w-full h-12"
                            >
                                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        WealthMax Platform Security • Industry Standard Encryption
                    </p>
                </div>
            </div>
        </div>
    );
}
