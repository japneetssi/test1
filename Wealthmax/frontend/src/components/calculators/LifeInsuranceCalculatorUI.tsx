import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { calculateLifeInsurance } from "@/services/calculator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const LifeInsuranceCalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [income, setIncome] = useState(1200000);
    const [age, setAge] = useState(35);
    const [retirementAge, setRetirementAge] = useState(60);
    const [liabilities, setLiabilities] = useState(2000000);
    const [assets, setAssets] = useState(3000000);
    const [dependents, setDependents] = useState(3);

    // Output State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const dIncome = useDebounce(income, 500);
    const dAge = useDebounce(age, 500);
    const dRetirementAge = useDebounce(retirementAge, 500);
    const dLiabilities = useDebounce(liabilities, 500);
    const dAssets = useDebounce(assets, 500);
    const dDependents = useDebounce(dependents, 500);

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
                const res = await calculateLifeInsurance({
                    income: dIncome,
                    age: dAge,
                    retirementAge: dRetirementAge,
                    liabilities: dLiabilities,
                    assets: dAssets,
                    dependents: dDependents
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
    }, [dIncome, dAge, dRetirementAge, dLiabilities, dAssets, dDependents, toast]);

    const chartData = useMemo(() => {
        // A simple visual mapping representing required cover vs age.
        // In reality, Human Life Value decreases as we age (closer to retirement), assuming liabilities are paid off.
        const data = [];
        let currentHLV = result?.humanLifeValue || (income * (retirementAge - age));
        let currentLiabilities = liabilities;

        for (let y = age; y <= retirementAge; y++) {
            const remainingYears = retirementAge - y;
            let projectedHLV = income * remainingYears; // simplified HLV projection

            data.push({
                age: `Age ${y}`,
                requiredCover: Math.max(0, projectedHLV + currentLiabilities - assets),
                hlv: projectedHLV,
            });

            // Assume liabilities decrease slightly over time
            currentLiabilities = Math.max(0, currentLiabilities - (liabilities / (retirementAge - age)));
        }

        return data;
    }, [age, retirementAge, income, liabilities, assets, result]);

    return (
        <CalculatorLayout
            title="Life Insurance Manager"
            subtitle="Examine your Human Life Value and assess your coverage gap."
            inputs={
                <>
                    <LinkedSlider label="Annual Income" min={300000} max={10000000} step={100000} value={income} onChange={setIncome} prefix="₹" />
                    <LinkedSlider label="Current Age" min={20} max={60} step={1} value={age} onChange={setAge} suffix=" Yrs" />
                    <LinkedSlider label="Retirement Age" min={50} max={70} step={1} value={retirementAge} onChange={setRetirementAge} suffix=" Yrs" />
                    <LinkedSlider label="Total Liabilities (Loans, etc.)" min={0} max={20000000} step={100000} value={liabilities} onChange={setLiabilities} prefix="₹" />
                    <LinkedSlider label="Existing Savings/Assets" min={0} max={20000000} step={100000} value={assets} onChange={setAssets} prefix="₹" />
                    <LinkedSlider label="Number of Dependents" min={0} max={10} step={1} value={dependents} onChange={setDependents} />
                </>
            }
            results={
                <>
                    <SummaryCard label="Recommended Life Cover" value={result?.summary ? formatINR(result.summary.requiredCover) : "Calculating..."} />
                    <SummaryCard label="Coverage Gap" value={result?.summary ? formatINR(Math.max(0, result.summary.requiredCover - result.summary.existingAssets)) : "Calculating..."} highlight />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCover" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f37920" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f37920" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(val: number) => formatINR(val)} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="requiredCover" name="Required Protection" stroke="#f37920" strokeWidth={3} fillOpacity={1} fill="url(#colorCover)" />
                    </AreaChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Explore Term Plans"
            onPrimaryAction={() => toast({ title: "Redirecting to Insurance", description: "Taking you to curated term insurance plans." })}
            isCalculating={isCalculating}
        />
    );
};
