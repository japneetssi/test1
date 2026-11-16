import React from 'react';
import { ParameterInsight } from '@/lib/financialReport.util';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface FinancialTreeProps {
  insights: ParameterInsight[];
}

export const FinancialTree: React.FC<FinancialTreeProps> = ({ insights }) => {
  // Group by category
  const categories = insights.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, ParameterInsight[]>);

  // Desired order of categories based on prompt
  const categoryOrder = ['Cash Flow', 'Net Worth', 'Protection', 'Wealth Creation', 'Advanced Planning'];

  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 tracking-tight">The Financial Tree</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryOrder.map((category) => {
          const items = categories[category];
          if (!items) return null;

          return (
            <Card key={category} className="border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/50">
                <CardTitle className="text-lg text-gray-700 font-semibold">{category}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {items.map((item) => {
                  const isGood = item.status === 'Looks Good';
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-medium text-gray-600">{item.name}</span>
                      <div className="flex items-center gap-2">
                        {isGood ? (
                          <div className="flex items-center text-emerald-600 gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-semibold">Good</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-500 gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-semibold">Concern</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
