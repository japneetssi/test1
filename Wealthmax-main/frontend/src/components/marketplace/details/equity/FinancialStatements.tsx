import React from 'react';
import { FinancialStatements } from '@/types/equity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Props {
    financials?: FinancialStatements;
}

export const FinancialStatementsView: React.FC<Props> = ({ financials }) => {
    
    // Mock data if none provided
    const mockData = [
        { period: 'Mar 2020', revenue: 15200, pat: 1200 },
        { period: 'Mar 2021', revenue: 16800, pat: 1500 },
        { period: 'Mar 2022', revenue: 19500, pat: 2100 },
        { period: 'Mar 2023', revenue: 24300, pat: 2800 },
        { period: 'Mar 2024', revenue: 28900, pat: 3400 },
    ];

    const chartData = financials?.yearly?.incomeStatement || mockData;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-lg font-bold text-gray-900">Financial Statements</h2>
                <Tabs defaultValue="yearly" className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-50">
                        <TabsTrigger value="quarterly" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Quarterly</TabsTrigger>
                        <TabsTrigger value="yearly" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Yearly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Chart */}
                <div className="h-[300px]">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Revenue & Profit Trend (₹ Cr)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="period" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f9fafb' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                            <Bar dataKey="revenue" name="Revenue" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="pat" name="Net Profit" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Table Data */}
                <div>
                    <Tabs defaultValue="income" className="w-full">
                        <TabsList className="bg-transparent border-b border-gray-100 rounded-none w-full justify-start h-auto p-0 mb-4">
                            <TabsTrigger value="income" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:shadow-none bg-transparent px-4 py-2 text-sm">Income</TabsTrigger>
                            <TabsTrigger value="balance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:shadow-none bg-transparent px-4 py-2 text-sm">Balance Sheet</TabsTrigger>
                            <TabsTrigger value="cashflow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:shadow-none bg-transparent px-4 py-2 text-sm">Cash Flow</TabsTrigger>
                        </TabsList>

                        <TabsContent value="income" className="mt-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 font-medium rounded-l-lg">Metric (₹ Cr)</th>
                                            {chartData.slice(-3).map(d => (
                                                <th key={d.period} className="px-4 py-2 font-medium text-right">{d.period}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        <tr>
                                            <td className="px-4 py-3 font-medium text-gray-900">Total Revenue</td>
                                            {chartData.slice(-3).map(d => <td key={d.period} className="px-4 py-3 text-right">{d.revenue.toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-medium text-gray-900">EBITDA</td>
                                            {chartData.slice(-3).map(d => <td key={d.period} className="px-4 py-3 text-right">{(d.pat * 1.5).toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-medium text-gray-900">Net Profit (PAT)</td>
                                            {chartData.slice(-3).map(d => <td key={d.period} className="px-4 py-3 text-right text-emerald-600 font-medium">{d.pat.toLocaleString()}</td>)}
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-medium text-gray-900">EPS (₹)</td>
                                            {chartData.slice(-3).map(d => <td key={d.period} className="px-4 py-3 text-right">{(d.pat / 100).toFixed(2)}</td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="balance" className="mt-0">
                            <p className="text-sm text-gray-500 p-4 text-center">Balance Sheet data will appear here</p>
                        </TabsContent>

                        <TabsContent value="cashflow" className="mt-0">
                            <p className="text-sm text-gray-500 p-4 text-center">Cash Flow data will appear here</p>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};
