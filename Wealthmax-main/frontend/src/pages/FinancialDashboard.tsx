import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  User,
  ShieldCheck,
  Wallet,
  Sparkles,
  Target,
  Edit,
  Minus,
  TrendingUp,
  CreditCard,
  Shield,
  Activity,
  Settings,
  Image as MediaIcon,
  ChevronRight,
  RefreshCw,
  Bell,
  Lock,
  CreditCard as BillingIcon,
  BarChart3,
  Zap,
  Globe,
  UploadCloud,
  FileText,
  Trash2,
  Check,
  Download
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import KYCModal from "@/components/KYCModal";
import { motion, AnimatePresence } from "framer-motion";

// Utility for formatting numbers in Indian Rupee format (e.g., 15,00,000)
const formatINR = (val: string | number) => {
  if (val === undefined || val === null) return "";
  let strVal = val.toString();
  if (strVal.includes('.')) {
    strVal = strVal.split('.')[0];
  }
  const numeric = strVal.replace(/[^0-9]/g, "");
  if (!numeric) return "";
  return Number(numeric).toLocaleString("en-IN");
};

const parseINR = (val: string | number) => {
  if (val === undefined || val === null) return "0";
  return val.toString().replace(/[^0-9]/g, "");
};

type TabId = 'overview' | 'activity' | 'settings' | 'media';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'activity', label: 'Activity', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'media', label: 'Media', icon: MediaIcon },
];

const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

const normalizeToAnnual = (amount: number, freq: string) => {
  if (freq === 'Monthly') return amount * 12;
  if (freq === 'Quarterly') return amount * 4;
  if (freq === 'Daily') return amount * 365;
  return amount; // Annually
};

const normalizeExpensesToMonthly = (amount: number, freq: string) => {
  if (freq === 'Annually') return amount / 12;
  if (freq === 'Quarterly') return amount / 4;
  if (freq === 'Daily') return amount * 30;
  return amount / 1; // Monthly
};

const normalizeToMonthly = (amount: number, freq: string) => {
  if (freq === 'Annually') return amount / 12;
  if (freq === 'Quarterly') return amount / 3;
  if (freq === 'Daily') return amount * 30;
  return amount;
};

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    emailNotif: true,
    smsNotif: false,
    language: 'English',
    currency: 'INR'
  });

  const [documents, setDocuments] = useState([
    { id: 1, name: 'Tax_Return_2025.pdf', size: '2.4 MB', date: '2026-06-15' },
    { id: 2, name: 'Investment_Proof.png', size: '1.1 MB', date: '2026-06-10' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalSection, setActiveModalSection] = useState<string>('all');
  const [baseGross, setBaseGross] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    dob: "",
    dependents: "",
    gross_income: "",
    other_income_sources: {},
    additional_income: "",
    income_details: [] as { source: string, amount: string, frequency: string }[],
    monthly_household_expenses: "",
    monthly_obligations: "",
    expense_details: [] as { source: string, amount: string, frequency: string }[],
    asset_details: [] as { category: string, type: string, amount: string }[],
    liability_details: [] as { type: string, amount: string, emi: string }[],
    emergency_fund_amount: "",
    safety_net_details: [] as { type: string, premium: string, amount: string }[],
    dependent_details: [] as { name: string, age: string, income: string }[],
    pan_number: ""
  });

  const handleOpenModal = (section: string = 'all') => {
    setActiveModalSection(section);
    setBaseGross(profile?.gross_income || 0);
    setFormData({
      dob: (() => {
        if (!profile?.dob) return "";
        const d = new Date(profile.dob);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      dependents: profile?.dependents?.toString() || "0",
      gross_income: formatINR((profile?.gross_income || 0).toString()),
      other_income_sources: profile?.modularData?.income?.other_income_sources || {},
      additional_income: formatINR((profile?.other_income || 0).toString()),
      income_details: profile?.modularData?.income || [],
      monthly_household_expenses: formatINR((profile?.fixed_expenses || 0).toString()),
      monthly_obligations: formatINR((profile?.liabilities_emi || 0).toString()),
      expense_details: profile?.modularData?.expenses || [],
      asset_details: profile?.modularData?.assets || [],
      liability_details: profile?.modularData?.liabilities || [],
      emergency_fund_amount: formatINR((profile?.modularData?.safetyNet?.emergency_fund_amount || 0).toString()),
      safety_net_details: profile?.modularData?.safetyNet?.insurance || [],
      dependent_details: profile?.modularData?.safetyNet?.dependents || [],
      pan_number: profile?.pan_number || ""
    });
    setIsModalOpen(true);
  };

  const handleChange = useCallback((field: keyof typeof formData, value: string) => {
    if (field === 'dob') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (field === 'dependents') {
      const numeric = value.replace(/[^0-9]/g, "").slice(0, 3);
      setFormData(prev => ({ ...prev, [field]: numeric }));
    } else if (['gross_income', 'additional_income', 'monthly_household_expenses', 'monthly_obligations', 'emergency_fund_amount'].includes(field as string)) {
      setFormData(prev => ({ ...prev, [field]: formatINR(value) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  const addArrayItem = useCallback((field: keyof typeof formData, newItem: any) => {
    setFormData(prev => ({ ...prev, [field]: [...(prev[field] as any[]), newItem] }));
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    
    // Auto-calculate Gross Income
    const calculated_gross = formData.income_details.length > 0 
      ? formData.income_details.reduce((sum, item) => sum + normalizeToAnnual(Number(parseINR(item.amount)), item.frequency), 0)
      : baseGross;
    const additional = Number(parseINR(formData.additional_income || '0'));
    setFormData(prev => ({ ...prev, gross_income: formatINR((calculated_gross + additional).toString()) }));
    
    // Auto-calculate Expenses
    if (formData.expense_details.length > 0) {
      const calculated_expenses = formData.expense_details.reduce((sum, item) => sum + normalizeExpensesToMonthly(Number(parseINR(item.amount)), item.frequency), 0);
      setFormData(prev => ({ ...prev, monthly_household_expenses: formatINR(calculated_expenses.toString()) }));
    }

    // Auto-calculate EMI/Obligations
    if (formData.liability_details.length > 0) {
      // Assuming all liabilities input might be EMIs, or just sum them
      const calculated_emi = formData.liability_details.reduce((sum, item) => sum + Number(parseINR(item.emi || '0')), 0);
      setFormData(prev => ({ ...prev, monthly_obligations: formatINR(calculated_emi.toString()) }));
    }
  }, [formData.income_details, formData.expense_details, formData.liability_details, formData.additional_income, isModalOpen, baseGross]);

  const removeArrayItem = useCallback((field: keyof typeof formData, index: number) => {
    setFormData(prev => ({ ...prev, [field]: (prev[field] as any[]).filter((_, i) => i !== index) }));
  }, []);

  const updateArrayItem = useCallback((field: keyof typeof formData, index: number, key: string, value: string) => {
    setFormData(prev => {
      const arr = [...(prev[field] as any[])];
      if (key === 'amount' || key === 'premium') {
        arr[index] = { ...arr[index], [key]: formatINR(value) };
      } else {
        arr[index] = { ...arr[index], [key]: value };
      }
      return { ...prev, [field]: arr };
    });
  }, []);

  const handleUpdateFinancials = async () => {
    setIsUpdating(true);
    try {
      const payload = {
        dob: formData.dob || undefined,
        dependents: Number(formData.dependents),
        pan_number: formData.pan_number || undefined,
        gross_income: Number(parseINR(formData.gross_income)),
        other_income: Number(parseINR(formData.additional_income)),
        income_details: formData.income_details.map(item => ({...item, amount: parseINR(item.amount)})),
        expense_details: formData.expense_details.map(item => ({...item, amount: parseINR(item.amount)})),
        asset_details: formData.asset_details.map(item => ({...item, amount: parseINR(item.amount)})),
        liability_details: formData.liability_details.map(item => ({...item, amount: parseINR(item.amount), emi: parseINR(item.emi || '0')})),
        safety_net_details: formData.safety_net_details.map(item => ({...item, premium: parseINR(item.premium), amount: parseINR(item.amount)})),
        dependent_details: formData.dependent_details.map(item => ({...item, age: Number(item.age), income: parseINR(item.income)})),
        income: {
          gross_monthly_income: Number(parseINR(formData.gross_income)) / 12,
          gross_annual_income: Number(parseINR(formData.gross_income)),
          additional_income: Number(parseINR(formData.additional_income))
        },
        expenses: {
          monthly_household_expenses: Number(parseINR(formData.monthly_household_expenses)),
          monthly_obligations: Number(parseINR(formData.monthly_obligations))
        },
        emergency_fund_amount: Number(parseINR(formData.emergency_fund_amount)),
        safetyNet: {
          emergency_fund_amount: Number(parseINR(formData.emergency_fund_amount))
        }
      };

      await api.post('/profile/update', payload);
      const freshProfile = await api.get('/profile');
      setProfile(freshProfile.data.data);

      setIsModalOpen(false);
      toast({
        title: "Profile Updated",
        description: "Your financial information has been saved and persona recalculated.",
      });
    } catch (err: any) {
      console.error("Failed to update profile", err);
      toast({
        title: "Update Failed",
        description: err.message || "An error occurred while saving.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem('wm_token');
      if (!token) {
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        const { data } = await api.get('/profile');
        setProfile(data.data);
      } catch (err: any) {
        console.error('Failed to fetch profile', err);
        if (err.message?.includes('401') || err.response?.status === 401) {
          localStorage.removeItem('wm_token');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);

  const income = profile?.modularData?.income || {};
  const expenses = profile?.modularData?.expenses || {};
  const assets = profile?.modularData?.assets || [];
  const liabilities = profile?.modularData?.liabilities || [];
  const safetyNet = profile?.modularData?.safetyNet || {};

  const totalAssets = useMemo(() => assets.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0), [assets]);
  const totalLiabilities = useMemo(() => liabilities.reduce((sum: number, l: any) => sum + Number(l.amount || 0), 0), [liabilities]);

  // ── Skeleton Loader ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <SubNav />
        <main className="px-4 py-6 max-w-[1200px] mx-auto">
          {/* Cover Skeleton */}
          <SkeletonBlock className="h-32 w-full rounded-2xl mb-6" />
          {/* Header Skeleton */}
          <div className="flex items-center gap-5 mb-8">
            <SkeletonBlock className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-6 w-48" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
          </div>
          {/* Tabs Skeleton */}
          <SkeletonBlock className="h-10 w-64 rounded-lg mb-6" />
          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <SkeletonBlock key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Masking helpers
  const maskPAN = (pan?: string) => {
    if (!pan) return "Not Provided";
    const cleanPan = pan.trim().toUpperCase();
    if (cleanPan.length < 10) return cleanPan;
    return `${cleanPan.substring(0, 3)}*****${cleanPan.substring(cleanPan.length - 2)}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not Provided";
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };


  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNav />
      <SubNav />

      <main className="px-4 py-6 max-w-[1200px] mx-auto">
        {/* ── Premium Cover / Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-20"
        >
          <div className="h-28 sm:h-36 md:h-40 w-full rounded-2xl overflow-hidden glass-panel relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00458c]/90 via-[#00458c]/60 to-[#f37920]/70" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
            <div className="absolute inset-0 cover-gradient" />
            <div className="absolute inset-0 flex items-center justify-between px-6 md:px-10">
              <div className="text-white/90 space-y-1">
                <p className="text-xs font-medium uppercase tracking-widest opacity-80">WealthMax</p>
                <h2 className="text-lg md:text-xl font-semibold tracking-tight">Financial Command Center</h2>
              </div>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-4 pr-2 border-r border-white/20">
                  <div className="flex flex-col items-end text-white text-right">
                    <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">Financial Health Score</span>
                    <span className="text-lg md:text-xl font-bold">{profile?.health_score || 0}/100</span>
                  </div>
                  <div className="flex flex-col items-start text-white text-left pl-4 border-l border-white/20">
                    <span className="text-[10px] font-medium uppercase tracking-widest opacity-80">Survey Score</span>
                    <span className="text-lg md:text-xl font-bold">{profile?.risk_score || 0}/100</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/onboarding/financial-snapshot')}
                  className="btn-glass-primary text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Recalculate</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Floating Profile Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative -mt-14 mb-6"
        >
          <div className="glass-panel px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar with status */}
            <div className="relative -mt-12 sm:-mt-14 shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#00458c] to-[#0056b3] border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-white text-2xl font-bold">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full" />
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload avatar"
                className="absolute inset-0 rounded-full bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white"
              >
                <MediaIcon className="w-6 h-6" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const file = e.target.files[0];
                    if (file.size > 5 * 1024 * 1024) {
                      toast({ title: "Upload Failed", description: "Image size must be less than 5 MB.", variant: "destructive" });
                      return;
                    }
                    toast({ title: "Avatar Updated", description: "Your new avatar has been successfully uploaded." });
                  }
                }}
              />
            </div>

            {/* Name / Bio / Stats */}
            <div className="flex-1 pt-2 sm:pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {profile?.full_name || "User"}
                </h1>
                {profile?.risk_class && (
                  <Badge className="bg-[#00458c] text-white text-[10px] uppercase tracking-wider">
                    {profile.risk_class}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                {profile?.occupation || "Investor"} · {profile?.marital_status || "Not specified"}
              </p>
              <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Wallet className="w-4 h-4 text-[#f37920]" />
                  <span className="font-medium">Net Worth:</span>
                  <span className="font-semibold text-[#00458c]">₹{formatINR(totalAssets)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Persona:</span>
                  <span className="font-semibold text-[#00458c]">
                    {profile?.persona_data?.persona?.name || "Not Assigned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="sm:self-start mt-2 sm:mt-0">
              <Button
                onClick={() => setIsKYCModalOpen(true)}
                variant="outline"
                className="btn-glass-secondary"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── Tab Navigation (animated pill) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
          role="tablist"
          aria-label="Profile sections"
        >
          <div className="inline-flex items-center gap-1 p-1 rounded-full glass-panel">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-250
                    ${isActive
                      ? "text-[#00458c] shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-[#00458c] dark:hover:text-[#60a5fa]"
                    }
                  `}
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200/60 dark:border-slate-700/60"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="tab-panel"
            >
              {/* Premium WealthMax Identity Banner */}
              <motion.div variants={item} className="glass-card p-6 mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-orange-50/50 dark:from-blue-900/10 dark:to-orange-900/10" />
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00458c]" />
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                      <Target className="w-6 h-6 text-[#00458c]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">WealthMax Identity</p>
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                        {profile?.persona_data?.persona?.name || "Not Profiled Yet"}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                        {profile?.persona_data?.persona?.description || "Complete risk profiling to get personalized financial insights."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Risk Class</span>
                    {profile?.risk_class ? (
                      <Badge className="bg-[#f37920] hover:bg-[#d96a1a] text-white px-3 py-1 text-xs uppercase tracking-wider shadow-sm transition-colors">
                        {profile.risk_class}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs uppercase tracking-wider text-slate-500 px-3 py-1 bg-white/50 dark:bg-slate-800/50">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Financial Snapshot (Modular) */}
                <div className="space-y-5">
                  {/* 1. Income */}
                  <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Income Summary
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal('income')} className="h-7 text-[11px] text-[#00458c]">
                        Edit <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Gross Monthly Income</p>
                        <p className="text-base font-bold text-slate-900">₹{formatINR(profile?.gross_income ? profile.gross_income / 12 : 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Gross Annual Income</p>
                        <p className="text-base font-bold text-slate-900">₹{formatINR(profile?.gross_income || 0)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 mb-2">Other Sources</p>
                        {Array.isArray(income) && income.map((item: any, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                            <span className="text-slate-600">{item.source} <span className="text-xs text-slate-400">({item.frequency})</span></span>
                            <span className="font-medium">₹{formatINR(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>


                  {/* 3. Assets */}
                  <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Assets
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal('assets')} className="h-7 text-[11px] text-[#00458c]">
                        Edit <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {['Financial', 'Physical', 'Other'].map(category => {
                        const items = Array.isArray(assets) ? assets.filter((a: any) => a.category === category) : [];
                        if (!items.length) return null;
                        return (
                          <div key={category} className="space-y-2">
                            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                              {category}
                            </p>
                            {items.map((asset: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-slate-700">{asset.type}</span>
                                <span className="font-medium text-slate-900">₹{formatINR(asset.amount)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>

                {/* Right: Expenses, Liabilities, Safety Net */}
                <div className="space-y-5">
                  {/* 2. Expenses */}
                  <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">
                        <Minus className="w-4 h-4" /> Expenses
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal('expenses')} className="h-7 text-[11px] text-[#00458c]">
                        Edit <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Monthly Household Expenses</span>
                        <span className="font-semibold text-slate-900">₹{formatINR(profile?.fixed_expenses || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Monthly Obligations (EMI)</span>
                        <span className="font-semibold text-slate-900">₹{formatINR(profile?.liabilities_emi || 0)}</span>
                      </div>
                      {Array.isArray(expenses) && expenses.map((item: any, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm py-1 border-t border-slate-100/60 pt-2 mt-2">
                          <span className="text-slate-600">{item.source} <span className="text-xs text-slate-400">({item.frequency})</span></span>
                          <span className="font-medium">₹{formatINR(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* 4. Liabilities */}
                  <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Liabilities
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal('liabilities')} className="h-7 text-[11px] text-[#00458c]">
                        Edit <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {Array.isArray(liabilities) && liabilities.map((liab: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-slate-700">{liab.type}</span>
                          <span className="font-medium text-slate-900">₹{formatINR(liab.amount)}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-900">Total</span>
                        <span className="text-sm font-bold text-[#00458c]">₹{formatINR(totalLiabilities)}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* 5. Financial Safety Net */}
                  <motion.div variants={item} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-[#00458c] flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Safety Net
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal('safetynet')} className="h-7 text-[11px] text-[#00458c]">
                        Edit <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Emergency Fund</p>
                        <p className="text-base font-bold text-slate-900">₹{formatINR(safetyNet?.emergency_fund_amount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Insurance Coverage</p>
                        <div className="space-y-2">
                          {Array.isArray(safetyNet?.insurance) && safetyNet.insurance.map((ins: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-white/40 dark:bg-slate-800/40 rounded-lg px-3 py-2">
                              <span className="text-slate-700 capitalize">{ins.type}</span>
                              <div className="text-right">
                                <span className="block font-medium text-slate-900">₹{formatINR(ins.amount)}</span>
                                <span className="text-[11px] text-slate-500">Premium: ₹{formatINR(ins.premium)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-4">
                        <p className="text-xs text-slate-500 mb-2">Dependents Info</p>
                        {Array.isArray(safetyNet?.dependents) && safetyNet.dependents.length > 0 ? (
                          <div className="space-y-2">
                            {safetyNet.dependents.map((dep: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm bg-white/40 dark:bg-slate-800/40 rounded-lg px-3 py-2">
                                <div>
                                  <span className="block font-medium text-slate-900">{dep.name}</span>
                                  <span className="text-[11px] text-slate-500">Age: {dep.age}</span>
                                </div>
                                <div className="text-right">
                                  <span className="block font-medium text-slate-900">₹{formatINR(dep.income)}</span>
                                  <span className="text-[11px] text-slate-500">Income</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic">No dependents added</p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="tab-panel"
            >
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-[#00458c] mb-6">Recent Activity</h3>
                <div className="space-y-6">
                  {[
                    { title: "Profile Updated", desc: "You updated your financial details.", date: "Today, 10:30 AM", icon: Edit },
                    { title: "Survey Completed", desc: "Financial health score recalculated.", date: "Yesterday, 2:15 PM", icon: CheckCircle2 },
                    { title: "Logged In", desc: "Successful login from a new device (Mac).", date: "Jun 28, 9:00 AM", icon: ShieldCheck },
                  ].map((act, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="p-2 bg-[#00458c]/10 rounded-full h-fit">
                        <act.icon className="w-5 h-5 text-[#00458c]" />
                      </div>
                      <div className="flex-1 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <h4 className="text-sm font-semibold text-slate-900">{act.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{act.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-2">{act.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="tab-panel"
            >
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-[#00458c] mb-6">Settings</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Email Notifications</h4>
                      <p className="text-xs text-slate-500 mt-1">Receive weekly financial summaries and alerts.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.emailNotif} onChange={(e) => setSettings(s => ({...s, emailNotif: e.target.checked}))} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00458c]"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">SMS Notifications</h4>
                      <p className="text-xs text-slate-500 mt-1">Get instant alerts for critical security events.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.smsNotif} onChange={(e) => setSettings(s => ({...s, smsNotif: e.target.checked}))} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00458c]"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-4">Preferences</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 mb-2">Language</label>
                        <select 
                          className="glass-input w-full h-10 px-3 text-sm appearance-none bg-transparent"
                          value={settings.language}
                          onChange={(e) => setSettings(s => ({...s, language: e.target.value}))}
                        >
                          <option>English</option>
                          <option>Hindi</option>
                          <option>Marathi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-2">Default Currency</label>
                        <select 
                          className="glass-input w-full h-10 px-3 text-sm appearance-none bg-transparent"
                          value={settings.currency}
                          onChange={(e) => setSettings(s => ({...s, currency: e.target.value}))}
                        >
                          <option>INR (₹)</option>
                          <option>USD ($)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={() => toast({title: "Settings Saved", description: "Your preferences have been updated."})} className="btn-glass-primary">
                      <Check className="w-4 h-4 mr-2" /> Save Settings
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div
              key="media"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="tab-panel"
            >
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-[#00458c]">Media Gallery</h3>
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.onchange = (e: any) => {
                      if (e.target.files?.length) {
                        const file = e.target.files[0];
                        setDocuments(docs => [{id: Date.now(), name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + ' MB', date: new Date().toISOString().split('T')[0]}, ...docs]);
                        toast({title: "File Uploaded", description: `${file.name} uploaded successfully.`});
                      }
                    };
                    input.click();
                  }}>
                    <UploadCloud className="w-3 h-3 mr-2" /> Upload
                  </Button>
                </div>
                
                {documents.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                            <FileText className="w-5 h-5 text-[#f37920]" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{doc.name}</h4>
                            <p className="text-[11px] text-slate-500">{doc.size} • {doc.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toast({title: "Downloading...", description: `Starting download for ${doc.name}`})}>
                            <Download className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                            setDocuments(docs => docs.filter(d => d.id !== doc.id));
                            toast({title: "File Deleted", description: `${doc.name} has been removed.`});
                          }}>
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Financial Update Modal (glass) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between bg-white/50 dark:bg-slate-800/50">
                <h2 className="text-lg font-bold text-[#00458c] dark:text-white">Update Financial Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  ✕
                </Button>
              </div>
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {(activeModalSection === 'all' || activeModalSection === 'identity') && (
                  <>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#00458c] text-sm font-bold mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleChange("dob", e.target.value)}
                      className="glass-input w-full h-11 px-4 text-[14px] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#00458c] text-sm font-bold mb-2">Dependents</label>
                    <input
                      type="text"
                      value={formData.dependents}
                      onChange={(e) => handleChange("dependents", e.target.value)}
                      className="glass-input w-full h-11 px-4 text-[14px] font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#00458c] text-sm font-bold mb-2">PAN Number</label>
                  <input
                    type="text"
                    value={formData.pan_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="glass-input w-full h-11 px-4 text-[14px] font-semibold"
                  />
                </div>

                </>
                )}
                {/* Income */}
                {(activeModalSection === 'all' || activeModalSection === 'income') && (
                  <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Income</p>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('income_details', { source: '', amount: '', frequency: 'Monthly' })} className="h-7 text-[11px]">
                      + Add Income
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[#00458c] text-sm font-bold mb-2">Gross Annual Income (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                        <input type="text" value={formData.gross_income} onChange={(e) => handleChange("gross_income", e.target.value)} className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Income From All Sources & Additional Income</p>
                    </div>
                    <div>
                      <label className="block text-[#00458c] text-sm font-bold mb-2">Additional Income (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                        <input type="text" value={formData.additional_income} onChange={(e) => handleChange("additional_income", e.target.value)} className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {formData.income_details.map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Source</label>
                          <input type="text" value={item.source} onChange={(e) => updateArrayItem('income_details', idx, 'source', e.target.value)} className="glass-input w-full h-9 px-3 text-sm" placeholder="e.g. Freelance" />
                        </div>
                        <div className="flex-1 relative">
                          <label className="block text-xs text-slate-500 mb-1">Amount</label>
                          <span className="absolute left-3 top-[26px] text-slate-400 text-sm">₹</span>
                          <input type="text" value={item.amount} onChange={(e) => updateArrayItem('income_details', idx, 'amount', e.target.value)} className="glass-input w-full h-9 pl-7 pr-3 text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Frequency</label>
                          <select value={item.frequency} onChange={(e) => updateArrayItem('income_details', idx, 'frequency', e.target.value)} className="glass-input w-full h-9 px-3 text-sm appearance-none bg-transparent">
                            <option value="Daily">Daily</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annually">Annually</option>
                          </select>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('income_details', idx)} className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">✕</Button>
                      </div>
                    ))}
                  </div>
                </div>

                
                )}
                {/* Expenses */}
                {(activeModalSection === 'all' || activeModalSection === 'expenses') && (
                  <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expenses</p>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('expense_details', { source: '', amount: '', frequency: 'Monthly' })} className="h-7 text-[11px]">
                      + Add Expenses
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[#00458c] text-sm font-bold mb-2">Monthly Household Expenses (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                        <input type="text" value={formData.monthly_household_expenses} readOnly className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold bg-slate-50/50 cursor-not-allowed" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#00458c] text-sm font-bold mb-2">Monthly Obligations (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                        <input type="text" value={formData.monthly_obligations} readOnly className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold bg-slate-50/50 cursor-not-allowed" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Combined EMI Liabilities Per Month</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {formData.expense_details.map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Source</label>
                          <input type="text" value={item.source} onChange={(e) => updateArrayItem('expense_details', idx, 'source', e.target.value)} className="glass-input w-full h-9 px-3 text-sm" placeholder="e.g. Subscriptions" />
                        </div>
                        <div className="flex-1 relative">
                          <label className="block text-xs text-slate-500 mb-1">Amount</label>
                          <span className="absolute left-3 top-[26px] text-slate-400 text-sm">₹</span>
                          <input type="text" value={item.amount} onChange={(e) => updateArrayItem('expense_details', idx, 'amount', e.target.value)} className="glass-input w-full h-9 pl-7 pr-3 text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Frequency</label>
                          <select value={item.frequency} onChange={(e) => updateArrayItem('expense_details', idx, 'frequency', e.target.value)} className="glass-input w-full h-9 px-3 text-sm appearance-none bg-transparent">
                            <option value="Daily">Daily</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annually">Annually</option>
                          </select>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('expense_details', idx)} className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">✕</Button>
                      </div>
                    ))}
                  </div>
                </div>

                
                )}
                {/* Assets */}
                {(activeModalSection === 'all' || activeModalSection === 'assets') && (
                  <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assets</p>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('asset_details', { category: 'Financial', type: 'Bank Balance', amount: '' })} className="h-7 text-[11px]">
                      + Add Asset
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.asset_details.map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex-[0.8]">
                          <label className="block text-xs text-slate-500 mb-1">Category</label>
                          <select value={item.category} onChange={(e) => updateArrayItem('asset_details', idx, 'category', e.target.value)} className="glass-input w-full h-9 px-3 text-sm appearance-none bg-transparent">
                            <option value="Financial">Financial</option>
                            <option value="Physical">Physical</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Type/Name</label>
                          <select value={item.type} onChange={(e) => updateArrayItem('asset_details', idx, 'type', e.target.value)} className="glass-input w-full h-9 px-3 text-sm appearance-none bg-transparent">
                            <option value="" disabled>Select Type</option>
                            <option value="MF">MF</option>
                            <option value="MF Lumsum">MF Lumsum</option>
                            <option value="Equity">Equity</option>
                            <option value="FD">FD</option>
                            <option value="AIF's">AIF's</option>
                            <option value="PMS">PMS</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Bank Balance">Bank Balance</option>
                            <option value="Gold">Gold</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex-1 relative">
                          <label className="block text-xs text-slate-500 mb-1">Amount</label>
                          <span className="absolute left-3 top-[26px] text-slate-400 text-sm">₹</span>
                          <input type="text" value={item.amount} onChange={(e) => updateArrayItem('asset_details', idx, 'amount', e.target.value)} className="glass-input w-full h-9 pl-7 pr-3 text-sm" />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('asset_details', idx)} className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">✕</Button>
                      </div>
                    ))}
                  </div>
                </div>

                
                )}
                {/* Liabilities */}
                {(activeModalSection === 'all' || activeModalSection === 'liabilities') && (
                  <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Liabilities</p>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('liability_details', { type: 'Home Loan', amount: '', emi: '' })} className="h-7 text-[11px]">
                      + Add Liability
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.liability_details.map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Type</label>
                          <select value={item.type} onChange={(e) => updateArrayItem('liability_details', idx, 'type', e.target.value)} className="glass-input w-full h-9 px-3 text-sm appearance-none bg-transparent">
                            <option value="Home Loan">Home Loan</option>
                            <option value="Personal Loan">Personal Loan</option>
                            <option value="Car Loan">Car Loan</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Business Loan">Business Loan</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex-[1.5] relative">
                          <label className="block text-xs text-slate-500 mb-1">Outstanding Amount</label>
                          <span className="absolute left-3 top-[26px] text-slate-400 text-sm">₹</span>
                          <input type="text" value={item.amount} onChange={(e) => updateArrayItem('liability_details', idx, 'amount', e.target.value)} className="glass-input w-full h-9 pl-7 pr-3 text-sm" />
                        </div>
                        <div className="flex-1 relative">
                          <label className="block text-xs text-slate-500 mb-1">Monthly EMI</label>
                          <span className="absolute left-3 top-[26px] text-slate-400 text-sm">₹</span>
                          <input type="text" value={item.emi || ''} onChange={(e) => updateArrayItem('liability_details', idx, 'emi', e.target.value)} className="glass-input w-full h-9 pl-7 pr-3 text-sm" />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('liability_details', idx)} className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">✕</Button>
                      </div>
                    ))}
                  </div>
                </div>

                
                )}
                {/* Safety Net */}
                {(activeModalSection === 'all' || activeModalSection === 'safetynet') && (
                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Safety Net</p>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('safety_net_details', { type: 'Life/Term Insurance', premium: '', amount: '' })} className="h-7 text-[11px]">
                      + Add Insurance
                    </Button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[#00458c] text-sm font-bold mb-2">Emergency Fund (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input type="text" value={formData.emergency_fund_amount} onChange={(e) => handleChange("emergency_fund_amount", e.target.value)} className="glass-input w-full h-11 pl-8 pr-4 text-[15px] font-semibold" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {formData.safety_net_details.map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Type</label>
                          <select value={item.type} onChange={(e) => updateArrayItem('safety_net_details', idx, 'type', e.target.value)} className="glass-input w-full h-9 px-3 text-[13px] appearance-none bg-transparent">
                            <option value="Life/Term Insurance">Life/Term Insurance</option>
                            <option value="Health Insurance">Health Insurance</option>
                            <option value="General Insurance">General Insurance</option>
                          </select>
                        </div>
                        <div className="flex-1 relative">
                          <label className="block text-xs text-slate-500 mb-1">Premium</label>
                          <span className="absolute left-3 top-[26px] text-slate-400 text-sm">₹</span>
                          <input type="text" value={item.premium} onChange={(e) => updateArrayItem('safety_net_details', idx, 'premium', e.target.value)} className="glass-input w-full h-9 pl-7 pr-3 text-sm" placeholder="Yearly" />
                        </div>
                        <div className="flex-1 relative">
                          <label className="block text-xs text-slate-500 mb-1">Coverage</label>
                          <span className="absolute left-3 top-[26px] text-slate-400 text-sm">₹</span>
                          <input type="text" value={item.amount} onChange={(e) => updateArrayItem('safety_net_details', idx, 'amount', e.target.value)} className="glass-input w-full h-9 pl-7 pr-3 text-sm" />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('safety_net_details', idx)} className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">✕</Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-6 mb-3 border-t border-slate-200/60 dark:border-slate-700/60 pt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dependents Data</p>
                    <Button variant="outline" size="sm" onClick={() => addArrayItem('dependent_details', { name: '', age: '', income: '' })} className="h-7 text-[11px]">
                      + Add Dependent
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {formData.dependent_details.map((item, idx) => (
                      <div key={idx} className="flex items-end gap-2 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex-[1.5]">
                          <label className="block text-xs text-slate-500 mb-1">Name</label>
                          <input type="text" value={item.name} onChange={(e) => updateArrayItem('dependent_details', idx, 'name', e.target.value)} className="glass-input w-full h-9 px-3 text-sm" placeholder="Dependent Name" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-500 mb-1">Age</label>
                          <input type="number" value={item.age} onChange={(e) => updateArrayItem('dependent_details', idx, 'age', e.target.value)} className="glass-input w-full h-9 px-3 text-sm" placeholder="Age" />
                        </div>
                        <div className="flex-[1.5] relative">
                          <label className="block text-xs text-slate-500 mb-1">Income</label>
                          <span className="absolute left-3 top-[26px] text-slate-400 text-sm">₹</span>
                          <input type="text" value={item.income} onChange={(e) => updateArrayItem('dependent_details', idx, 'income', e.target.value)} className="glass-input w-full h-9 pl-7 pr-3 text-sm" placeholder="Yearly" />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeArrayItem('dependent_details', idx)} className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">✕</Button>
                      </div>
                    ))}
                  </div>
                </div>
                )}
              </div>
              <div className="px-6 py-4 bg-white/50 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <Button
                  onClick={handleUpdateFinancials}
                  disabled={isUpdating}
                  className="btn-glass-primary"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Save & Recalculate
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Modal */}
      <KYCModal
        isOpen={isKYCModalOpen}
        onClose={() => setIsKYCModalOpen(false)}
        currentData={{
          full_name: profile?.full_name,
          dob: profile?.dob,
          pan_number: profile?.pan_number,
          email: profile?.email,
          mobile: profile?.mobile,
          marital_status: profile?.marital_status,
          occupation: profile?.occupation,
          retirement_age_goal: profile?.retirement_age_goal?.toString(),
          govt_id_type: profile?.govt_id_type,
          govt_id_number: profile?.govt_id_number
        }}
        onSuccess={() => {
          api.get('/profile').then(({ data }) => {
            setProfile(data.data);
          }).catch(() => {});
          toast({
            title: "KYC Update Submitted",
            description: "Your identity changes are pending review"
          });
        }}
      />
    </div>
  );
}
