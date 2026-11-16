import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { projectSIPWealth } from "@/lib/financialMath";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const SIPCalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
    const [stepUp, setStepUp] = useState(0);
    const [years, setYears] = useState(10);

    // Debounce individual primitive values to avoid infinite loop from object identity
    const dMonthlyInvestment = useDebounce(monthlyInvestment, 500);
    const dStepUp = useDebounce(stepUp, 500);
    const dYears = useDebounce(years, 500);

    const formatINR = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)} K`;
        return `₹${Math.round(val)}`;
    };

    const { chartData, result } = useMemo(() => {
        const projection = projectSIPWealth(dMonthlyInvestment, dYears, dStepUp);
        return {
            chartData: projection.yearlyData,
            result: projection
        };
    }, [dMonthlyInvestment, dStepUp, dYears]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const total = payload[0].payload.totalValue;
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-slate-800 mb-2">{label}</p>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm mb-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-600">{entry.name}:</span>
                            <span className="font-bold text-slate-900">{formatINR(entry.value)}</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Total:</span>
                        <span className="text-sm font-bold text-[#f37920]">{formatINR(total)}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <CalculatorLayout
            title="SIP Calculator"
            subtitle="Discover the power of compounding with a fixed 12% ROI."
            inputs={
                <>
                    <LinkedSlider label="Monthly Investment" min={500} max={1000000} step={500} value={monthlyInvestment} onChange={setMonthlyInvestment} prefix="₹" />
                    <LinkedSlider label="Annual Step-up" min={0} max={50} step={1} value={stepUp} onChange={setStepUp} suffix="%" />
                    <LinkedSlider label="Time Period" min={1} max={40} step={1} value={years} onChange={setYears} suffix=" Yrs" />
                </>
            }
            results={
                <>
                    <SummaryCard label="Total Wealth Generated" value={result?.summary ? formatINR(result.summary.totalValue) : "Calculating..."} highlight />
                    <SummaryCard label="Total Invested Amount" value={result?.summary ? formatINR(result.summary.investedAmount) : "Calculating..."} />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00458c" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#00458c" stopOpacity={0.2} />
                            </linearGradient>
                            <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f37920" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f37920" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        {/* Stacked areas to show compounding visually */}
                        <Area type="monotone" dataKey="invested" stackId="1" name="Amount Invested" stroke="#00458c" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" />
                        <Area type="monotone" dataKey="gains" stackId="1" name="Wealth Gained" stroke="#f37920" strokeWidth={2} fillOpacity={1} fill="url(#colorGains)" />
                    </AreaChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Start Investing Now"
            onPrimaryAction={() => toast({ title: "Redirecting to Invest", description: "Taking you to the SIP investment portal." })}
            isCalculating={false}
        />
    );
};
