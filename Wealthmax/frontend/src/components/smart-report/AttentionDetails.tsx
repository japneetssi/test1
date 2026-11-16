import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ShieldAlert, TrendingUp } from 'lucide-react';
import { ReportParameter } from '@/pages/SmartReportDashboard';

interface AttentionDetailsProps {
  reportData: ReportParameter[];
}

export const AttentionDetails: React.FC<AttentionDetailsProps> = ({ reportData }) => {
  // Graceful fallback for empty backend data
  if (!reportData || reportData.length === 0) {
    return (
      <div className="w-full mt-12 mb-8 p-8 bg-slate-50 rounded-xl border border-slate-200 text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Data Unavailable</h3>
        <p className="text-slate-600">No parameters received from backend.</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-12 mb-8 print:mt-6 print:mb-4">
      <div className="flex items-center gap-4 mb-8 border-b-2 border-slate-200 pb-4">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Diagnostic Deep-Dive</h2>
      </div>

      <div className="space-y-8 print:space-y-6">
        {reportData.map((param) => {
          // Explicit null check inside map
          if (!param) return null;

          const isGood = param.status === 'Healthy';

          return (
            <div key={param.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid">
              
              {/* Card Header */}
              <div className={`px-6 py-4 flex justify-between items-center ${isGood ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'}`}>
                <div className="flex items-center gap-3">
                  {isGood ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <ShieldAlert className="h-6 w-6 text-red-600" />}
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                    {param.name || 'Unnamed Parameter'}
                  </h3>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${isGood ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                  {isGood ? 'Optimal Status' : 'Critical Concern'}
                </div>
              </div>

              {/* Card Body strictly mapped to contract structure */}
              <div className="p-6">
                
                {/* Current vs Target */}
                <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Assessment</p>
                    <p className="text-lg font-black text-slate-800">
                      {param.currentAssessment !== undefined ? param.currentAssessment : 'N/A'}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target / Requirement</p>
                    <p className="text-lg font-black text-slate-600">
                      {param.targetRequirement !== undefined ? param.targetRequirement : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Diagnosis */}
                <div className="mb-6">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Strategic Diagnosis
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {param.diagnosis || 'No diagnostic information available.'}
                  </p>
                </div>
                
                {/* Action Plan Array Mapping */}
                <div className="bg-slate-800 rounded-lg p-5">
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">Required Action Plan</h4>
                  <ul className="space-y-3">
                    {Array.isArray(param.actionPlan) && param.actionPlan.length > 0 ? (
                      param.actionPlan.map((action, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-300 font-medium leading-snug">
                            {action || 'Action details missing.'}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-400 font-medium">No explicit action plan defined.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
