import React, { useState, useEffect } from 'react';
import { FinancialTree } from '@/components/smart-report/FinancialTree';
import { FinancialMatrix } from '@/components/smart-report/FinancialMatrix';
import { AttentionDetails } from '@/components/smart-report/AttentionDetails';
import { Button } from '@/components/ui/button';
import { Phone, Download, HeartPulse, Loader2 } from 'lucide-react';
import { generateSmartReport, ReportParameter, GlobalMetrics } from '@/services/reportService';
import { useAuth } from '@/contexts/AuthContext';

export default function SmartReportDashboard() {
  const [reportData, setReportData] = useState<ReportParameter[]>([]);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReportPayload = async () => {
      try {
        setIsLoading(true);
        // Call the Guaranteed Calculation Service mapped from /profile
        const result = await generateSmartReport();

        // Bind directly to state from the guaranteed structure
        setReportData(result.parameters);
        setGlobalMetrics(result.global);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportPayload();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 py-10 print:py-0 print:bg-white flex justify-center">
      
      <div className="bg-white w-full max-w-[210mm] shadow-2xl print:shadow-none print:max-w-none print:w-full overflow-hidden min-h-[297mm] flex flex-col">
        
        <header className="bg-emerald-900 text-white p-8 print:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 break-inside-avoid">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Smart Financial Report</h1>
            <p className="text-emerald-200 font-medium text-sm">Comprehensive Diagnostic & Optimization Plan</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 text-center min-w-[180px]">
             <HeartPulse className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
             <p className="text-xs text-emerald-200 uppercase tracking-widest font-bold mb-1">Data Sync</p>
             <div className="text-xl font-black text-white flex items-baseline justify-center gap-1">
               {isLoading ? 'SYNCING' : 'ACTIVE'}
             </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-500 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
            <h3 className="text-xl font-bold">Aggregating Financial Intelligence...</h3>
            <p className="text-sm">Calculating 12-parameter matrix across all accounts.</p>
          </div>
        ) : (
          <div className="p-8 print:p-6 space-y-8 flex-1">
            
            {/* Matrices bound to globalMetrics */}
            {globalMetrics && (
              <section className="break-inside-avoid">
                <FinancialMatrix globalMetrics={globalMetrics} />
              </section>
            )}

            <div className="break-before-page print:block"></div>

            <section className="relative break-inside-avoid break-before-page">
              <h2 className="text-2xl font-bold text-slate-800 border-b-2 border-emerald-500 pb-2 mb-6 inline-block">
                Total Financial Picture
              </h2>
              <p className="text-slate-500 mb-8 font-medium">A diagnostic mapping of your 12 core financial parameters.</p>
              
              <FinancialTree reportData={reportData} />
            </section>

            <div className="break-before-page print:block"></div>

            <section className="break-before-page">
              <AttentionDetails reportData={reportData} />
            </section>

            <section className="mt-16 print:mt-12 bg-slate-50 border-t-4 border-emerald-600 p-8 print:p-6 rounded-b-xl break-inside-avoid">
              <div className="bg-emerald-900 text-white p-6 rounded-xl text-center shadow-lg print:shadow-none print:border print:border-emerald-900">
                <h4 className="text-xl font-bold mb-3">Consult your financial guide for a detailed proposal.</h4>
                <p className="text-emerald-200 text-sm mb-6 max-w-lg mx-auto">
                  This diagnostic report is the first step. Let's translate these insights into a personalized, actionable wealth management strategy.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 print:hidden">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-8">
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Consultation
                  </Button>
                  <Button size="lg" variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-800 hover:text-white" onClick={() => window.print()}>
                    <Download className="w-4 h-4 mr-2" />
                    Download / Print A4 PDF
                  </Button>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
