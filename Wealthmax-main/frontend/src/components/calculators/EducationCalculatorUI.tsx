import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { calculateEducation } from "@/services/calculator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const EducationCalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [childAge, setChildAge] = useState(5);
    const [goalYear, setGoalYear] = useState(18);
    const [currentCost, setCurrentCost] = useState(500000);
    const [inflationRate, setInflationRate] = useState(8);
    const [currentSavings, setCurrentSavings] = useState(100000);
    const [returnRate, setReturnRate] = useState(12);

    // Output State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const dChildAge = useDebounce(childAge, 500);
    const dGoalYear = useDebounce(goalYear, 500);
    const dCurrentCost = useDebounce(currentCost, 500);
    const dInflationRate = useDebounce(inflationRate, 500);
    const dCurrentSavings = useDebounce(currentSavings, 500);
    const dReturnRate = useDebounce(returnRate, 500);

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
                const res = await calculateEducation({
                    childAge: dChildAge,
                    goalYear: new Date().getFullYear() + (dGoalYear - dChildAge),
                    currentCost: dCurrentCost,
                    inflation: dInflationRate,
                    currentSavings: dCurrentSavings,
                    returnRate: dReturnRate
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
    }, [dChildAge, dGoalYear, dCurrentCost, dInflationRate, dCurrentSavings, dReturnRate, toast]);

    const chartData = useMemo(() => {
        const data = [];
        let saving = currentSavings;
        let cost = currentCost;
        const sip = result?.monthlySIPRequired || 0;

        for (let y = childAge; y <= goalYear; y++) {
            if (y > childAge) {
                saving = (saving + (sip * 12)) * (1 + (returnRate / 100));
                cost = cost * (1 + (inflationRate / 100));
            }

            data.push({
                age: `Age ${y}`,
                corpus: Math.round(saving),
                estimatedCost: Math.round(cost)
            });
        }
        return data;
    }, [childAge, goalYear, currentCost, inflationRate, currentSavings, returnRate, result]);

    return (
        <CalculatorLayout
            title="Child Education Planner"
            subtitle="Secure your child's future by estimating inflation-adjusted education costs."
            inputs={
                <>
                    <LinkedSlider label="Child's Current Age" min={0} max={17} step={1} value={childAge} onChange={setChildAge} suffix=" Yrs" />
                    <LinkedSlider label="Age at College Admission" min={15} max={25} step={1} value={goalYear} onChange={setGoalYear} suffix=" Yrs" />
                    <LinkedSlider label="Current Cost of Education" min={100000} max={10000000} step={50000} value={currentCost} onChange={setCurrentCost} prefix="₹" />
                    <LinkedSlider label="Education Inflation Rate" min={4} max={15} step={0.5} value={inflationRate} onChange={setInflationRate} suffix="%" />
                    <LinkedSlider label="Current Savings for Education" min={0} max={5000000} step={10000} value={currentSavings} onChange={setCurrentSavings} prefix="₹" />
                    <LinkedSlider label="Expected Return Rate" min={6} max={20} step={0.5} value={returnRate} onChange={setReturnRate} suffix="%" />
                </>
            }
            results={
                <>
                    <SummaryCard label="Future Education Cost" value={result?.summary ? formatINR(result.summary.futureCost) : "Calculating..."} />
                    <SummaryCard label="Required Monthly SIP" value={result?.summary ? formatINR(result.summary.monthlySavingsRequired) : "Calculating..."} highlight />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCorpusEdu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00458c" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#00458c" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCostEdu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f37920" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f37920" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(val: number) => formatINR(val)} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="corpus" name="Wealth Grown" stroke="#00458c" strokeWidth={2} fillOpacity={1} fill="url(#colorCorpusEdu)" />
                        <Area type="monotone" dataKey="estimatedCost" name="Rising Education Cost" stroke="#f37920" strokeWidth={2} fillOpacity={1} fill="url(#colorCostEdu)" />
                    </AreaChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Start Education SIP"
            onPrimaryAction={() => toast({ title: "Redirecting", description: "Taking you to mutual fund investments." })}
            isCalculating={isCalculating}
        />
    );
};
