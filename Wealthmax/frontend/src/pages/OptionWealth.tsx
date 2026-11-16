import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Info, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { useAuth } from "@/contexts/AuthContext";
import { getOptionWealthAnalysis, OptionWealthResponse } from "@/services/optionWealth";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const formatCurrency = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "₹0.00";
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(2)}K`;
  return `₹${val.toFixed(2)}`;
};

// ── Component ─────────────────────────────────────────────────────────────────
const OptionWealth = ({ impersonatedId }: { impersonatedId?: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<OptionWealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Use impersonatedId if provided (RM view), otherwise use the logged-in user's ID
      const targetUserId = impersonatedId || user.id;
      const result = await getOptionWealthAnalysis(targetUserId);
      setData(result);
    } catch (err: any) {
      toast({ title: "Failed to load option wealth analytics", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, impersonatedId]);

  // Donut Chart Data
  const chartData = data ? [
    { name: "Unlockable Margin Limit", value: data.las_margin.total_eligible_margin, color: "#f37920" }, // Orange
    { name: "Locked Portfolio Value", value: data.total_portfolio_value - data.las_margin.total_eligible_margin, color: "#e2e8f0" } // Gray
  ] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!impersonatedId && (
        <>
          <TopNav />
          <SubNav />
        </>
      )}

      <main className={`flex-1 p-4 max-w-[1200px] w-full mx-auto space-y-6 ${impersonatedId ? 'pt-0' : ''}`}>

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            {!impersonatedId && (
              <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-[#00458c] transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-[#00458c]">Option Wealth & Liquidity Analytics</h1>
            <button onClick={fetchAnalytics} className="ml-auto text-muted-foreground hover:text-[#00458c] transition-colors">
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground ml-8">Discover hidden value in existing portfolio without selling assets.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
             <RefreshCw className="h-8 w-8 animate-spin text-[#f37920]" />
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-muted-foreground">No data available for this portfolio.</div>
        ) : (
          <>
            {/* Section 1: The Liquidity Unlocker */}
            <section>
              <h2 className="text-lg font-bold text-[#00458c] mb-4 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-[#f37920]" />
                The Liquidity Unlocker (Loan Against Securities)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border rounded-xl shadow-sm p-6">
                {/* Left: Donut Chart */}
                <div className="flex flex-col items-center justify-center relative">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Utilization</span>
                    <span className="text-2xl font-bold text-[#00458c]">
                      {data.las_margin.margin_utilization_rate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mt-2 text-xs font-medium text-gray-600">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f37920]"></div> Unlockable Margin</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#e2e8f0]"></div> Locked Value</div>
                  </div>
                </div>

                {/* Right: Data Card & CTA */}
                <div className="flex flex-col justify-center space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Current Portfolio</p>
                      <p className="text-2xl font-extrabold text-[#00458c]">{formatCurrency(data.total_portfolio_value)}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                      <p className="text-xs text-orange-700 uppercase tracking-wider font-semibold mb-1">Eligible Margin</p>
                      <p className="text-2xl font-extrabold text-[#f37920]">{formatCurrency(data.las_margin.total_eligible_margin)}</p>
                    </div>
                  </div>

                  {!impersonatedId && (
                    <div className="bg-[#00458c] text-white rounded-xl p-5 shadow-inner">
                        <h3 className="font-bold text-lg mb-2">Need Liquidity?</h3>
                        <p className="text-sm text-blue-100 mb-4 leading-relaxed">
                            Do not sell your compounding assets. Consult your advisor to activate a Loan Against Securities based on your eligible margin.
                        </p>
                        <button className="bg-[#f37920] hover:bg-[#e06b18] text-white font-semibold py-2 px-5 rounded-md transition-colors text-sm w-max shadow-sm">
                            Request LAS Activation
                        </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Yield Enhancement Opportunities */}
            <section>
              <h2 className="text-lg font-bold text-[#00458c] mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#f37920]" />
                Idle Asset Monetization (Covered Call Strategy)
              </h2>

              <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-5 py-4 border-b flex items-center gap-3">
                  <Info className="h-4 w-4 text-[#00458c]" />
                  <p className="text-sm text-gray-700">
                    Holdings exceeding ₹5,00,000 are eligible for Covered Call strategies. Generate estimated <strong>1.5% premium yield per month</strong> on these stocks.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white border-b">
                      <tr>
                        <th className="px-5 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wider">Holding Name</th>
                        <th className="px-5 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wider text-right">Holding Value</th>
                        <th className="px-5 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wider text-right">Est. Monthly Premium Yield</th>
                        <th className="px-5 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wider text-center">Strategy Type</th>
                        {!impersonatedId && <th className="px-5 py-3 font-semibold text-gray-600 uppercase text-xs tracking-wider text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.yield_enhancement.yield_opportunities.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                            No eligible single-stock holdings &gt; ₹5L found in this portfolio.
                          </td>
                        </tr>
                      ) : (
                        data.yield_enhancement.yield_opportunities.map((opp, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 font-medium text-[#00458c]">{opp.stock_name}</td>
                            <td className="px-5 py-4 text-right font-mono font-medium">{formatCurrency(opp.holding_value)}</td>
                            <td className="px-5 py-4 text-right font-mono font-bold text-[#28a745]">
                              {formatCurrency(opp.estimated_monthly_premium)}/mo
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                Covered Call
                              </span>
                            </td>
                            {!impersonatedId && (
                                <td className="px-5 py-4 text-center">
                                    <button className="border border-[#f37920] text-[#f37920] hover:bg-[#f37920] hover:text-white font-medium py-1.5 px-4 rounded transition-colors text-xs whitespace-nowrap">
                                        Discuss Strategy
                                    </button>
                                </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default OptionWealth;
