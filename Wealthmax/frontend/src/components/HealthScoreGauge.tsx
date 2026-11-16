import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import api from '@/lib/api';

const HealthScoreGauge = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile');
        if (data?.data) {
          setProfileData(data.data);
        }
      } catch (error) {
        console.error("Failed to load health score", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center justify-center min-h-[170px]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Calculate scores
  const score = profileData?.health_score || 59;
  const maxScore = 100;
  const percentage = score / maxScore;

  const percentile = profileData?.gamification?.percentile || 44;
  const benchmark = profileData?.gamification?.benchmark || "EARLY CAREER BUILDER";

  // Using persona ratios if available to populate the 2x2 grid, otherwise fallback to mock values
  const ratios = profileData?.persona_data?.metrics?.ratios || {};
  
  // Convert 100% ratio to a score out of 30 (or 10 for emergency)
  // For Expenses and Liabilities (lower is better): Score = (100 - ratio) / 100 * 30
  // For Investments and Emergency (higher is better): Score = ratio / 100 * 30
  const expensesScore = ratios.expenses ? Math.round(((100 - ratios.expenses) / 100) * 30) : 20;
  const liabilitiesScore = ratios.liabilities ? Math.round(((100 - ratios.liabilities) / 100) * 30) : 15;
  const investmentsScore = ratios.investments ? Math.round((ratios.investments / 100) * 30) : 18;
  const emergencyScore = ratios.emergency_fund ? Math.round((ratios.emergency_fund / 100) * 10) : 6;

  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - percentage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col flex-1">
      <div className="flex flex-col md:flex-row items-center gap-8">
        
        {/* Left Side - Gauge */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width="200" height="110" viewBox="0 0 200 110" className="drop-shadow-sm">
            {/* Background arc */}
            <path
              d="M 10 100 A 80 80 0 0 1 190 100"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Score arc (Orange/Yellow) */}
            <path
              d="M 10 100 A 80 80 0 0 1 190 100"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-slate-800 tracking-tighter">{score}</span>
              <span className="text-lg text-slate-400 font-bold">/ {maxScore}</span>
            </div>
          </div>
        </div>

        {/* Right Side - 2x2 Grid & Footer */}
        <div className="flex-1 w-full flex flex-col justify-between">
          
          {/* 2x2 Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
            {/* Metric 1 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 tracking-wider">EXPENSES</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{expensesScore}/30</span>
                <span className={`h-2 w-2 rounded-full shadow-sm ${expensesScore >= 20 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>
            </div>
            
            {/* Metric 2 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 tracking-wider">LIABILITIES</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{liabilitiesScore}/30</span>
                <span className={`h-2 w-2 rounded-full shadow-sm ${liabilitiesScore >= 20 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>
            </div>
            
            {/* Metric 3 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 tracking-wider">INVESTMENTS</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{investmentsScore}/30</span>
                <span className={`h-2 w-2 rounded-full shadow-sm ${investmentsScore >= 20 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>
            </div>
            
            {/* Metric 4 */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-500 tracking-wider">EMERGENCY FUND</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{emergencyScore}/10</span>
                <span className={`h-2 w-2 rounded-full shadow-sm ${emergencyScore >= 8 ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-100">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              TOP {100 - percentile}% OF {benchmark}
            </span>
            <span className="text-[10px] bg-blue-900 text-white px-2 py-1 rounded-md font-bold tracking-wider shadow-sm uppercase">
              {percentile}TH PCTL
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default HealthScoreGauge;
