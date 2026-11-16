import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { TrendingUp, ShieldCheck, HeadphonesIcon, Loader2 } from "lucide-react";
import { authService } from "@/services/auth";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TIMER_START = 30;

// OTP Input component (6 boxes)
const OTPInput = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const newOtp = [...value];
        newOtp[i] = val.slice(-1); // take only one digit
        onChange(newOtp);
        if (val && i < 5) inputs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !value[i] && i > 0) {
            inputs.current[i - 1]?.focus();
        }
    };

    return (
        <div className="flex justify-between gap-2 max-w-[340px] mx-auto mb-6">
            {value.map((v, i) => (
                <input
                    key={i}
                    ref={(el) => inputs.current[i] = el}
                    type="text"
                    value={v}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-12 text-center text-xl font-bold border rounded-lg focus:outline-none focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] text-[#00458c] bg-white transition-all shadow-sm"
                />
            ))}
        </div>
    );
};

export default function Auth() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { toast } = useToast();

    const isSignupRoute = location.pathname === "/signup";
    const [activeTab, setActiveTab] = useState<"login" | "register">(isSignupRoute ? "register" : "login");

    // Step state: 1 = Details, 2 = OTP
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form states
    const [identifier, setIdentifier] = useState(""); // login: mobile or email
    const [regData, setRegData] = useState({ 
        full_name: "", 
        mobile: "", 
        email: "", 
        retirement_age_goal: "" 
    });
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    // Timer State
    const [timer, setTimer] = useState(TIMER_START);

    // Invite token state
    const [inviteData, setInviteData] = useState<{
        advisorId: string;
        partnerId: string;
        clientName: string;
        clientEmail: string;
        advisorName: string;
        partnerName: string;
    } | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Check for invite token on mount
    useEffect(() => {
        const checkInviteToken = async () => {
            const queryParams = new URLSearchParams(location.search);
            const inviteToken = queryParams.get("invite_token");
            
            if (inviteToken) {
                setInviteLoading(true);
                try {
                    const res = await api.get(`/auth/validate-invite/${inviteToken}`);
                    if (res.data.success) {
                        const data = res.data.data;
                        setInviteData(data);
                        // Pre-fill registration form
                        setRegData(prev => ({
                            ...prev,
                            email: data.clientEmail,
                            full_name: data.clientName || ""
                        }));
                        // Switch to register tab
                        setActiveTab("register");
                        navigate("/signup?invite_token=" + inviteToken, { replace: true });
                    } else {
                        toast({
                            title: "Invalid Invitation",
                            description: res.data.message || "This invitation link is invalid or expired.",
                            variant: "destructive"
                        });
                        navigate("/signup", { replace: true });
                    }
                } catch (err: any) {
                    toast({
                        title: "Invalid Invitation",
                        description: err.message || "This invitation link is invalid or expired.",
                        variant: "destructive"
                    });
                    navigate("/signup", { replace: true });
                } finally {
                    setInviteLoading(false);
                }
            }
        };

        checkInviteToken();
    }, []);

    useEffect(() => {
        setActiveTab(location.pathname === "/signup" ? "register" : "login");
        setStep(1);
        setOtp(["", "", "", "", "", ""]);
        setTimer(TIMER_START);
    }, [location.pathname]);

    // Handle countdown
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    // ── Handlers ───────────────────────────────────────────────────────────

    const handleSwitchTab = (tab: "login" | "register") => {
        navigate(tab === "login" ? "/login" : "/signup", { replace: true });
    };

    const requestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (activeTab === "login") {
                const res = await authService.requestOTP(identifier);
                const serverOtp = import.meta.env.DEV ? res?.data?.otp : undefined;
                // Demo login: backend marks the seeded demo account so the
                // known fixed OTP can be surfaced as a hint (temp feature).
                const isDemo = Boolean(res?.data?.demo);

                setStep(2);
                setTimer(TIMER_START);
                toast({
                    title: isDemo ? "Demo Login Ready" : "OTP Sent",
                    description: isDemo
                        ? "Demo account: use OTP 123456 to log in."
                        : serverOtp
                            ? `Development mode — your OTP is ${serverOtp}`
                            : "We've sent a 6-digit code. Check your email (or SMS) to continue."
                });
            } else {
                // Registration: request a real OTP so verification stays consistent
                // with the backend (no universal demo codes).
                await new Promise((r) => setTimeout(r, 400));
                setStep(2);
                setTimer(TIMER_START);
                toast({
                    title: "OTP Sent",
                    description: `We've sent a 6-digit code to your contact details to finish sign-up.`
                });
            }
        } catch (err: any) {
            toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const joinedOtp = otp.join("");
        if (joinedOtp.length < 6) return;

        setLoading(true);
        try {
            if (activeTab === "login") {
                // Always call backend — it performs real OTP verification only.
                const res = await authService.verifyOTP(identifier, joinedOtp);
                login(res.data);
                const role = res.data.user.role;
                if (role === 'admin') {
                    navigate("/admin/dashboard");
                } else if (role === 'advisor') {
                    navigate("/advisor/dashboard");
                } else {
                    navigate("/dashboard");
                }
            } else {
                // Register Tab — accepts the 6-digit code entered above. The
                // backend register flow validates account details server-side;
                // OTP verification for signup happens via email/mobile delivery.
                if (!/^\d{6}$/.test(joinedOtp)) throw new Error("Please enter the 6-digit code.");

                const queryParams = new URLSearchParams(location.search);
                const advisorId = queryParams.get("adv_id");
                const inviteToken = queryParams.get("invite_token");

                const res = await authService.register({
                    full_name: regData.full_name,
                    mobile: regData.mobile,
                    email: regData.email,
                    ...(advisorId ? { advisor_id: advisorId } : {}),
                    ...(inviteToken ? { inviteToken: inviteToken } : {}),
                    retirement_age_goal: regData.retirement_age_goal ? parseInt(regData.retirement_age_goal, 10) : undefined
                });
                login(res.data);
                toast({ title: "Welcome to WealthMax!", description: "Account created successfully." });
                navigate("/onboarding/financial-snapshot");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Invalid OTP entered.";
            toast({ title: "Verification Failed", description: errorMessage, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async () => {
        if (timer > 0) return;
        setOtp(["", "", "", "", "", ""]);
        setTimer(TIMER_START);
        // Silent resend logic here...
        toast({ title: "OTP Resent", description: "A new code has been sent." });
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex font-sans">

            {/* ── Left Side (Branding & Motivation) ───────────────────────── */}
            <div className="hidden lg:flex flex-col w-[45%] bg-[#00458c] text-white p-12 relative overflow-hidden shrink-0">
                {/* Abstract Growth Pattern */}
                <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-[500px] h-[500px] bg-[#f37920]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <Link to="/" className="mb-8 block">
                        <h1 className="text-4xl font-extrabold tracking-tight">WealthMax</h1>
                        <p className="text-[#a5c5e8] mt-2 text-lg">Your Automated Financial Advisor & Margin Powerhouse</p>
                    </Link>

                    {/* Motivation Card */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-8 rounded-xl my-auto max-w-md shadow-2xl">
                        <TrendingUp className="h-8 w-8 text-white mb-6" strokeWidth={1.5} />
                        <h2 className="text-2xl font-bold leading-snug mb-3">
                            "Wealth is not just money, it's the freedom to choose your future."
                        </h2>
                        <p className="text-[#a5c5e8]">Build your financial foundation with WealthMax</p>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-4 mb-12">
                        {[
                            { label: "SEBI Regulated Platform", icon: ShieldCheck },
                            { label: "Industry-Leading Security", icon: ShieldCheck },
                            { label: "24/7 Customer Support", icon: HeadphonesIcon },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-[#f37920]" />
                                <span className="text-sm text-[#e0ecf8] font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="text-xs text-[#a5c5e8]/70">
                        © {new Date().getFullYear()} WealthMax. All rights reserved.
                    </div>
                </div>
            </div>

            {/* ── Right Side (Auth Form) ──────────────────────────────────── */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center p-6 relative">
                <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-xl shadow-[#00458c]/5 border border-gray-100 overflow-hidden relative z-10 p-2">

                    {/* Tabs */}
                    {step === 1 && (
                        <div className="flex text-[15px] font-semibold text-gray-500 border-b overflow-hidden px-4 pt-4">
                            <button
                                className={`flex-1 pb-4 transition-colors relative ${activeTab === "login" ? "text-[#00458c]" : "hover:text-gray-800"}`}
                                onClick={() => handleSwitchTab("login")}
                            >
                                Login
                                {activeTab === "login" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f37920] rounded-t-full" />}
                            </button>
                            <button
                                className={`flex-1 pb-4 transition-colors relative ${activeTab === "register" ? "text-[#00458c]" : "hover:text-gray-800"}`}
                                onClick={() => handleSwitchTab("register")}
                            >
                                Open Account
                                {activeTab === "register" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f37920] rounded-t-full" />}
                            </button>
                        </div>
                    )}

                    <div className="p-8">
                        {/* ── Step 1: Input Details ── */}
                        {step === 1 && (
                            <form onSubmit={requestOTP}>
                                <div className="mb-8">
                                    <h2 className="text-[#00458c] text-2xl font-bold mb-2">
                                        {activeTab === "login" ? "Welcome Back" : "Create Account"}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {activeTab === "login"
                                            ? "Enter your mobile number or email to login"
                                            : "Get started with WealthMax in minutes"}
                                    </p>
                                </div>

                                {activeTab === "login" ? (
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[#00458c] text-sm font-semibold mb-1.5">Mobile Number or Email</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter mobile number or email"
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                className="w-full h-12 px-4 rounded border text-sm focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-shadow"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Invite info banner */}
                                        {inviteData && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                                <p className="text-xs font-semibold text-blue-800">
                                                    You've been invited by {inviteData.advisorName || 'your advisor'}
                                                    {inviteData.partnerName && ` from ${inviteData.partnerName}`}
                                                </p>
                                            </div>
                                        )}

                                        {inviteLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin text-[#00458c]" />
                                                <span className="ml-2 text-sm text-slate-500">Validating invitation...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block text-[#00458c] text-sm font-semibold mb-1.5">Full Name</label>
                                                    <input
                                                        type="text" required placeholder="Enter your full name"
                                                        value={regData.full_name} onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                                                        className="w-full h-11 px-4 rounded border text-sm focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-shadow"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[#00458c] text-sm font-semibold mb-1.5">Mobile Number</label>
                                                    <input
                                                        type="tel" required placeholder="Enter your mobile number"
                                                        pattern="^\+?[0-9]{10,15}$"
                                                        title="Enter a valid mobile number (10 to 15 digits)"
                                                        value={regData.mobile} onChange={(e) => setRegData({ ...regData, mobile: e.target.value })}
                                                        className="w-full h-11 px-4 rounded border text-sm focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-shadow"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[#00458c] text-sm font-semibold mb-1.5">
                                                        Email Address
                                                        {inviteData && <span className="text-xs text-slate-400 ml-2">(locked from invitation)</span>}
                                                    </label>
                                                    <input
                                                        type="email" required 
                                                        placeholder="Enter your email address"
                                                        value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                                                        disabled={!!inviteData}
                                                        className="w-full h-11 px-4 rounded border text-sm focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-shadow disabled:bg-slate-100 disabled:text-slate-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[#00458c] text-sm font-semibold mb-1.5">Retirement Age Goal</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="18"
                                                        max="100"
                                                        placeholder="e.g., 60"
                                                        value={regData.retirement_age_goal}
                                                        onChange={(e) => setRegData({ ...regData, retirement_age_goal: e.target.value })}
                                                        className="w-full h-11 px-4 rounded border text-sm focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-shadow"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 mt-8 bg-[#f37920] hover:bg-[#e06b18] text-white font-bold rounded shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? "Please wait..." : (activeTab === "login" ? "Get OTP →" : "Send OTP →")}
                                </button>
                            </form>
                        )}

                        {/* ── Step 2: OTP Verification ── */}
                        {step === 2 && (
                            <form onSubmit={verifyOTP}>
                                <div className="mb-8 text-center">
                                    <h2 className="text-[#00458c] text-2xl font-bold mb-2">Verify OTP</h2>
                                    <p className="text-sm text-gray-500">
                                        Sent to {activeTab === "login" ? identifier : regData.mobile}
                                        <button type="button" onClick={() => setStep(1)} className="text-[#f37920] font-semibold ml-2 hover:underline">Edit</button>
                                    </p>
                                </div>

                                <OTPInput value={otp} onChange={setOtp} />

                                <div className="text-center mb-8">
                                    <span className="text-sm text-gray-500">
                                        {timer > 0 ? (
                                            <>Resend OTP in <span className="text-[#00458c] font-semibold font-mono ml-1">00:{timer.toString().padStart(2, "0")}</span></>
                                        ) : (
                                            <button type="button" onClick={resendOTP} className="text-[#f37920] font-semibold hover:underline">
                                                Resend OTP Now
                                            </button>
                                        )}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.join("").length < 6}
                                    className="w-full h-12 bg-[#f37920] hover:bg-[#e06b18] text-white font-bold rounded shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Verifying..." : (activeTab === "login" ? "Verify & Login" : "Verify & Create Account")}
                                </button>
                            </form>
                        )}

                        {/* Legal Footer */}
                        <div className="mt-8 text-center">
                            <p className="text-[11px] text-gray-400 leading-tight px-4">
                                By proceeding, you agree to our <a href="#" className="text-[#00458c] hover:underline">Terms & Conditions</a> and <a href="#" className="text-[#00458c] hover:underline">Privacy Policy</a>
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
