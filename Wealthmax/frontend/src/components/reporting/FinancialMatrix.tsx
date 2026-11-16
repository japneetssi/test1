import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserFinancialData } from '@/lib/financialReport.util';
import { TrendingUp, Wallet, PiggyBank, ShieldCheck } from 'lucide-react';

interface FinancialMatrixProps {
  data: UserFinancialData;
}

export const FinancialMatrix: React.FC<FinancialMatrixProps> = ({ data }) => {
  const netWorth = data.totalAssets - data.totalLiabilities;
  const surplusIncome = data.income - data.expenses;
  const savingsRatio = data.income > 0 ? (surplusIncome / data.income) * 100 : 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const metrics = [
    {
      title: 'Net Worth',
      value: formatCurrency(netWorth),
      subtitle: 'Assets minus Liabilities',
      icon: <Wallet className="w-5 h-5 text-emerald-600" />,
      isHighlight: true,
    },
    {
      title: 'Surplus Income',
      value: formatCurrency(surplusIncome),
      subtitle: `${savingsRatio.toFixed(1)}% savings ratio`,
      icon: <PiggyBank className="w-5 h-5 text-emerald-600" />,
      isHighlight: surplusIncome > 0,
    },
    {
      title: 'Total Debt',
      value: formatCurrency(data.totalLiabilities),
      subtitle: 'Current outstanding',
      icon: <TrendingUp className="w-5 h-5 text-rose-500" />,
      isHighlight: false,
    },
    {
      title: 'Protection Cover',
      value: formatCurrency(data.lifeCover + data.healthCover),
      subtitle: 'Life & Health combined',
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      isHighlight: false,
    }
  ];

  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Financial Matrix</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden relative">
            {/* Green accent line for highlights */}
            {metric.isHighlight && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
            )}
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{metric.title}</span>
                <div className="p-2 bg-gray-50 rounded-full">
                  {metric.icon}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className={`text-2xl font-bold tracking-tight ${metric.isHighlight ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {metric.value}
                </h3>
                <p className="text-xs text-gray-400 font-medium">{metric.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
