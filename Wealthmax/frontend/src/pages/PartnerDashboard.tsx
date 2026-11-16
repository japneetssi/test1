import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Palette, 
  CreditCard, 
  LayoutDashboard,
  BarChart3,
  UserCog,
  LogOut,
  Loader2,
  IndianRupee,
  Plus,
  Send,
  UserPlus,
  AlertCircle,
  ShieldAlert,
  HandCoins,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import ClientAnalyticsHub from "@/components/ClientAnalyticsHub";

const PartnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active view based on current path
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes('/partner/advisors')) return 'advisors';
    if (path.includes('/partner/analytics')) return 'analytics';
    if (path.includes('/partner/reassign-clients')) return 'reassign';
    if (path.includes('/partner/settings')) return 'settings';
    return 'overview';
  };
  
  const activeView = getActiveView();
  
  // ── Branding & Advisor Roster States ──────────────────────────────────
  const [branding, setBranding] = useState({
    name: '',
    logo_url: '',
    primary_color: '#00458c',
    action_color: '#f37920'
  });
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [loadingFirm, setLoadingFirm] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newAdvisor, setNewAdvisor] = useState({ name: '', email: '' });
  const [lastInviteLink, setLastInviteLink] = useState('');
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // ── RM Dashboard & Alerts States ──────────────────────────────────────────
  const [metrics, setMetrics] = useState({
    activeClients: 0,
    aumTracked: '0.00 Cr',
    pendingPledges: 0,
    criticalAlerts: 0
  });
  const [clients, setClients] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'roster' | 'alerts'>('roster');

  // ── Onboarding Pipeline States ─────────────────────────────────────────────
  const [prospects, setProspects] = useState<any[]>([]);
  const [loadingProspects, setLoadingProspects] = useState(true);
  const [isAddProspectModalOpen, setIsAddProspectModalOpen] = useState(false);
  const [isSubmittingProspect, setIsSubmittingProspect] = useState(false);
  const [movingProspectId, setMovingProspectId] = useState<string | null>(null);
  const [prospectForm, setProspectForm] = useState({
    full_name: '', email: '', mobile: '', estimated_aum: '', notes: ''
  });

  // ── Analytics & Nudge States ──────────────────────────────────────────────
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedClientForAnalytics, setSelectedClientForAnalytics] = useState<{ id: string, name: string } | null>(null);
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isNudging, setIsNudging] = useState(false);

  // ── Fetching Logic ──────────────────────────────────────────────────────────
  
  const fetchData = async () => {
    try {
      setLoadingFirm(true);
      const [settingsRes, metricsRes, clientsRes, alertsRes, onboardingRes] = await Promise.all([
        api.get("/partner/settings"),
        api.get('/rm/dashboard-metrics'),
        api.get('/rm/clients?limit=50'),
        api.get('/rm/recent-alerts'),
        api.get('/rm/onboarding')
      ]);

      if (settingsRes.data.success) {
        setBranding(settingsRes.data.data.branding);
        setAdvisors(settingsRes.data.data.advisors);
      }
      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
      if (clientsRes.data.success) setClients(clientsRes.data.data.clients);
      if (alertsRes.data.success) setAlerts(alertsRes.data.data);
      if (onboardingRes.data.success) setProspects(onboardingRes.data.data);
      
    } catch (err) { 
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally { 
      setLoadingFirm(false); 
      setLoadingDashboard(false);
      setLoadingProspects(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  
  const formatINR = (amount: number) => {
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleSendNudge = async () => {
    if (!selectedClientId || !nudgeMessage) return;
    setIsNudging(true);
    try {
      const { data } = await api.post(`/rm/nudge/${selectedClientId}`, { message: nudgeMessage });
      if (data.success) {
        toast.success("Nudge sent successfully");
        setIsNudgeModalOpen(false);
        setNudgeMessage('');
      }
    } catch (err) { toast.error("Failed to send nudge"); }
    finally { setIsNudging(false); }
  };

  const handleMoveProspect = async (id: string, currentStage: string) => {
    const STAGES = ['Prospect', 'Documentation', 'KYC', 'Funded'];
    const nextIdx = STAGES.indexOf(currentStage) + 1;
    if (nextIdx >= STAGES.length) return;
    
    setMovingProspectId(id);
    try {
      const { data } = await api.patch(`/rm/onboarding/${id}`, { stage: STAGES[nextIdx] });
      if (data.success) {
        setProspects(prev => prev.map(p => p.id === id ? { ...p, stage: STAGES[nextIdx] } : p));
        toast.success(`Moved to ${STAGES[nextIdx]}`);
      }
    } catch (err) { toast.error("Failed to update status"); }
    finally { setMovingProspectId(null); }
  };

  const handleAddProspect = async () => {
    setIsSubmittingProspect(true);
    try {
      const { data } = await api.post('/rm/onboarding', { ...prospectForm, estimated_aum: parseFloat(prospectForm.estimated_aum) || 0 });
      if (data.success) {
        setProspects([data.data, ...prospects]);
        setIsAddProspectModalOpen(false);
        setProspectForm({ full_name: '', email: '', mobile: '', estimated_aum: '', notes: '' });
        toast.success("Prospect added to pipeline");
      }
    } catch (err) { toast.error("Failed to add prospect"); }
    finally { setIsSubmittingProspect(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    try {
      const formData = new FormData();
      formData.append('name', branding.name);
      formData.append('primary_color', branding.primary_color);
      formData.append('action_color', branding.action_color || '#f37920');
      
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('logo', fileInput.files[0]);
      }

      const { data } = await api.patch('/partner/branding', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (data.success) {
        toast.success('Branding updated successfully');
        // Update CSS variables
        document.documentElement.style.setProperty('--brand-primary', branding.primary_color);
        document.documentElement.style.setProperty('--brand-action', branding.action_color || '#f37920');
        // Refresh branding context
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update branding');
    } finally {
      setIsSavingBranding(false);
    }
  };

  if (loadingFirm && clients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
         <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#00458c]" />
            <p className="font-black text-xs uppercase tracking-widest text-slate-400">Loading Console Hub...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[var(--brand-primary,#00458c)] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
        <div className="p-6 flex flex-col gap-1 border-b border-blue-800">
          <h1 className="text-xl font-extrabold tracking-tight">WealthMax</h1>
          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Unified Console</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button 
            onClick={() => navigate('/partner/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${activeView === 'overview' ? 'bg-white/10 text-white shadow-inner' : 'text-blue-200 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="h-4 w-4" /> Firm Overview
          </button>
          
          <div className="pt-6 pb-2">
             <span className="px-4 text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">Partner Controls</span>
          </div>

          <button 
            onClick={() => navigate('/partner/advisors')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all text-blue-200 hover:text-white hover:bg-white/5"
          >
            <UserCog className="h-4 w-4" /> Team Operations Hub
          </button>
          <button 
            onClick={() => navigate('/partner/analytics')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all text-blue-200 hover:text-white hover:bg-white/5"
          >
            <BarChart3 className="h-4 w-4" /> Firm Analytics
          </button>
          <button 
            onClick={() => navigate('/partner/reassign-clients')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all text-blue-200 hover:text-white hover:bg-white/5"
          >
            <Users className="h-4 w-4" /> Client Reassignment
          </button>
          <button 
            onClick={() => navigate('/partner/settings')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all text-blue-200 hover:text-white hover:bg-white/5"
          >
            <Palette className="h-4 w-4" /> White Label Settings
          </button>
        </nav>
        
        <div className="p-4 border-t border-blue-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-300 hover:text-red-100 hover:bg-red-900/20 rounded-lg transition-all">
            <LogOut className="h-4 w-4" /> Logout from Firm
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-w-0">
        <header className="h-[72px] bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3 text-slate-500">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-bold text-slate-900 tracking-tight">Console: <span className="font-extrabold text-[var(--brand-primary,#00458c)]">{branding.name}</span></span>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-9 w-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center cursor-pointer hover:border-[var(--brand-primary,#00458c)] transition-all">
               <span className="text-xs font-bold text-[var(--brand-primary,#00458c)]">{user?.full_name?.charAt(0) || 'U'}</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-10">
          
          {/* ────── VIEW: FIRM OVERVIEW ────── */}
          {activeView === 'overview' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Firm Clients', value: metrics.activeClients, icon: Users, color: 'blue' },
                    { label: 'Firm-wide AUM', value: metrics.aumTracked, icon: IndianRupee, color: 'emerald' },
                    { label: 'Pending Approvals', value: metrics.pendingPledges, icon: HandCoins, color: 'amber' },
                    { label: 'Compliance Alerts', value: metrics.criticalAlerts, icon: ShieldAlert, color: 'red' },
                  ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all rounded-[1.5rem] bg-white">
                       <CardContent className="p-6">
                          <div className={`p-2.5 rounded-2xl w-fit mb-4 ${
                             stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                             stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                             stat.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                             <stat.icon className="h-5 w-5" />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5">{stat.label}</p>
                          <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                       </CardContent>
                    </Card>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                     <CardHeader className="bg-slate-50/50 px-8 py-5 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest text-[#00458c]">Top Portfolio Exceptions</CardTitle></CardHeader>
                     <div className="divide-y divide-slate-50">
                        {alerts.slice(0, 5).map((alert, i) => (
                          <div key={i} className="p-6 flex items-start justify-between group hover:bg-slate-50 transition-colors">
                             <div className="flex gap-4">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${alert.severity === 'Critical' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                                   <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                   <p className="text-sm font-black text-slate-800 leading-tight">{alert.clientName}</p>
                                   <p className="text-xs font-medium text-slate-500 mt-1">{alert.type} Shortfall identified.</p>
                                </div>
                             </div>
                             <Badge variant="outline" className={`text-[9px] font-black tracking-widest ${alert.severity === 'Critical' ? 'text-red-500' : 'text-orange-500'}`}>{alert.severity}</Badge>
                          </div>
                        ))}
                     </div>
                  </Card>
                  
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                     <CardHeader className="bg-slate-50/50 px-8 py-5 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest text-[#00458c]">AUM Concentration (Top Clients)</CardTitle></CardHeader>
                     <Table>
                        <TableBody>
                           {clients.slice(0, 5).map((client, i) => (
                             <TableRow key={i} className="border-slate-50">
                                <TableCell className="px-8 font-black text-slate-800 tracking-tight">{client.name}</TableCell>
                                <TableCell className="text-right px-8 font-black text-emerald-600">{formatINR(parseFloat(client.totalAssets))}</TableCell>
                             </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </Card>
               </div>
            </div>
          )}
         
          {/* ────── VIEW: ADVISORS ────── */}
          {activeView === 'advisors' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Team Roster</h2>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mt-1">Managed Advisor Entities: <span className="text-[#00458c]">{advisors.length}</span></p>
                  </div>
                  <Button onClick={() => setIsInviteModalOpen(true)} className="bg-[#00458c] hover:bg-[#00356b] text-white font-black px-10 rounded-2xl h-14 shadow-2xl shadow-blue-100 flex gap-3 text-base">
                     <Plus className="h-5 w-5" /> Expand Team
                  </Button>
               </div>
               <Card className="border-none shadow-sm rounded-[3rem] overflow-hidden bg-white">
                  <Table>
                     <TableHeader className="bg-slate-50 h-16">
                        <TableRow>
                           <TableHead className="px-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Advisor Identity</TableHead>
                           <TableHead className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total Clients</TableHead>
                           <TableHead className="text-right text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 px-10">Portfolio Value Managed</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {advisors.map(adv => (
                          <TableRow key={adv.id} className="border-slate-50 hover:bg-slate-50 transition-all">
                             <TableCell className="px-10 py-7">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-[1.25rem] bg-blue-50 text-[#00458c] flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">{adv.name.charAt(0)}</div>
                                   <div><p className="text-base font-black text-slate-800 leading-tight uppercase tracking-tight">{adv.name}</p><p className="text-[11px] font-bold text-slate-400 lowercase italic">{adv.email}</p></div>
                                </div>
                             </TableCell>
                             <TableCell className="text-center font-black text-2xl text-[#00458c] tracking-tight">{adv.assigned_clients}</TableCell>
                             <TableCell className="text-right px-10 font-black text-xl text-slate-900 tracking-tighter">₹{Number(adv.aum_managed).toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        ))}
                     </TableBody>
                  </Table>
                </Card>
             </div>
          )}

          {/* ────── VIEW: SETTINGS / WHITE LABEL ────── */}
          {activeView === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-500 border rounded-[3rem] p-12 bg-white shadow-2xl max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Identity & White-Labeling</h2>
                  <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">Global platform styling for {branding.name}.</p>
                </div>
                <Button onClick={handleSaveBranding} disabled={isSavingBranding} className="bg-[var(--brand-action,#f37920)] hover:opacity-90 text-white font-black px-12 h-14 rounded-2xl shadow-xl shadow-orange-100 text-lg disabled:opacity-50">
                  {isSavingBranding ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : null}
                  Deploy Updates
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10">
                 <div className="bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center gap-6 group hover:bg-slate-100 transition-colors">
                    {branding.logo_url ? (
                      <div className="relative group-hover:scale-110 transition-transform">
                        <img src={branding.logo_url} alt="Logo" className="h-24 w-auto object-contain" />
                        <button onClick={() => setBranding(prev => ({ ...prev, logo_url: '' }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200 group-hover:scale-110 transition-transform">
                         <ImageIcon className="h-12 w-12 text-slate-300 group-hover:text-[var(--brand-primary,#00458c)]" />
                      </div>
                    )}
                    <div className="text-center"><p className="font-black text-xl text-slate-900 leading-tight">Master Agency Logo</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">SVG, Transparent PNG (Max 5MB)</p></div>
                    <label className="mt-2 border-slate-200 font-bold h-12 rounded-xl px-8 bg-white cursor-pointer flex items-center gap-2 hover:bg-slate-50 transition-colors">
                      <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      <ImageIcon className="h-4 w-4" /> Browse Local System
                    </label>
                 </div>
                 <div className="space-y-10">
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Partner Entity Name</label>
                       <Input value={branding.name} onChange={(e) => setBranding({...branding, name: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-black text-xl pl-6 text-[var(--brand-primary,#00458c)]" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Primary Brand Accent (HEX)</label>
                       <div className="flex gap-4">
                          <Input value={branding.primary_color} onChange={(e) => setBranding({...branding, primary_color: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-mono text-xl pl-6" />
                          <div className="w-16 h-16 rounded-[1.5rem] border-4 border-white shadow-2xl shrink-0" style={{ backgroundColor: branding.primary_color }}></div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Action Button Color (HEX)</label>
                       <div className="flex gap-4">
                          <Input value={branding.action_color} onChange={(e) => setBranding({...branding, action_color: e.target.value})} className="h-16 rounded-2xl bg-slate-50 border-none font-mono text-xl pl-6" />
                          <div className="w-16 h-16 rounded-[1.5rem] border-4 border-white shadow-2xl shrink-0" style={{ backgroundColor: branding.action_color || '#f37920' }}></div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── MODALS ── */}
      
      {/* Nudge Modal */}
      <Dialog open={isNudgeModalOpen} onOpenChange={setIsNudgeModalOpen}>
         <DialogContent className="max-w-md rounded-[3rem] p-12 border-none shadow-2xl overflow-hidden bg-white">
            <DialogHeader><DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Direct Advice Nudge</DialogTitle></DialogHeader>
            <div className="py-8"><Textarea placeholder="Construct your advisory message..." className="min-h-[160px] rounded-[1.5rem] bg-slate-50 border-none p-6 font-bold text-lg text-slate-700 leading-relaxed shadow-inner" value={nudgeMessage} onChange={(e) => setNudgeMessage(e.target.value)} /></div>
            <DialogFooter className="gap-4">
               <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black text-slate-400" onClick={() => setIsNudgeModalOpen(false)}>Discard</Button>
               <Button disabled={isNudging || !nudgeMessage} className="flex-[2] bg-[#00458c] h-14 rounded-2xl font-black text-lg text-white shadow-2xl shadow-blue-100" onClick={handleSendNudge}>{isNudging ? <Loader2 className="animate-spin h-6 w-6"/> : <Send className="h-5 w-5 mr-3"/>} DEPLOY NUDGE</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Add Prospect Modal */}
      <Dialog open={isAddProspectModalOpen} onOpenChange={setIsAddProspectModalOpen}>
          <DialogContent className="max-w-md rounded-[3rem] p-12 border-none shadow-2xl bg-white">
             <DialogHeader><DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Initialize Lead</DialogTitle></DialogHeader>
             <div className="space-y-6 py-8">
                <Input placeholder="Lead Full Name" className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg shadow-inner px-6" value={prospectForm.full_name} onChange={(e) => setProspectForm({...prospectForm, full_name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                   <Input placeholder="Email ID" className="h-14 rounded-2xl bg-slate-50 border-none font-bold shadow-inner px-6" value={prospectForm.email} onChange={(e) => setProspectForm({...prospectForm, email: e.target.value})} />
                   <Input placeholder="Mobile Contact" className="h-14 rounded-2xl bg-slate-50 border-none font-bold shadow-inner px-6" value={prospectForm.mobile} onChange={(e) => setProspectForm({...prospectForm, mobile: e.target.value})} />
                </div>
                <Input type="number" placeholder="Target AUM Investment (₹)" className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg text-[#00458c] shadow-inner px-6" value={prospectForm.estimated_aum} onChange={(e) => setProspectForm({...prospectForm, estimated_aum: e.target.value})} />
                <Textarea placeholder="Diagnostic / Strategy Notes..." className="min-h-[120px] rounded-[1.5rem] bg-slate-50 border-none font-bold text-slate-600 shadow-inner p-6" value={prospectForm.notes} onChange={(e) => setProspectForm({...prospectForm, notes: e.target.value})} />
             </div>
             <DialogFooter className="gap-5">
                <Button variant="ghost" className="flex-1 h-14 font-black text-slate-400" onClick={() => setIsAddProspectModalOpen(false)}>Cancel</Button>
                <Button disabled={isSubmittingProspect || !prospectForm.full_name} onClick={handleAddProspect} className="flex-[2] bg-[#00458c] h-14 rounded-2xl font-black text-lg text-white shadow-2xl shadow-blue-100">{isSubmittingProspect ? <Loader2 className="animate-spin h-6 w-6"/> : <UserPlus className="h-5 w-5 mr-3"/>} ADD TO FUNNEL</Button>
             </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Invite Advisor Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-[3rem] p-12 border-none shadow-2xl bg-white">
           <DialogHeader><DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Expand Advisor Team</DialogTitle></DialogHeader>
           <div className="space-y-6 py-8">
              <Input placeholder="Member Full Name" className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg shadow-inner px-6" value={newAdvisor.name} onChange={(e) => setNewAdvisor({...newAdvisor, name: e.target.value})} />
              <Input placeholder="Official Invitation Email" className="h-14 rounded-2xl bg-slate-50 border-none font-bold shadow-inner px-6" value={newAdvisor.email} onChange={(e) => setNewAdvisor({...newAdvisor, email: e.target.value})} />
           </div>
           <DialogFooter><Button onClick={() => setIsInviteModalOpen(false)} className="bg-[#00458c] w-full h-15 rounded-2xl font-black text-lg shadow-xl shadow-blue-100">DEPLOY INVITE LINK</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientAnalyticsHub 
         clientId={selectedClientForAnalytics?.id || null}
         clientName={selectedClientForAnalytics?.name || ''}
         isOpen={isAnalyticsModalOpen}
         onClose={() => setIsAnalyticsModalOpen(false)}
      />
    </div>
  );
};

export default PartnerDashboard;
