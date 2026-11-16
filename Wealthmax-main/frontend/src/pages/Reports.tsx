import { useState, useEffect, Suspense, lazy } from "react";
import { ComponentLoadingFallback } from "@/components/LoadingSpinner";
import { generateAdvisoryReport, printReportAsPDF } from "@/services/advisoryReport";
import { useToast } from "@/hooks/use-toast";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import api from '@/lib/api';
import { Download, Loader2, Landmark, AlertTriangle, TrendingUp, Shield, HeartPulse, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RevenueProjection from "@/components/reports/RevenueProjection";
// Lazy load the heavy report component
const A4ReportView = lazy(() => import("@/components/reports/A4ReportView"));

const statusStyles: Record<string, string> = {
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
  High: "bg-accent/10 text-accent border-accent/20",
  Medium: "bg-primary/10 text-primary border-primary/20",
  Low: "bg-muted text-muted-foreground border-border",
};

const getDynamicColor = (id: string, actual: number, ideal: number) => {
  if (id === 'expenses' || id === 'liabilities') {
    if (actual <= ideal + 5) return "hsl(var(--gain))";
    if (actual <= ideal + 15) return "hsl(var(--accent))";
    return "hsl(var(--loss))";
  } else {
    if (actual >= ideal) return "hsl(var(--gain))";
    if (actual >= ideal * 0.5) return "hsl(var(--accent))";
    return "hsl(var(--loss))";
  }
};

// ── Component ─────────────────────────────────────────────────────────────────
const Reports = () => {
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<{ idealRule: any[], actions: any[], personaName: string } | null>(null);
  const [comprehensiveData, setComprehensiveData] = useState<any>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [projectedHealthScore, setProjectedHealthScore] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("projection");
  const [simulatedScoreGain, setSimulatedScoreGain] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const { data } = await api.get('/profile');
        if (data?.data) {
          const pData = data.data.persona_data;
          const aData = data.data.action_items;

          // Map actual ratios
          const idealRuleMap = [
            { id: 'expenses', label: "Expenses", actual: Math.round(pData?.metrics?.ratios?.expenses || 0), ideal: pData?.deviations?.expenses?.ideal || 30, icon: Landmark },
            { id: 'liabilities', label: "Liabilities", actual: Math.round(pData?.metrics?.ratios?.liabilities || 0), ideal: pData?.deviations?.liabilities?.ideal || 30, icon: AlertTriangle },
            { id: 'investments', label: "Investment", actual: Math.round(pData?.metrics?.ratios?.investments || 0), ideal: pData?.deviations?.investments?.ideal || 30, icon: TrendingUp },
            { id: 'emergency_fund', label: "Emergency", actual: Math.round(pData?.metrics?.ratios?.emergency_fund || 0), ideal: pData?.deviations?.emergency_fund?.ideal || 10, icon: Shield },
          ];

          // Map actions
          const priorityOrder: Record<string, number> = { "Critical": 1, "High": 2, "Medium": 3, "Low": 4 };
          const actionsMap = (aData || []).map((a: any) => ({
            priority: priorityOrder[a.priority] || 4,
            title: a.title,
            desc: a.description,
            status: a.priority
          })).sort((a: any, b: any) => a.priority - b.priority);

          setReportData({
            idealRule: idealRuleMap,
            actions: actionsMap,
            personaName: pData?.persona?.name || "The Balanced Builder"
          });

          if (data.data.comprehensiveData) {
            setComprehensiveData(data.data.comprehensiveData);
          }

          // Financial Health Scores
          const currentScore = data.data.health_score ?? 0;
          const possibleGain = (aData || []).reduce((sum: number, item: any) => sum + (item.estimated_score_impact || 0), 0);
          setHealthScore(currentScore);
          setProjectedHealthScore(data.data.projected_score ?? Math.min(100, currentScore + possibleGain));
        }
      } catch (err) {
        console.error("Failed to fetch report summary", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      // generateAdvisoryReport now calls GET /api/v1/portfolio/report/pdf
      // and returns a blob URL — printReportAsPDF opens it in a new tab
      const result = await generateAdvisoryReport({
        userName: "", clientId: "", healthScore: 0, grade: "", riskClass: "", persona: "",
        gapAnalysis: [], actionItems: [], scoreBreakdown: { savings: 0, debt: 0, liquidity: 0, diversification: 0, insurance: 0, goalProgress: 0 },
      });
      printReportAsPDF(result.html);
      toast({ title: "Report Generated", description: "Your advisory report is ready." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const displayProjectedScore = activeTab === "projection" 
    ? Math.min(100, (healthScore ?? 0) + simulatedScoreGain)
    : projectedHealthScore;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <SubNav />

      <main className="flex-1 p-4 max-w-7xl w-full mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab header row with scores on the right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="advisory">Financial Advisory Report</TabsTrigger>
              <TabsTrigger value="projection">Financial Health Score Projections</TabsTrigger>
            </TabsList>

            {/* Financial Health Score Badges */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Current Score */}
              <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3.5 py-2 shadow-sm">
                <div className="p-1.5 rounded-lg bg-emerald-50">
                  <HeartPulse className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Health Score</span>
                  <span className="text-base font-black text-emerald-700 tabular-nums">
                    {healthScore !== null ? healthScore : <span className="text-slate-400">—</span>}<span className="text-xs font-semibold text-slate-400">/100</span>
                  </span>
                </div>
              </div>

              {/* Projected Score */}
              <div className="flex items-center gap-2 bg-white border border-violet-200 rounded-xl px-3.5 py-2 shadow-sm">
                <div className="p-1.5 rounded-lg bg-violet-50">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Projected Score</span>
                  <span className="text-base font-black text-violet-700 tabular-nums">
                    {displayProjectedScore !== null ? displayProjectedScore : <span className="text-slate-400">—</span>}<span className="text-xs font-semibold text-slate-400">/100</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <TabsContent value="advisory">
            <div className="max-w-[1000px] mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Financial Advisory Report</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Powered by WealthMax Analytics Engine
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center p-20">
                  <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                </div>
              ) : !comprehensiveData ? (
                <div className="flex justify-center p-20 text-muted-foreground">
                  No report data available. Complete your profile survey first.
                </div>
              ) : (
                <Suspense fallback={<ComponentLoadingFallback />}>
                  <A4ReportView
                    data={comprehensiveData}
                    onDownload={handleDownloadPDF}
                    generating={generating}
                  />
                </Suspense>
              )}
            </div>
          </TabsContent>

          <TabsContent value="projection">
            <RevenueProjection onScoreChange={setSimulatedScoreGain} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Reports;
