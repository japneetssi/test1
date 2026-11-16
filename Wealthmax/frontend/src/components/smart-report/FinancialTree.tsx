import React from 'react';

// Using the strict contract defined in SmartReportDashboard
export interface ReportParameter {
  id: string;
  name: string;
  status: string; // "Concern" | "Healthy"
  currentAssessment: number | string;
  targetRequirement: number | string;
  diagnosis: string;
  actionPlan: string[];
}

interface FinancialTreeProps {
  reportData: ReportParameter[];
}

export const FinancialTree: React.FC<FinancialTreeProps> = ({ reportData }) => {
  // If the backend payload is missing or empty
  if (!reportData || reportData.length === 0) {
    return (
      <div className="w-full relative aspect-square max-w-2xl mx-auto my-12 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-8">
        <p className="text-slate-500 font-bold text-center">Data Unavailable: No parameters received from backend.</p>
      </div>
    );
  }

  // 3. Sync the <FinancialTree /> 
  // Generate perfect radial coordinates based on mapped reportData
  const radiusPercent = 42;
  const nodes = reportData.map((param, index) => {
    // Distribute evenly in a 360 circle
    const angle = (index * (360 / reportData.length) - 90) * (Math.PI / 180);
    const xPercent = Math.cos(angle) * radiusPercent;
    const yPercent = Math.sin(angle) * radiusPercent;
    return { ...param, xPercent, yPercent };
  });

  return (
    <div className="w-full relative aspect-square max-w-[600px] mx-auto my-12 print:my-4 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-8">
      
      {/* Central Hub/Tree SVG Base */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-white flex items-center justify-center z-10 shadow-xl border-4 border-emerald-100 p-4">
        <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-700" fill="currentColor">
          <path d="M 100,180 C 80,180 70,160 60,150 C 70,155 80,140 90,140 L 110,140 C 120,140 130,155 140,150 C 130,160 120,180 100,180 Z" />
          <path d="M 90,140 L 80,80 C 90,90 100,100 110,80 L 110,140 Z" />
          <path d="M 85,100 C 60,90 50,70 30,60 C 50,75 70,85 80,80 Z" />
          <path d="M 110,95 C 140,85 150,65 170,55 C 150,70 130,80 120,75 Z" />
          <path d="M 95,85 C 90,60 85,40 100,20 C 110,40 105,60 105,85 Z" />
          <circle cx="100" cy="50" r="45" fill="currentColor" opacity="0.85" className="text-emerald-500" />
          <circle cx="60" cy="70" r="35" fill="currentColor" opacity="0.9" className="text-emerald-400" />
          <circle cx="140" cy="65" r="35" fill="currentColor" opacity="0.9" className="text-emerald-400" />
          <circle cx="100" cy="20" r="30" fill="currentColor" opacity="0.9" className="text-emerald-300" />
          <circle cx="40" cy="40" r="25" fill="currentColor" opacity="0.8" className="text-emerald-300" />
          <circle cx="160" cy="35" r="25" fill="currentColor" opacity="0.8" className="text-emerald-300" />
        </svg>
      </div>

      {/* Connectors drawn behind the nodes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {nodes.map((node) => (
          <line 
            key={`line-${node.id}`}
            x1="50%" 
            y1="50%" 
            x2={`${50 + node.xPercent}%`} 
            y2={`${50 + node.yPercent}%`} 
            stroke="#cbd5e1" 
            strokeWidth="2" 
            strokeDasharray="3 3" 
          />
        ))}
      </svg>

      {/* Nodes Mapping perfectly bound to the fetched data */}
      {nodes.map((node) => {
        // Strict mapping based on the exact status string
        const isGood = node.status === 'Healthy';
        
        return (
          <div 
            key={node.id}
            className="absolute flex flex-col items-center bg-white px-3 py-2 rounded-xl shadow-lg border border-slate-200 z-20 w-32 text-center"
            style={{ 
              left: `${50 + node.xPercent}%`,
              top: `${50 + node.yPercent}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isGood ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <p className="text-[10px] font-black text-slate-800 leading-tight uppercase tracking-wide">{node.name}</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500">{isGood ? 'Healthy' : 'Needs Action'}</p>
          </div>
        );
      })}
      
    </div>
  );
};
