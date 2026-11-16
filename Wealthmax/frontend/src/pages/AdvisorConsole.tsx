import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  Palette, 
  CreditCard, 
  LayoutDashboard,
  Plus, 
  Search, 
  Image as ImageIcon,
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Settings,
  ShieldCheck,
  ChevronDown,
  Monitor,
  Download,
  Trash2,
  Lock,
  Mail,
  MoreVertical,
  Briefcase,
  TrendingUp,
  ShieldAlert,
  HandCoins,
  Activity,
  ArrowUpRight,
  FileText,
  Send,
  Loader2,
  Clock,
  ArrowRightCircle,
  Phone,
  Calendar,
  FileBarChart,
  Bell,
  Link,
  Copy,
  Check
} from 'lucide-react';
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
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import ClientAnalyticsHub from "@/components/ClientAnalyticsHub";
import ProposalGenerator from "@/pages/ProposalGenerator";
import RevenueProjection from "@/components/reports/RevenueProjection";

const AdvisorConsole = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'proposals', 'alerts', 'invite'
  
  // ── Search & Invite States ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // ── Metrics & Clients States ──────────────────────────────────────────
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

  // ── Modals ──────────────────────────────────────────────────────────────
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isNudging, setIsNudging] = useState(false);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedClientForAnalytics, setSelectedClientForAnalytics] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
  }, []);

  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const [metricsRes, clientsRes] = await Promise.all([
        api.get('/advisor/dashboard-metrics'),
        api.get('/advisor/clients')
      ]);
      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
      if (clientsRes.data.success) setClients(clientsRes.data.data.clients || clientsRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoadingDashboard(false); }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const { data } = await api.get('/advisor/alerts');
      if (data.success) setAlerts(data.data);
    } catch (err) { console.error(err); }
    finally { setLoadingAlerts(false); }
  };

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
      const { data } = await api.post(`/advisor/nudge/${selectedClientId}`, { message: nudgeMessage });
      if (data.success) {
        toast.success("Nudge sent to client");
        setIsNudgeModalOpen(false);
        setNudgeMessage('');
      } else {
        toast.error(data.message || "Failed to send nudge");
      }
    } catch (err) { toast.error("Communication error"); }
    finally { setIsNudging(false); }
  };

  const handleGeneratePDF = async (clientId: string, clientName: string) => {
    try {
      toast.info("Generating PDF...");
      const response = await api.post(`/advisor/generate-pdf/${clientId}`, {}, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ClientReport_${clientName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF generated successfully");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!clientName || !clientEmail) {
      toast.error("Please provide client name and email.");
      return;
    }
    try {
      setGeneratingLink(true);
      const { data } = await api.post('/advisor/generate-invite', { clientName, clientEmail });
      if (data.success) {
        toast.success("Client invited successfully via email");
        setShowInviteModal(false);
        setClientName('');
        setClientEmail('');
      }
    } catch (err) {
      toast.error("Failed to generate invite link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(c => 
      c.name?.toLowerCase().includes(query) || 
      c.email?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#00458c] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
        <div className="p-6 flex flex-col gap-1 border-b border-blue-800">
          <h1 className="text-xl font-extrabold tracking-tight">WealthMax</h1>
          <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest leading-none">Advisor Console</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${activeView === 'dashboard' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:text-white hover:bg-blue-800/50'}`}
          >
            <LayoutDashboard className="h-4 w-4" /> My Dashboard
          </button>
          <button 
            onClick={() => setActiveView('proposals')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${activeView === 'proposals' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:text-white hover:bg-blue-800/50'}`}
          >
            <FileBarChart className="h-4 w-4" /> EMI & Lumpsum Planning
          </button>
          <button 
            onClick={() => setActiveView('alerts')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${activeView === 'alerts' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:text-white hover:bg-blue-800/50'}`}
          >
            <Bell className="h-4 w-4" /> Smart Alert Feed
          </button>
          <button 
            onClick={() => setActiveView('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${activeView === 'reports' ? 'bg-blue-800 text-white' : 'text-blue-200 hover:text-white hover:bg-blue-800/50'}`}
          >
            <FileText className="h-4 w-4" /> Reports
          </button>
          <button 
            onClick={() => { setClientName(''); setClientEmail(''); setShowInviteModal(true); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all text-blue-200 hover:text-white hover:bg-blue-800/50`}
          >
            <Link className="h-4 w-4" /> Invite Clients
          </button>
        </nav>
        
        <div className="p-4 border-t border-blue-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-300 hover:text-red-100 hover:bg-red-900/20 rounded-lg transition-all">
            <LogOut className="h-4 w-4" /> Logout Workspace
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3 text-slate-500">
            <h1 className="text-sm font-bold text-slate-800 tracking-tight">Advisor: <span className="font-extrabold text-[#00458c] tracking-normal uppercase">{user?.full_name}</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-9 w-9 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-bold text-[#00458c]">
               {user?.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-10">
          
          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'My Active Clients', value: metrics.activeClients, icon: Users, color: 'blue' },
                    { label: 'My Managed AUM', value: metrics.aumTracked, icon: TrendingUp, color: 'emerald' },
                    { label: 'Pending Approvals', value: metrics.pendingPledges, icon: HandCoins, color: 'orange' },
                    { label: 'Personal Alerts', value: metrics.criticalAlerts, icon: ShieldAlert, color: 'red' },
                  ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem]">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : stat.color === 'orange' ? 'bg-orange-50 text-orange-600' : stat.color === 'red' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#00458c]'}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <Activity className="h-4 w-4 text-slate-200" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{stat.value}</p>
                        </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                    <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-[#00458c]">My Client Roster</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Search clients..." 
                                    className="pl-10 w-64 h-9 rounded-xl border-slate-200 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-slate-200 font-bold">
                                <Download className="h-3.5 w-3.5 mr-2" /> Export
                            </Button>
                        </div>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow>
                                <TableHead className="px-8 h-12 text-[10px] font-black uppercase tracking-widest">Client Name</TableHead>
                                <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Persona</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Wealth Health</TableHead>
                                <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest">Assets</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map(client => (
                                <TableRow key={client.id} className="hover:bg-slate-50 transition-colors border-slate-50 group">
                                    <TableCell className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00458c] flex items-center justify-center font-black text-xs">{client.name.charAt(0)}</div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-tight uppercase">{client.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400">Synced {getRelativeTime(client.lastSynced)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest border-none ${client.persona === 'A' ? 'text-emerald-600 bg-emerald-50' : 'text-orange-600 bg-orange-50'}`}>Persona {client.persona?.[0] || 'B'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 w-24">
                                            <div className="flex justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                                                <span>{client.healthScore}%</span>
                                                <span>HSC</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full bg-[#00458c]`} style={{ width: `${client.healthScore}%` }} />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-8 font-black text-slate-900">{formatINR(parseFloat(client.totalAssets))}</TableCell>
                                    <TableCell className="px-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border">
                                                <DropdownMenuItem onClick={() => navigate(`/advisor/client/${client.id}`)} className="rounded-lg px-3 py-2 cursor-pointer">
                                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                                    <span className="font-medium">View Client Profile</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleGeneratePDF(client.id, client.name)} className="rounded-lg px-3 py-2 cursor-pointer">
                                                    <FileBarChart className="h-4 w-4 mr-2" />
                                                    <span className="font-medium">Generate PDF Report</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => { setSelectedClientId(client.id); setNudgeMessage(''); setIsNudgeModalOpen(true); }} className="rounded-lg px-3 py-2 cursor-pointer">
                                                    <Send className="h-4 w-4 mr-2" />
                                                    <span className="font-medium">Send Alert Nudge</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
          )}

          {/* Proposal Generator View */}
          {activeView === 'proposals' && (
            <ProposalGenerator />
          )}

          {/* Smart Alert Feed View */}
          {activeView === 'alerts' && (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.length === 0 ? (
                        <Card className="col-span-full border-dashed border-2 border-slate-200">
                            <CardContent className="py-12 flex flex-col items-center">
                                <Bell className="h-12 w-12 text-slate-300 mb-4" />
                                <p className="text-slate-500 font-medium">No active alerts</p>
                                <p className="text-sm text-slate-400">All clients are in good standing</p>
                            </CardContent>
                        </Card>
                    ) : (
                        alerts.map((alert, idx) => (
                            <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                            alert.severity === 'Critical' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'
                                        }`}>
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <Badge variant="outline" className={`text-[9px] font-black uppercase mb-1 ${
                                                alert.severity === 'Critical' ? 'text-red-500 border-red-200' : 'text-orange-500 border-orange-200'
                                            }`}>
                                                {alert.severity}
                                            </Badge>
                                            <p className="text-sm font-bold text-slate-800 mt-1">{alert.type}</p>
                                            <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
          )}

          {/* Reports View */}
          {activeView === 'reports' && (
            <div className="animate-in fade-in duration-500">
               <RevenueProjection />
            </div>
          )}

        </div>
      </main>

      {/* Invite Client Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
         <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">Invite New Clients</DialogTitle>
                <DialogDescription className="text-slate-500">
                    Share this link with clients to onboard them. They'll be automatically associated with you.
                </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Client Name</label>
                    <Input 
                        placeholder="John Doe" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="rounded-xl border-slate-200"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Client Email</label>
                    <Input 
                        type="email"
                        placeholder="john@example.com" 
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="rounded-xl border-slate-200"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button 
                    onClick={handleGenerateInviteLink} 
                    disabled={generatingLink || !clientName || !clientEmail}
                    className="w-full bg-[#00458c] h-12 rounded-xl font-bold"
                >
                    {generatingLink ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Send Invite Email
                </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Nudge Modal */}
      <Dialog open={isNudgeModalOpen} onOpenChange={setIsNudgeModalOpen}>
         <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <DialogHeader><DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Send Client Nudge</DialogTitle></DialogHeader>
            <div className="py-8"><Textarea placeholder="Type advisory message..." className="min-h-[160px] rounded-2xl bg-slate-50 border-none p-5 font-bold tracking-tight leading-relaxed" value={nudgeMessage} onChange={(e) => setNudgeMessage(e.target.value)} /></div>
            <DialogFooter className="gap-4">
               <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-slate-500" onClick={() => setIsNudgeModalOpen(false)}>Discard</Button>
               <Button disabled={isNudging || !nudgeMessage} className="flex-[1.5] bg-[#00458c] h-14 rounded-2xl font-black text-lg" onClick={handleSendNudge}>{isNudging ? <Loader2 className="animate-spin h-5 w-5"/> : <Send className="h-5 w-5"/>} Deploy</Button>
            </DialogFooter>
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

export default AdvisorConsole;
