import { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, TrendingDown, Info, Loader2, Calculator, RefreshCw, AlertCircle } from "lucide-react";
import api from '@/lib/api';

const getIconForCategory = (category: string) => {
  if (category === "Emergency Fund") return AlertTriangle;
  if (category === "Debt Management") return ShieldAlert;
  if (category === "Asset Allocation" || category === "Portfolio Rebalancing") return RefreshCw;
  if (category === "Tax" || category === "Tax Optimization") return Calculator;
  if (category === "Critical" || category === "High") return AlertCircle;
  return Info;
};

const SmartAlerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await api.get('/profile');
        if (data?.data?.action_items) {
          // Map backend Action Items to the UI Alert format
          const mappedAlerts = data.data.action_items.map((item: any) => ({
            id: item.id,
            icon: getIconForCategory(item.category),
            title: item.title,
            description: item.description,
            severity: item.priority === "Critical" ? "critical" : item.priority === "High" ? "high" : item.priority === "Medium" ? "medium" : "low",
            points: item.estimated_score_impact,
          }));

          // Sort Critical -> High -> Medium -> Low
          const priorityOrder: Record<string, number> = { "critical": 0, "high": 1, "medium": 2, "low": 3 };
          mappedAlerts.sort((a: any, b: any) => priorityOrder[a.severity] - priorityOrder[b.severity]);

          setAlerts(mappedAlerts);
        }

        // Fetch Next Best Action (Real-time dynamic)
        try {
          const nbaRes = await api.get('/profile/next-best-action');
          if (nbaRes.data?.success && nbaRes.data?.data?.nextAction) {
            const nba = nbaRes.data.data.nextAction;
            if (nba.actionType !== 'ALL_CLEAR') {
              setAlerts(prev => {
                const results = [...prev];
                const existing = results.find(a => a.title === nba.title);
                if (!existing) {
                  results.unshift({
                    id: 'nba-' + nba.actionType,
                    icon: nba.actionType === 'TAX_OPTIMIZATION' ? Calculator : 
                          nba.actionType === 'PORTFOLIO_DRIFT' ? RefreshCw : 
                          getIconForCategory(nba.actionType),
                    title: nba.title,
                    description: nba.reason,
                    severity: 'high',
                    points: nba.scoreImpact,
                  });
                }
                return results;
              });
            }
          }
        } catch (e) {
          console.warn("NBA fetch failed", e);
        }
      } catch (error) {
        console.error("Failed to load smart alerts", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col flex-1 min-h-[300px]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-800 text-base">Smart Risk Alerts</h3>
        <button className="text-sm text-blue-600 font-bold hover:underline">
          View Action Plan
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No active risks detected.</p>
          <p className="text-xs text-slate-500 mt-1">Your financial baseline is well-protected.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
          {alerts.slice(0, 4).map((alert) => {
            const Icon = alert.icon;
            const isOrange = alert.severity === "critical" || alert.severity === "high";
            
            return (
              <div 
                key={alert.id}
                className={`border-l-4 rounded-r-xl p-4 bg-slate-50 border-t border-r border-b border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer group ${
                  isOrange ? "border-l-orange-500" : "border-l-slate-400"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 transition-transform group-hover:scale-110 ${isOrange ? "text-orange-500" : "text-slate-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{alert.title}</h4>
                      {alert.points > 0 && (
                        <span className="shrink-0 bg-green-100 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          +{alert.points} Pts
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmartAlerts;
