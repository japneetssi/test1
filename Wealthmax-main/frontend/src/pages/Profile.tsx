import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  User,
  ShieldCheck,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Upload,
  Clock,
  ShieldAlert,
  ShieldX
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import KYCModal from "@/components/KYCModal";
import { motion, AnimatePresence } from "framer-motion";
import { LinkedAccounts } from "@/components/LinkedAccounts";
// FIX (useless.md): the US-only bank-linking widget import has been removed -
// it was irrelevant for this Indian wealth platform.
const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

type TabId = 'identity' | 'kyc' | 'accounts';

const TABS: { id: TabId; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'kyc', label: 'KYC Verification' },
  { id: 'accounts', label: 'Linked Accounts' },
];

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('identity');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);

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

  const getKycStatusBadge = () => {
    const status = profile?.kyc_status || 'Pending';
    switch (status.toLowerCase()) {
      case 'verified':
        return <Badge className="bg-emerald-500 text-white flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-white flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white flex items-center gap-1"><ShieldX className="w-3 h-3"/> Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> {status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <SubNav />
        <main className="px-4 py-6 max-w-[1000px] mx-auto">
          <div className="space-y-6">
            <SkeletonBlock className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonBlock className="h-64 rounded-2xl" />
              <SkeletonBlock className="h-64 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNav />
      <SubNav />

      <main className="px-4 py-6 max-w-[1000px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00458c] to-[#0056b3] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {profile?.full_name || "User"}
                  </h1>
                  {getKycStatusBadge()}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {profile?.email || "No email set"} • {profile?.mobile || "No phone set"}
                </p>
              </div>
              <Button
                onClick={() => setIsKYCModalOpen(true)}
                className="bg-[#00458c] hover:bg-[#0056b3] text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <div className="inline-flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? "bg-[#00458c] text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }
                  `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'identity' && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="glass-panel border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#00458c] flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <User className="w-4 h-4" />
                        Full Name
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.full_name || "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.email || "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <Phone className="w-4 h-4" />
                        Phone
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.mobile || "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <Calendar className="w-4 h-4" />
                        Date of Birth
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.dob ? new Date(profile.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <FileText className="w-4 h-4" />
                        PAN Number
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.pan_number || "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <User className="w-4 h-4" />
                        Occupation
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.occupation || "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <User className="w-4 h-4" />
                        Marital Status
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.marital_status || "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <Calendar className="w-4 h-4" />
                        Retirement Age Goal
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.retirement_age_goal ? `${profile.retirement_age_goal} years` : "Not provided"}
                      </p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-semibold">
                        <MapPin className="w-4 h-4" />
                        Residential Address
                      </div>
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {profile?.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {profile?.govt_id_type && (
                <Card className="glass-panel border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#00458c] flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Government ID
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 uppercase font-semibold">
                          ID Type
                        </div>
                        <p className="text-base font-semibold text-slate-900 dark:text-white capitalize">
                          {profile.govt_id_type}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 uppercase font-semibold">
                          ID Number
                        </div>
                        <p className="text-base font-semibold text-slate-900 dark:text-white">
                          {profile.govt_id_number || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'kyc' && (
            <motion.div
              key="kyc"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="glass-panel border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#00458c] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    KYC Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center text-center py-8">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
                      profile?.kyc_status?.toLowerCase() === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                      profile?.kyc_status?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {profile?.kyc_status?.toLowerCase() === 'verified' ? <CheckCircle2 className="w-12 h-12" /> :
                       profile?.kyc_status?.toLowerCase() === 'pending' ? <Clock className="w-12 h-12" /> :
                       <ShieldX className="w-12 h-12" />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {profile?.kyc_status || 'Pending'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md">
                      {profile?.kyc_status?.toLowerCase() === 'verified'
                        ? 'Your account has been fully verified. You have access to all features.'
                        : profile?.kyc_status?.toLowerCase() === 'rejected'
                        ? 'Your KYC submission was rejected. Please update your details and try again.'
                        : 'Complete your KYC verification to unlock all features.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#00458c] flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Required Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Government ID (Front)', description: 'Aadhaar, Passport, Driving License, or Voter ID' },
                    { name: 'Government ID (Back)', description: 'Back side of your ID document' },
                    { name: 'Selfie with ID', description: 'A clear photo of you holding your ID' }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{doc.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{doc.description}</p>
                      </div>
                      <Badge variant="outline" className="text-slate-500">
                        Not uploaded
                      </Badge>
                    </div>
                  ))}

                  <Button className="w-full bg-[#00458c] hover:bg-[#0056b3] text-white" onClick={() => setIsKYCModalOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Identity & KYC
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-panel border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#00458c] flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Submission History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400">No submission history yet.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h2 className="text-xl font-bold">Linked Bank Accounts</h2>
                      <p className="text-sm text-slate-500">Linked accounts from your uploaded holdings.</p>
                  </div>
              </div>
              <LinkedAccounts />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

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
          govt_id_number: profile?.govt_id_number,
          address: profile?.address,
          kyc_status: profile?.kyc_status
        }}
        onSuccess={() => {
          api.get('/profile').then(({ data }) => {
            setProfile(data.data);
          });
        }}
      />
    </div>
  );
}
