import { useState, useEffect, useMemo } from "react";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Lock, MoreVertical, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHoldings, getAnalyticsSnapshot } from "@/services/portfolio";
import type { Holding, PortfolioSummary, AnalyticsSnapshot } from "@/services/portfolio";
import { getFamilyHoldings, getConsolidatedAnalytics, getFamilyDetails, Family } from "@/services/family";
import { useToast } from "@/hooks/use-toast";
import PortfolioImport from "@/components/PortfolioImport";
import { Users, User } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const fmtCompact = (n: number) => {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  return n.toLocaleString("en-IN");
};

// Default colour palette for asset allocation
const ALLOC_COLORS = [
  "hsl(211, 100%, 27%)",
  "hsl(215, 14%, 46%)",
  "hsl(27, 90%, 54%)",
  "hsl(211, 80%, 45%)",
  "hsl(142, 71%, 35%)",
];

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({
  label, value, sub, positive, highlight,
}: {
  label: string; value: string; sub?: string; positive?: boolean; highlight?: boolean;
}) => (
  <Card className={`border-border ${highlight ? "ring-1 ring-primary/20" : ""}`}>
    <CardContent className="p-3">
      <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${positive !== undefined ? (positive ? "text-gain" : "text-loss") : "text-foreground"
        }`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs tabular-nums mt-0.5 ${positive ? "text-gain" : "text-loss"}`}>{sub}</p>
      )}
    </CardContent>
  </Card>
);

// ── Skeleton Row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-border">
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i} className="py-3 px-3">
        <div className="h-3 bg-muted rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Main Component ────────────────────────────────────────────────────────────
const Portfolio = ({ impersonatedId }: { impersonatedId?: string }) => {
  const { toast } = useToast();
  const [holdingTab, setHoldingTab] = useState("all");
  const [growthPeriod, setGrowthPeriod] = useState<"1M" | "6M" | "1Y" | "All">("1Y");

  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [viewMode, setViewMode] = useState<"solo" | "family">("solo");
  const [familyInfo, setFamilyInfo] = useState<Family | null>(null);

  const fetchHoldings = async () => {
    setLoadingHoldings(true);
    try {
      if (viewMode === "family") {
        const result = await getFamilyHoldings();
        // Map family holdings to component format
        const mappedHoldings = result.map(h => ({
          ...h,
          scrip_name: h.name || h.isin,
          current_value: h.last_valuation,
          pnl: h.last_valuation - (h.quantity * (h.avg_price || 0)), // estimate if missing
          pnl_pct: h.avg_price ? ((h.current_nav - h.avg_price) / h.avg_price) * 100 : 0,
        }));
        setHoldings(mappedHoldings);

        const totalInvested = mappedHoldings.reduce((s, h) => s + ((h.avg_price || 0) * h.quantity), 0);
        const totalCurrentValue = mappedHoldings.reduce((s, h) => s + (h.current_value || 0), 0);

        setSummary({
          totalInvested,
          totalCurrentValue,
          totalPnL: totalCurrentValue - totalInvested,
          pnlPercent: totalInvested ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0,
          oneDayPnL: 0, // Placeholder
        } as any);
      } else {
        const result = await getHoldings();
        setHoldings(result.holdings);
        setSummary(result.summary);
      }
      const result = await getHoldings(impersonatedId);
      setHoldings(result.holdings);
      setSummary(result.summary);
    } catch (err: any) {
      toast({ title: "Portfolio", description: err.message, variant: "destructive" });
    } finally {
      setLoadingHoldings(false);
    }
  };

  const fetchSnapshot = async () => {
    setLoadingSnapshot(true);
    try {
      if (viewMode === "family") {
        const result = await getConsolidatedAnalytics();
        // Map consolidated analytics to Snapshot format
        setSnapshot({
          totalValue: result.totalValue,
          unrealizedPnL: result.unrealizedPnL,
          unrealizedPnLPct: result.unrealizedPnLPct,
          realizedPnL: 0,
          dayPnL: 0,
          dayPnLPct: 0,
          charts: {
            assetAllocation: result.assetAllocation,
            performance: [], // Consolidated history not yet supported
          }
        } as any);
      } else {
        const result = await getAnalyticsSnapshot();
        setSnapshot(result);
      }
      const result = await getAnalyticsSnapshot(impersonatedId);
      setSnapshot(result);
    } catch {
      setSnapshot(null);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  const fetchFamilyInfo = async () => {
    try {
      const info = await getFamilyDetails();
      setFamilyInfo(info);
    } catch { }
  };

  useEffect(() => {
    fetchFamilyInfo();
  }, []);

  useEffect(() => {
    fetchHoldings();
    fetchSnapshot();
  }, [viewMode]);

  // ── Totals from summary (backend) ─────────────────────────────────────────
  const totals = useMemo(() => {
    if (summary && summary.totalInvested > 0) {
      return {
        invested: summary.totalInvested ?? 0,
        current: summary.totalCurrentValue ?? 0,
        pl: summary.totalPnL ?? 0,
        plPct: summary.pnlPercent ?? 0,
        dayPl: summary.oneDayPnL ?? 0,
      };
    }
    // Fallback — compute from holdings array
    const invested = holdings.reduce((s, h) => s + (h.invested ?? 0), 0);
    const current = holdings.reduce((s, h) => s + (h.current_value ?? 0), 0);
    const dayPl = holdings.reduce((s, h) => s + (h.one_day_pnl ?? 0), 0);
    const pl = current - invested;
    return { invested, current, pl, plPct: invested ? (pl / invested) * 100 : 0, dayPl };
  }, [summary, holdings]);

  // ── Asset allocation from snapshot ────────────────────────────────────────
  const allocationData = useMemo(() => {
    const raw = snapshot?.charts?.assetAllocation;
    if (raw?.length) return raw;
    // Derive from holdings if snapshot missing
    const byType: Record<string, number> = {};
    holdings.forEach((h) => {
      const t = h.asset_type ?? "Other";
      const val = h.current_value ?? h.current_nav * h.quantity;
      byType[t] = (byType[t] ?? 0) + val;
    });
    const total = Object.values(byType).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(byType).map(([name, value], i) => ({
      name,
      value: parseFloat(((value / total) * 100).toFixed(1)),
      fill: ALLOC_COLORS[i % ALLOC_COLORS.length],
    }));
  }, [snapshot, holdings]);

  // ── Growth / performance chart data ───────────────────────────────────────
  const growthData = useMemo((): Record<string, { date: string; value: number }[]> => {
    const perf = snapshot?.charts?.performance;
    if (!perf?.length) {
      return { "1M": [], "6M": [], "1Y": [], "All": [] };
    }
    // Slice from the performance array for each period
    const slice = (n: number) => perf.slice(-n);
    return {
      "1M": slice(4),
      "6M": slice(6),
      "1Y": slice(12),
      "All": perf,
    };
  }, [snapshot]);

  // ── Holdings filter ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (holdingTab === "all") return holdings;
    if (holdingTab === "equity") return holdings.filter((h) => h.asset_type === "EQUITY");
    if (holdingTab === "mf") return holdings.filter((h) => h.asset_type === "MUTUAL_FUND");
    if (holdingTab === "pledged") return holdings.filter((h) => h.status === "pledged");
    return holdings;
  }, [holdingTab, holdings]);

  const loading = loadingHoldings;

  return (
    <div className="min-h-screen bg-background">
      {!impersonatedId && (
        <>
          <TopNav />
          <SubNav />
        </>
      )}

      <main className={`px-4 py-3 max-w-[1440px] mx-auto space-y-3 ${impersonatedId ? 'pt-0' : ''}`}>

        {/* ── 0. View Switcher ─────────────────────────── */}
        {familyInfo && (
          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg w-fit border border-border/50 shadow-sm">
            <Button
              variant={viewMode === "solo" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-2 px-4"
              onClick={() => setViewMode("solo")}
            >
              <User className="h-4 w-4" /> Individual
            </Button>
            <Button
              variant={viewMode === "family" ? "default" : "ghost"}
              size="sm"
              className="h-8 gap-2 px-4 transition-all"
              onClick={() => setViewMode("family")}
            >
              <Users className="h-4 w-4" /> Family ({familyInfo.name})
            </Button>
          </div>
        )}

        {/* ── 1. Summary Strip ──────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-20" />
                  <div className="h-5 bg-muted rounded animate-pulse w-28" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <SummaryCard label="Invested Amount" value={fmt(totals.invested)} />
              <SummaryCard label="Current Value" value={fmt(totals.current)} highlight />
              <SummaryCard
                label="Overall P&L"
                value={`${totals.pl >= 0 ? "+" : ""}${fmt(totals.pl)}`}
                sub={`${totals.plPct >= 0 ? "+" : ""}${totals.plPct.toFixed(2)}%`}
                positive={totals.pl >= 0}
              />
              <SummaryCard
                label="Today's P&L"
                value={`${totals.dayPl >= 0 ? "+" : ""}${fmt(totals.dayPl)}`}
                positive={totals.dayPl >= 0}
              />
            </>
          )}
        </div>

        {/* ── 2. Visual Analytics ───────────────────────── */}
        <div className="grid grid-cols-5 gap-3">
          {/* Donut */}
          <Card className="col-span-2 border-border">
            <div className="px-4 pt-3 pb-1">
              <h3 className="text-sm font-semibold text-foreground">Asset Allocation</h3>
            </div>
            <CardContent className="p-4 pt-0">
              {loadingSnapshot ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={85}
                          paddingAngle={2} dataKey="value" stroke="none"
                        >
                          {allocationData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value}%`, ""]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "6px", fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {allocationData.map((a) => (
                      <div key={a.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: a.fill }} />
                        {a.name} <span className="font-medium text-foreground">{a.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Growth Trend */}
          <Card className="col-span-3 border-border">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Growth Trend</h3>
              <div className="flex gap-1">
                {(["1M", "6M", "1Y", "All"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setGrowthPeriod(p)}
                    className={`px-2.5 py-0.5 text-xs rounded font-medium transition-colors ${growthPeriod === p
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <CardContent className="p-4 pt-0">
              {loadingSnapshot ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData[growthPeriod]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtCompact(v)} />
                      <Tooltip
                        formatter={(value: number) => [fmt(value), "Portfolio"]}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px", fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone" dataKey="value"
                        stroke="hsl(var(--primary))" strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 3. Holdings Table ─────────────────────────── */}
        <Card className="border-border">
          <Tabs value={holdingTab} onValueChange={setHoldingTab}>
            <div className="px-4 pt-3 flex items-center justify-between border-b border-border">
              <TabsList className="bg-transparent h-auto p-0 gap-0">
                {[
                  { val: "all", label: "All" },
                  { val: "equity", label: "Equity" },
                  { val: "mf", label: "Mutual Funds" },
                  { val: "pledged", label: "Pledged" },
                ].map((t) => (
                  <TabsTrigger
                    key={t.val} value={t.val}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary px-4 pb-2 text-sm font-medium"
                  >
                    {t.label}
                    {t.val === "pledged" && <Lock className="ml-1 h-3 w-3" />}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2 pb-2">
                <span className="text-xs text-muted-foreground mr-2">{filtered.length} holdings</span>
                {!impersonatedId && <PortfolioImport onSuccess={fetchHoldings} />}
                <Button variant="ghost" size="icon" className="h-[34px] w-[34px] bg-muted/50 hover:bg-muted" onClick={fetchHoldings}>
                  <RefreshCw className={`h-4 w-4 text-[#00458c] ${loadingHoldings ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            <TabsContent value={holdingTab} className="m-0">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left   py-2 px-3 font-medium text-muted-foreground text-xs">Scrip / Scheme</th>
                      {viewMode === "family" && (
                        <th className="text-left   py-2 px-3 font-medium text-muted-foreground text-xs">Owner</th>
                      )}
                      <th className="text-right  py-2 px-3 font-medium text-muted-foreground text-xs">Qty / Units</th>
                      <th className="text-right  py-2 px-3 font-medium text-muted-foreground text-xs">Avg Price</th>
                      <th className="text-right  py-2 px-3 font-medium text-muted-foreground text-xs">LTP / NAV</th>
                      <th className="text-right  py-2 px-3 font-medium text-muted-foreground text-xs">Invested</th>
                      <th className="text-right  py-2 px-3 font-medium text-muted-foreground text-xs">Current Value</th>
                      <th className="text-right  py-2 px-3 font-medium text-muted-foreground text-xs">Overall P&L</th>
                      <th className="text-right  py-2 px-3 font-medium text-muted-foreground text-xs">1D P&L</th>
                      <th className="py-2 px-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                          No holdings found. Add holdings via CSV or manually.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((h) => {
                        const invested = h.invested;
                        const current = h.current_value;
                        const pl = h.pnl;
                        const plPct = h.pnl_pct;
                        const dayPl = h.one_day_pnl ?? 0;
                        const isMF = h.asset_type === "MUTUAL_FUND";
                        const pledged = h.status === "pledged";
                        return (
                          <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground text-xs leading-tight">{h.scrip_name}</span>
                                {pledged && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-accent text-accent gap-0.5 shrink-0">
                                    <Lock className="h-2.5 w-2.5" />Pledged
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground uppercase">{isMF ? "MF" : "NSE"}</span>
                            </td>
                            {viewMode === "family" && (
                              <td className="py-2.5 px-3">
                                <Badge variant="secondary" className="text-[10px] h-4 font-normal">
                                  {h.owner_name}
                                </Badge>
                              </td>
                            )}
                            <td className="text-right py-2.5 px-3 text-xs tabular-nums">{isMF ? h.quantity.toFixed(3) : h.quantity}</td>
                            <td className="text-right py-2.5 px-3 text-xs tabular-nums">₹{(h.avg_price ?? 0).toLocaleString("en-IN")}</td>
                            <td className="text-right py-2.5 px-3 text-xs tabular-nums font-medium">₹{(h.current_nav ?? 0).toLocaleString("en-IN")}</td>
                            <td className="text-right py-2.5 px-3 text-xs tabular-nums">₹{invested.toLocaleString("en-IN")}</td>
                            <td className="text-right py-2.5 px-3 text-xs tabular-nums font-medium">₹{current.toLocaleString("en-IN")}</td>
                            <td className="text-right py-2.5 px-3">
                              <div className={`flex items-center justify-end gap-1 text-xs font-medium ${pl >= 0 ? "text-gain" : "text-loss"}`}>
                                {pl >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                <span className="tabular-nums">{pl >= 0 ? "+" : ""}{fmt(pl)}</span>
                              </div>
                              <span className={`text-[10px] tabular-nums ${pl >= 0 ? "text-gain" : "text-loss"}`}>
                                {plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%
                              </span>
                            </td>
                            <td className="text-right py-2.5 px-3">
                              <span className={`text-xs font-medium tabular-nums ${dayPl >= 0 ? "text-gain" : "text-loss"}`}>
                                {dayPl >= 0 ? "+" : ""}₹{Math.abs(dayPl).toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="py-2.5 px-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-32">
                                  <DropdownMenuItem className="text-xs">
                                    <TrendingUp className="h-3 w-3 mr-2" /> Buy
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-xs" disabled={pledged}>
                                    <TrendingDown className="h-3 w-3 mr-2" /> Sell
                                    {pledged && <Lock className="h-2.5 w-2.5 ml-auto text-muted-foreground" />}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

      </main>
    </div>
  );
};

export default Portfolio;