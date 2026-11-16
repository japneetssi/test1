import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  IndianRupee, 
  Activity, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Settings,
  ShieldCheck,
  ChevronDown,
  Monitor,
  Database,
  Mail,
  Zap,
  Clock,
  Briefcase
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
  CardTitle 
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
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

// IIFL Theme Colors
const COLORS = {
  navy: '#00458c',
  white: '#ffffff',
  orange: '#f37920',
  lightGray: '#f8fafc',
  border: '#e2e8f0',
  textSecondary: '#64748b'
};

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('agencies');
  const [metrics, setMetrics] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Onboarding Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    tier: 'Business Pro'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/admin/dashboard");
      const result = response.data;
      if (result.success) {
        setMetrics(result.data.metrics);
        setPartners(result.data.partners);
        setSystemHealth(result.data.systemHealth);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error: any) {
      console.error("Dashboard Fetch Error", error);
      toast.error("Network error fetching dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/admin/onboard-partner", {
        name: newPartner.name,
        admin_email: newPartner.email,
        subscription_tier: newPartner.tier
      });

      const result = response.data;
      if (result.success) {
        toast.success("Partner agency onboarded successfully!");
        setIsModalOpen(false);
        setNewPartner({ name: '', email: '', tier: 'Business Pro' });
        fetchDashboardData(); // Refresh list
      } else {
        toast.error(result.message || "Failed to onboard partner");
      }
    } catch (error: any) {
      console.error("Onboarding Error", error);
      toast.error("Network error during onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-[#00458c] text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded">
             <img src="/logo.svg" alt="WealthMax" className="h-6 w-auto" onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/24?text=WM")} />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight">WealthMax</span>
            <span className="text-blue-200 font-light border-l border-blue-400 pl-3 ml-1 text-sm">System Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-blue-900/50 px-3 py-1.2 rounded-full border border-blue-400/30 text-xs">
            <Activity className="h-3 w-3 text-emerald-400 fill-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">All APIs Operational</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-blue-800 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center border border-blue-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="font-medium">Super Admin</span>
                <ChevronDown className="h-4 w-4 text-blue-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Activity className="mr-2 h-4 w-4" />
                <span>Audit Log</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        {/* Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: "TOTAL ONBOARDED ADVISORS", 
              value: metrics?.totalAdvisors || "0", 
              growth: metrics?.totalAdvisorsGrowth || "", 
              icon: Building2, 
              color: "text-blue-600" 
            },
            { 
              title: "TOTAL END-CLIENTS", 
              value: metrics?.totalClients?.toLocaleString() || "0", 
              growth: metrics?.totalClientsGrowth || "", 
              icon: Users, 
              color: "text-blue-600" 
            },
            { 
              title: "PLATFORM AUM", 
              value: formatCurrency(metrics?.platformAUM || 0), 
              growth: metrics?.platformAUMGrowth || "", 
              icon: IndianRupee, 
              color: "text-blue-600" 
            },
            { 
              title: "ACTIVE OPTION WEALTH MARGIN", 
              value: formatCurrency(metrics?.activeOptionWealthMargin || 0), 
              growth: metrics?.activeOptionWealthMarginDetails || "", 
              icon: Zap, 
              color: "text-orange-500" 
            },
          ].map((metric, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <metric.icon className="h-12 w-12" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-bold text-slate-500 tracking-wider uppercase flex justify-between items-center">
                  {metric.title}
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{metric.value}</div>
                <div className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  {metric.growth}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Control */}
        <Tabs defaultValue="agencies" onValueChange={setActiveTab} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b px-6 flex items-center justify-between bg-slate-50/50">
            <TabsList className="bg-transparent h-14 p-0">
              <TabsTrigger 
                value="agencies" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#00458c] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#00458c] rounded-none px-6 h-full font-semibold text-slate-500"
              >
                Agency Management
              </TabsTrigger>
              <TabsTrigger 
                value="risk" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#00458c] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#00458c] rounded-none px-6 h-full font-semibold text-slate-500"
              >
                Option Wealth Global Risk
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#00458c] data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#00458c] rounded-none px-6 h-full font-semibold text-slate-500"
              >
                Platform Settings & API Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="agencies" className="m-0 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search agencies..." className="pl-10 h-10 border-slate-200 bg-slate-50/50 focus:bg-white transition-all" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-semibold px-2.5 py-1">
                    {partners.length} partners
                  </Badge>
                </div>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#f37920] hover:bg-[#e66c1b] text-white font-bold h-10 px-6 gap-2 shadow-lg shadow-orange-200"
                >
                  <Plus className="h-4 w-4" /> Onboard New Partner
                </Button>
              </div>

              <div className="rounded-lg border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent border-slate-200">
                      <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider h-11">Agency Name</TableHead>
                      <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider h-11">Admin Email</TableHead>
                      <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider h-11">Active Clients</TableHead>
                      <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider h-11">Subscription Tier</TableHead>
                      <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider h-11">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => (
                      <TableRow key={partner.id} className="hover:bg-slate-50/50 transition-colors border-slate-200 group">
                        <TableCell className="font-bold text-slate-800">{partner.name}</TableCell>
                        <TableCell className="text-slate-500 font-medium">{partner.admin_email}</TableCell>
                        <TableCell className="font-bold text-slate-700">{partner.total_clients || 0}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`
                              ${partner.subscription_tier === 'Enterprise' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 
                                partner.subscription_tier === 'Business Pro' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 
                                'bg-slate-50 text-slate-600 border border-slate-200'} font-bold px-3 py-0.5
                            `}
                          >
                            {partner.subscription_tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             {partner.status === 'Active' ? (
                               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                             ) : (
                               <AlertCircle className="h-4 w-4 text-red-500" />
                             )}
                             <span className={`font-bold ${partner.status === 'Active' ? 'text-emerald-600' : 'text-red-500'}`}>
                               {partner.status}
                             </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="m-0">
               <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Shadow Ledger — Global Margin Exposure</h3>
                    <p className="text-sm text-slate-500">Real-time risk monitoring of all active Option Wealth positions.</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 h-9 border-slate-200 hover:bg-slate-50">
                    <Activity className="h-4 w-4 text-[#00458c]" /> Refresh Risk Data
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-lg border border-slate-100 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent border-slate-200">
                          <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Client Name</TableHead>
                          <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Linked Advisor</TableHead>
                          <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider text-right">Total Pledged Value</TableHead>
                          <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Utilized Margin %</TableHead>
                          <TableHead className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Margin Call Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(!partners || partners.length === 0) && activeTab === 'agencies' && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                              No partner agencies onboarded yet.
                            </TableCell>
                          </TableRow>
                        )}
                        {/* Mock Risk Data - Keep but check for data or show empty */}
                        {activeTab === 'risk' && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                              No active margin exposure detected.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
               </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0">
               <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">External Service Connections</h3>
                  <p className="text-sm text-slate-500">Real-time health status of all platform dependencies.</p>
                </div>

                <div className="space-y-3">
                  {systemHealth.map((service, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-white hover:border-slate-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full ${service.status === 'Operational' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} group-hover:scale-110 transition-transform`}>
                          {service.service.includes('Database') ? <Database className="h-5 w-5" /> : 
                           service.service.includes('Email') ? <Mail className="h-5 w-5" /> :
                           service.service.includes('PDF') ? <IndianRupee className="h-5 w-5" /> : 
                           service.service.includes('Sync') ? <Activity className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            {service.service}
                            {service.status === 'Degraded' && <Badge variant="destructive" className="text-[8px] h-4">Attention</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <Clock className="h-3 w-3" /> Last ping: {service.lastPing}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Uptime (30d)</div>
                          <div className="text-sm font-bold text-slate-700 tracking-tight">{service.uptime}</div>
                        </div>
                        <Badge variant="secondary" className={`${service.status === 'Operational' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} font-bold min-w-[100px] justify-center h-7`}>
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
               </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Onboard Partner Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-[#00458c] text-white">
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Onboard New Partner</DialogTitle>
            <DialogDescription className="text-blue-100 font-medium">
              Create a new B2B agency account and initiate the owner setup process.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOnboardPartner} className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Agency Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    required
                    placeholder="e.g. Next Curve Financials" 
                    className="pl-10 h-12 border-slate-200 focus:ring-[#00458c]"
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Owner's Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    required
                    type="email"
                    placeholder="owner@agency.com" 
                    className="pl-10 h-12 border-slate-200 focus:ring-[#00458c]"
                    value={newPartner.email}
                    onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">An invitation link will be sent to this email address.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Subscription Tier</label>
                <div className="relative flex gap-2">
                  {['Starter', 'Business Pro', 'Enterprise'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setNewPartner({...newPartner, tier})}
                      className={`flex-1 py-3 px-2 rounded-lg border text-[11px] font-bold transition-all ${
                        newPartner.tier === tier 
                        ? 'border-[#00458c] bg-blue-50 text-[#00458c]' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-3 sm:gap-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsModalOpen(false)}
                className="font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#f37920] hover:bg-[#e66c1b] text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-100 grow"
              >
                {isSubmitting ? "Processing..." : "Onboard Partner Agency"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
