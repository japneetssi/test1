import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { calculateCostOfDelay } from "@/services/calculator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const CostOfDelayCalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [sipAmount, setSipAmount] = useState(10000);
    const [returnRate, setReturnRate] = useState(12);
    const [delayYears, setDelayYears] = useState(3);
    const [totalYears, setTotalYears] = useState(20);

    // Output State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const dSipAmount = useDebounce(sipAmount, 500);
    const dReturnRate = useDebounce(returnRate, 500);
    const dDelayYears = useDebounce(delayYears, 500);
    const dTotalYears = useDebounce(totalYears, 500);

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
                const res = await calculateCostOfDelay({
                    sipAmount: dSipAmount,
                    returnRate: dReturnRate,
                    delayYears: dDelayYears,
                    totalYears: dTotalYears
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
    }, [dSipAmount, dReturnRate, dDelayYears, dTotalYears, toast]);

    const chartData = useMemo(() => {
        const data = [];
        let noDelayValue = 0;
        let delayValue = 0;

        for (let y = 1; y <= totalYears; y++) {
            // Calculate wealth if started now
            const n1 = y * 12;
            const r = returnRate / 100 / 12;
            noDelayValue = sipAmount * ((Math.pow(1 + r, n1) - 1) / r) * (1 + r);

            // Calculate wealth if delayed
            if (y > delayYears) {
                const n2 = (y - delayYears) * 12;
                delayValue = sipAmount * ((Math.pow(1 + r, n2) - 1) / r) * (1 + r);
            } else {
                delayValue = 0;
            }

            data.push({
                year: `Yr ${y}`,
                startedNow: Math.round(noDelayValue),
                startedLate: Math.round(delayValue)
            });
        }
        return data;
    }, [sipAmount, returnRate, delayYears, totalYears]);

    return (
        <CalculatorLayout
            title="Cost of Delay"
            subtitle="See how much wealth you lose by simply waiting to invest."
            inputs={
                <>
                    <LinkedSlider label="Planned Monthly SIP" min={1000} max={1000000} step={1000} value={sipAmount} onChange={setSipAmount} prefix="₹" />
                    <LinkedSlider label="Expected Return Rate" min={6} max={25} step={0.5} value={returnRate} onChange={setReturnRate} suffix="%" />
                    <LinkedSlider label="Delay in Investing" min={1} max={10} step={1} value={delayYears} onChange={setDelayYears} suffix=" Yrs" />
                    <LinkedSlider label="Total Investment Horizon" min={5} max={40} step={1} value={totalYears} onChange={setTotalYears} suffix=" Yrs" />
                </>
            }
            results={
                <>
                    <SummaryCard label="Loss due to Delay" value={result?.summary ? formatINR(result.summary.costOfDelay) : "Calculating..."} highlight />
                    <SummaryCard label="Corpus if Started Now" value={result?.summary ? formatINR(result.summary.fvImmediate) : "Calculating..."} />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00458c" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#00458c" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f37920" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f37920" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(val: number) => formatINR(val)} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="startedNow" name="Started Today" stroke="#00458c" strokeWidth={2} fillOpacity={1} fill="url(#colorNow)" />
                        <Area type="monotone" dataKey="startedLate" name={`Started in ${delayYears} Yrs`} stroke="#f37920" strokeWidth={2} fillOpacity={1} fill="url(#colorLate)" />
                    </AreaChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Don't Delay, Start Now"
            onPrimaryAction={() => toast({ title: "Redirecting", description: "Taking you to SIP platform." })}
            isCalculating={isCalculating}
        />
    );
};
