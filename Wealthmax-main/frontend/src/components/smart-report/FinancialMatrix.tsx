import React from 'react';
import { GlobalMetrics } from '@/services/reportService';

interface FinancialMatrixProps {
  globalMetrics: GlobalMetrics;
}

export const FinancialMatrix: React.FC<FinancialMatrixProps> = ({ globalMetrics }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="w-full mt-12 mb-8 print:mt-6 print:mb-4">
      <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-emerald-500 pb-2 mb-6 inline-block">
        Results at a Glance
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
        {/* Net Worth Statement */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden print:shadow-none print:border-slate-300">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
            <h4 className="text-lg font-bold text-slate-700">Net Worth Statement</h4>
          </div>
          <table className="w-full text-sm text-left">
            <tbody>
              <tr className="border-b border-slate-50">
                <td className="px-4 py-3 text-slate-600 font-medium">Total Assets</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatCurrency(globalMetrics.totalAssets)}</td>
              </tr>
              <tr className="border-b border-slate-50">
                <td className="px-4 py-3 text-slate-600 font-medium">Total Liabilities</td>
                <td className="px-4 py-3 text-right text-red-500 font-semibold">- {formatCurrency(globalMetrics.totalLiabilities)}</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-4 text-slate-800 font-bold">Estimated Net Worth</td>
                <td className="px-4 py-4 text-right text-slate-900 font-bold text-lg">{formatCurrency(globalMetrics.netWorth)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Monthly Cashflow Summary */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden print:shadow-none print:border-slate-300">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
            <h4 className="text-lg font-bold text-slate-700">Annual Cashflow Summary</h4>
          </div>
          <table className="w-full text-sm text-left">
            <tbody>
              <tr className="border-b border-slate-50">
                <td className="px-4 py-3 text-slate-600 font-medium">Total Income</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatCurrency(globalMetrics.totalIncome)}</td>
              </tr>
              <tr className="border-b border-slate-50">
                <td className="px-4 py-3 text-slate-600 font-medium">Living Expenses & EMIs</td>
                <td className="px-4 py-3 text-right text-red-500 font-semibold">- {formatCurrency(globalMetrics.totalExpenses)}</td>
              </tr>
              <tr className="bg-slate-50/50">
                <td className="px-4 py-4 text-slate-800 font-bold">Investible Surplus</td>
                <td className="px-4 py-4 text-right text-slate-900 font-bold text-lg">{formatCurrency(globalMetrics.investibleSurplus)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
