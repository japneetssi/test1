import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Target, 
  Zap, 
  ShieldCheck, 
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import Portfolio from "./Portfolio";
import Goals from "./Goals";
import OptionWealth from "./OptionWealth";
import PortfolioReview from "@/components/PortfolioReview";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";

const ClientImpersonationView = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("portfolio");
  const [clientName, setClientName] = useState("Client Account");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!clientId) return;
      try {
        // We'll fetch from the RM clients list to find this specific client's name
        const { data } = await api.get("/rm/clients");
        const client = data?.data?.find((c: any) => c.id === clientId);
        if (client) {
          setClientName(client.name);
        }
      } catch (err) {
        console.error("Failed to fetch client details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [clientId]);

  if (!clientId) return <div className="p-10 text-center">Invalid Client ID</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* ── High-Impact Impersonation Banner ── */}
      <div className="bg-[#002b5c] border-b border-[#00458c] sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-100 hover:text-white hover:bg-white/10"
                onClick={() => navigate("/rm/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Roster
            </Button>
            <div className="h-6 w-px bg-blue-800" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-none mb-1">
                  Secure Viewing Mode
                </p>
                <h1 className="text-white font-bold text-sm flex items-center gap-2">
                  <User className="h-3 w-3 text-blue-400" />
                  {loading ? "Loading Client..." : clientName}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-blue-100 bg-blue-900/40 px-3 py-1.5 rounded-full border border-blue-800">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                RM Access Only
             </div>
             <Button 
                size="sm" 
                className="bg-[#f37920] hover:bg-[#e06b18] text-white font-bold text-xs"
                onClick={() => window.open(`/api/rm/generate-pdf/${clientId}`, '_blank')}
             >
                <Zap className="h-3 w-3 mr-2" />
                Quick PDF Report
             </Button>
          </div>
        </div>
      </div>

      {/* ── Client Context Sub-Header ── */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6">
             <Tabs defaultValue="portfolio" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                    <TabsTrigger 
                        value="portfolio" 
                        className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#f37920] data-[state=active]:bg-transparent data-[state=active]:text-[#00458c] font-bold text-sm px-1 transition-all"
                    >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Portfolio Analytics
                    </TabsTrigger>
                    <TabsTrigger 
                        value="goals" 
                        className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#f37920] data-[state=active]:bg-transparent data-[state=active]:text-[#00458c] font-bold text-sm px-1 transition-all"
                    >
                        <Target className="h-4 w-4 mr-2" />
                        Financial Goals
                    </TabsTrigger>
                    <TabsTrigger 
                        value="review" 
                        className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#f37920] data-[state=active]:bg-transparent data-[state=active]:text-[#00458c] font-bold text-sm px-1 transition-all"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Portfolio Review
                    </TabsTrigger>
                    <TabsTrigger 
                        value="liquidity" 
                        className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#f37920] data-[state=active]:bg-transparent data-[state=active]:text-[#00458c] font-bold text-sm px-1 transition-all"
                    >
                        <Zap className="h-4 w-4 mr-2" />
                        Option Wealth & LAS
                    </TabsTrigger>
                </TabsList>
             </Tabs>
        </div>
      </div>

      {/* ── Dynamic Content Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1440px] mx-auto py-6">
            {activeTab === "portfolio" && <Portfolio impersonatedId={clientId} />}
            {activeTab === "goals" && <Goals impersonatedId={clientId} />}
            {activeTab === "review" && <PortfolioReview clientId={clientId} />}
            {activeTab === "liquidity" && <OptionWealth impersonatedId={clientId} />}
        </div>
      </div>

      {/* ── Perspective Indicator (Footer) ── */}
      <div className="bg-white border-t py-6 text-center">
         <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
            You are viewing this account exactly as the client sees it. 
            <span className="text-[#00458c] font-bold flex items-center">
                Read-only mode active <ShieldCheck className="h-3 w-3 ml-1" />
            </span>
         </p>
      </div>
    </div>
  );
};

export default ClientImpersonationView;
