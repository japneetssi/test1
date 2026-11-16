import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { calculateRetirement } from "@/services/calculator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const RetirementCalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(60);
    const [monthlyExp, setMonthlyExp] = useState(50000);
    const [inflation, setInflation] = useState(6);
    const [existingSav, setExistingSav] = useState(500000);
    const [expectedReturn, setExpectedReturn] = useState(12);

    // Output State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const dCurrentAge = useDebounce(currentAge, 500);
    const dRetirementAge = useDebounce(retirementAge, 500);
    const dMonthlyExp = useDebounce(monthlyExp, 500);
    const dInflation = useDebounce(inflation, 500);
    const dExistingSav = useDebounce(existingSav, 500);
    const dExpectedReturn = useDebounce(expectedReturn, 500);

    const formatINR = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)} K`;
        return `₹${Math.round(val)}`;
    };

    useEffect(() => {
        let isMounted = true;
        const fetchResults = async () => {
            setIsCalculating(true);
            try {
                const res = await calculateRetirement({
                    currentAge: dCurrentAge,
                    retirementAge: dRetirementAge,
                    monthlyExpenses: dMonthlyExp,
                    inflationRate: dInflation,
                    existingSavings: dExistingSav,
                    expectedReturn: dExpectedReturn,
                    postRetirementReturn: 8,
                });
                if (isMounted) setResult(res);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (isMounted) toast({ title: "Calculation Failed", description: err.message, variant: "destructive" });
            } finally {
                if (isMounted) setIsCalculating(false);
            }
        };

        fetchResults();
        return () => { isMounted = false; };
    }, [dCurrentAge, dRetirementAge, dMonthlyExp, dInflation, dExistingSav, dExpectedReturn, toast]);

    // Generate chart data client-side for immediate visualization scaling
    const chartData = useMemo(() => {
        const data = [];
        let currentCorpus = existingSav;
        let currentExpense = monthlyExp * 12;
        const sip = result?.summary?.monthlySavingsRequired || 0;

        for (let age = currentAge; age <= retirementAge + 20; age++) {
            if (age <= retirementAge) {
                // Accumulation phase
                currentCorpus = (currentCorpus + (sip * 12)) * (1 + (expectedReturn / 100));
                currentExpense = currentExpense * (1 + (inflation / 100));
            } else {
                // Withdrawal phase
                currentExpense = currentExpense * (1 + (inflation / 100));
                currentCorpus = (currentCorpus * (1 + 0.08)) - currentExpense; // 8% post-retirement return
                if (currentCorpus < 0) currentCorpus = 0;
            }

            // Reduce density for standard screen
            if (age % 2 === 0 || age === retirementAge) {
                data.push({
                    age: `Age ${age}`,
                    corpus: Math.floor(currentCorpus),
                    expenses: Math.floor(currentExpense),
                    isRetirement: age === retirementAge
                });
            }
        }
        return data;
    }, [currentAge, retirementAge, monthlyExp, inflation, existingSav, expectedReturn, result]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-slate-800 mb-2">{label}</p>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-slate-600">{entry.name}:</span>
                            <span className="font-bold text-slate-900">{formatINR(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <CalculatorLayout
            title="Plan Your Retirement"
            subtitle="Calculate your inflation-adjusted corpus needs and SIP requirements."
            inputs={
                <>
                    <LinkedSlider label="Current Age" min={18} max={60} step={1} value={currentAge} onChange={setCurrentAge} suffix=" Yrs" />
                    <LinkedSlider label="Retirement Age" min={40} max={70} step={1} value={retirementAge} onChange={setRetirementAge} suffix=" Yrs" />
                    <LinkedSlider label="Monthly Expenses" min={10000} max={500000} step={5000} value={monthlyExp} onChange={setMonthlyExp} prefix="₹" />
                    <LinkedSlider label="Expected Inflation Rate" min={3} max={12} step={0.5} value={inflation} onChange={setInflation} suffix="%" />
                    <LinkedSlider label="Existing Savings" min={0} max={10000000} step={100000} value={existingSav} onChange={setExistingSav} prefix="₹" />
                    <LinkedSlider label="Expected Return on Investment" min={5} max={20} step={0.5} value={expectedReturn} onChange={setExpectedReturn} suffix="%" />
                </>
            }
            results={
                <>
                    <SummaryCard label="Required Retirement Corpus" value={result?.summary ? formatINR(result.summary.targetCorpus) : "Calculating..."} />
                    <SummaryCard label="Required Monthly SIP" value={result?.summary ? formatINR(result.summary.monthlySavingsRequired) : "Calculating..."} highlight />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00458c" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00458c" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f37920" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f37920" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="corpus" name="Wealth Corpus" stroke="#00458c" strokeWidth={2} fillOpacity={1} fill="url(#colorCorpus)" />
                        <Area type="monotone" dataKey="expenses" name="Annual Expenses" stroke="#f37920" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                    </AreaChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Start Retirement SIP"
            onPrimaryAction={() => toast({ title: "Redirecting to Invest", description: "You are being redirected to the SIP investment portal." })}
            isCalculating={isCalculating}
        />
    );
};
