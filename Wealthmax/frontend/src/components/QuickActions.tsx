import { TrendingUp, Shield, Download } from "lucide-react";

const QuickActions = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-bold text-slate-800 text-base mb-4">Quick Actions</h3>
      <div className="flex flex-col gap-3">
        <button className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-[#f37920] hover:bg-[#e06b18] text-white font-bold text-sm transition-colors shadow-sm">
          <TrendingUp className="h-4 w-4" />
          Invest in SIP
        </button>
        
        <button className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors border border-slate-200">
          <Shield className="h-4 w-4" />
          Pledge Assets
        </button>
        
        <button className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors border border-slate-200">
          <Download className="h-4 w-4" />
          Download Report
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
