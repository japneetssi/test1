import React from 'react';
import { ParameterInsight } from '@/lib/financialReport.util';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ParameterDetailProps {
  insight: ParameterInsight;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export const ParameterDetail: React.FC<ParameterDetailProps> = ({ insight }) => {
  const isGood = insight.status === 'Looks Good';

  // Dynamic Infographic Rendering based on the parameter ID
  const renderInfographic = () => {
    if (!insight.metrics) return null;

    switch (insight.id) {
      case 'expenses': {
        const data = [
          { name: 'Income', value: insight.metrics.expenses / (insight.metrics.expenseRatio / 100), fill: '#e5e7eb' },
          { name: 'Expenses', value: insight.metrics.expenses, fill: isGood ? '#10b981' : '#ef4444' }
        ];
        return (
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }
      case 'assets':
      case 'liabilities': {
        // Mock distribution for assets/liabilities if needed, or simple pie chart
        const data = [
          { name: 'Total', value: insight.metrics[insight.id] || 1 }
        ];
        return (
          <div className="h-64 w-full mt-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Total Value</p>
              <p className="text-3xl font-bold text-gray-800">
                ₹{insight.metrics[insight.id]?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        );
      }
      case 'retirement': {
        const data = [
          { name: 'Projected', value: insight.metrics.projected },
          { name: 'Needed', value: insight.metrics.needed }
        ];
        return (
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={48}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Needed' ? '#94a3b8' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      }
      default:
        // Default circular progress or pie representation if no specific chart
        if (Object.keys(insight.metrics).length > 0) {
           const keys = Object.keys(insight.metrics);
           if(keys.length === 1 && typeof insight.metrics[keys[0]] === 'number') {
              // It's a single ratio or boolean
              const val = insight.metrics[keys[0]];
              if (val <= 100) {
                 const data = [
                    { name: 'Achieved', value: val },
                    { name: 'Remaining', value: 100 - val }
                 ];
                 return (
                    <div className="h-64 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill={isGood ? '#10b981' : '#f59e0b'} />
                            <Cell fill="#f3f4f6" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                 )
              }
           }
        }
        return null;
    }
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
      <CardHeader className="pb-4 border-b border-gray-50 flex flex-row items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{insight.category}</p>
          <CardTitle className="text-xl text-gray-800">{insight.name}</CardTitle>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {insight.status}
        </div>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Current Issue / Observation
            </h4>
            <p className="text-gray-600 leading-relaxed text-sm">
              {insight.currentIssue}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100/50">
            <h4 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Recommendation
            </h4>
            <p className="text-emerald-800 leading-relaxed text-sm">
              {insight.recommendation}
            </p>
          </div>
        </div>
        
        {/* Infographic Section */}
        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 flex items-center justify-center min-h-[280px]">
          {renderInfographic() || (
            <div className="text-center text-gray-400">
              <p className="text-sm">Visual analysis available in detailed report.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
