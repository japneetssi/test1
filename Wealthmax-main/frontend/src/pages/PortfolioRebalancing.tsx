import { useState, useEffect } from "react";
import { 
  BarChart3, 
  ArrowRightLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Wallet,
  PieChart as PieChartIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getRebalancingAnalysis, RebalancingResult } from "@/services/rebalancing";

const formatCurrency = (val: number) => {
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
};

interface PortfolioRebalancingProps {
  clientId?: string;
}

const PortfolioRebalancing: React.FC<PortfolioRebalancingProps> = ({ clientId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RebalancingResult | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const result = await getRebalancingAnalysis(clientId);
      setData(result);
    } catch (err: any) {
      toast({
        title: "Failed to load analysis",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [clientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNav />
        <SubNav />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-2" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!data) return null;

  const chartData = [
    { name: 'Equity', Current: data.currentAllocation.equity, Target: data.targetAllocation.equity },
    { name: 'Debt', Current: data.currentAllocation.debt, Target: data.targetAllocation.debt },
    { name: 'Cash', Current: data.currentAllocation.cash, Target: data.targetAllocation.cash },
  ];

  const pieData = [
    { name: 'Equity', value: data.currentAllocation.equity, color: '#3b82f6' },
    { name: 'Debt', value: data.currentAllocation.debt, color: '#f59e0b' },
    { name: 'Cash', value: data.currentAllocation.cash, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <SubNav />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Portfolio Rebalancing
            </h1>
            <p className="text-muted-foreground">
              Align your current holdings with your ideal target allocation.
            </p>
          </div>
          <Button onClick={fetchAnalysis} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh Analysis
          </Button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Overall Drift</span>
              <AlertTriangle className={`h-4 w-4 ${data.overallDriftPct > 10 ? 'text-loss' : 'text-amber-500'}`} />
            </div>
            <div className="text-3xl font-bold">{data.overallDriftPct.toFixed(1)}%</div>
            <Progress value={data.overallDriftPct * 5} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {data.overallDriftPct > 10 ? 'High drift detected. Rebalancing recommended.' : 'Portfolio is relatively aligned.'}
            </p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Adjustments</span>
              <ArrowRightLeft className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{data.suggestions.length}</div>
            <p className="text-sm text-muted-foreground pb-4">Required actions to reach targets.</p>
          </Card>

          <Card className="p-6 bg-primary/5 border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">Target Strategy</span>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-primary">{data.strategyName || 'Balanced Growth'}</div>
            <p className="text-xs text-muted-foreground">
              Based on your '{data.personaName || 'Growth Strategist'}' persona.
            </p>
          </Card>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 pb-2">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Current vs Target Allocation (%)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis unit="%" />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="Current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Current Asset Mix
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="h-[250px] w-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-4">
                {data.driftAnalysis.map(item => (
                  <div key={item.assetClass} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.assetClass}</span>
                      <span className="text-muted-foreground">{item.currentPct}% / {item.targetPct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Progress value={item.currentPct} className="h-2 flex-1" />
                       <span className={`text-xs font-bold w-12 text-right ${item.driftPct > 0 ? 'text-loss' : 'text-primary'}`}>
                         {item.driftPct > 0 ? '+' : ''}{item.driftPct}%
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Suggestions Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Recommended Rebalancing Actions
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {data.suggestions.length === 0 ? (
              <Card className="p-12 text-center space-y-4">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-semibold">Portfolio is Aligned</h4>
                  <p className="text-muted-foreground">Your current allocation perfectly matches your strategic targets.</p>
                </div>
              </Card>
            ) : (
              data.suggestions.map((suggestion) => (
                <Card key={suggestion.id} className="p-6 overflow-hidden relative">
                  <div className={`absolute top-0 left-0 w-1 h-full ${suggestion.priority === 'HIGH' ? 'bg-loss' : 'bg-primary'}`} />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-full h-fit mt-1 ${suggestion.type === 'SELL' ? 'bg-loss/10 text-loss' : suggestion.type === 'BUY' ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600'}`}>
                        {suggestion.type === 'SELL' ? <ArrowDownCircle className="h-6 w-6" /> : suggestion.type === 'BUY' ? <ArrowUpCircle className="h-6 w-6" /> : <ArrowRightLeft className="h-6 w-6" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-lg">{suggestion.type} {suggestion.type === 'SWITCH' ? `${suggestion.fromAsset} to ${suggestion.toAsset}` : suggestion.toAsset || suggestion.fromAsset}</span>
                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${suggestion.priority === 'HIGH' ? 'bg-loss/10 text-loss' : 'bg-muted text-muted-foreground'}`}>
                             {suggestion.priority} Priority
                           </span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">{suggestion.reason}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-2xl font-bold">{formatCurrency(suggestion.amount)}</div>
                      <Button className="w-full md:w-auto" variant={suggestion.priority === 'HIGH' ? 'destructive' : 'default'}>
                        Execute Recommendation
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Actual Holdings Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Current Portfolio Holdings
          </h3>
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Asset Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Quantity</th>
                    <th className="px-6 py-4 text-right">Market Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.holdings && data.holdings.length > 0 ? (
                    data.holdings.map((h, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-foreground">{h.name}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {h.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{h.category}</td>
                        <td className="px-6 py-4 text-right font-mono">{h.quantity.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-foreground">
                          {formatCurrency(h.currentValue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                        No holdings found for this client. Portfolio data needs to be synced.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data.holdings && data.holdings.length > 0 && (
                  <tfoot className="bg-muted/20 font-bold border-t">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right">Total Portfolio Value</td>
                      <td className="px-6 py-4 text-right text-primary">
                        {formatCurrency(data.holdings.reduce((sum, h) => sum + h.currentValue, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </div>

        {/* Advisory Footer info */}
        <Card className="p-4 bg-muted/50 border-dashed border-2 text-center flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          Rebalancing suggestions are generated based on Modern Portfolio Theory and your personalized risk profile. 
          Execution of these trades is manual and should be done within your primary brokerage account.
        </Card>
      </main>
    </div>
  );
};

export default PortfolioRebalancing;
