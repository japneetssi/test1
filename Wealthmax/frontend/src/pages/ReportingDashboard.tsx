import React, { useMemo } from 'react';
import { generateFinancialReport, UserFinancialData } from '@/lib/financialReport.util';
import { FinancialTree } from '@/components/reporting/FinancialTree';
import { FinancialMatrix } from '@/components/reporting/FinancialMatrix';
import { ParameterDetail } from '@/components/reporting/ParameterDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, ArrowRight } from 'lucide-react';

// Mock Data for demonstration. In a real scenario, this comes from Supabase/Context
const mockUserData: UserFinancialData = {
  income: 1800000,
  expenses: 1350000,
  totalAssets: 4500000,
  totalLiabilities: 1200000,
  lifeCover: 10000000,
  healthCover: 1000000,
  emergencyFund: 600000,
  investmentRatio: 15, // 15%
  goalsOnTrack: false,
  retirementCorpusProjected: 25000000,
  retirementCorpusNeeded: 40000000,
  taxOptimized: true,
  hasWill: false
};

const mockUserProfile = {
  name: "Arjun Sharma",
  age: 34,
  riskProfile: "Moderate to Aggressive",
  reportDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
};

export default function ReportingDashboard() {
  const insights = useMemo(() => generateFinancialReport(mockUserData), []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 pb-20">
      
      {/* SECTION 1: KYC & Profile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
              {mockUserProfile.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Financial Health Report</h1>
              <p className="text-sm text-gray-500 font-medium">For {mockUserProfile.name} • {mockUserProfile.age} yrs • {mockUserProfile.riskProfile}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Generated On</p>
            <p className="text-sm font-semibold text-gray-700">{mockUserProfile.reportDate}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        
        {/* SECTION 2: The Financial Tree */}
        <section>
          <FinancialTree insights={insights} />
        </section>

        <hr className="border-gray-200" />

        {/* SECTION 3: Financial Matrix */}
        <section>
          <FinancialMatrix data={mockUserData} />
        </section>

        <hr className="border-gray-200" />

        {/* SECTION 4: Detailed Parameter Breakdown */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Parameter Breakdown</h2>
          <div className="grid grid-cols-1 gap-6">
            {insights.map(insight => (
              <ParameterDetail key={insight.id} insight={insight} />
            ))}
          </div>
        </section>

        {/* SECTION 5: Conclusion & CTA */}
        <section className="pt-8">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-none shadow-xl text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <CardContent className="p-10 flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                <User className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Your Financial Journey Starts Here</h2>
              <p className="text-slate-300 max-w-2xl text-lg">
                This report provides a snapshot of your financial health. To close the gaps and build a robust, goal-oriented strategy, let's discuss a detailed proposal tailored specifically for you.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 text-base shadow-lg shadow-emerald-500/20">
                  <Phone className="w-4 h-4 mr-2" />
                  Get in touch with your Guide
                </Button>
                <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-12 text-base">
                  Download PDF Report
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
