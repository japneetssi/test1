import { useState, useMemo, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { calculateCAGR } from "@/services/calculator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const CAGRCalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [startValue, setStartValue] = useState(100000);
    const [endValue, setEndValue] = useState(250000);
    const [years, setYears] = useState(5);

    // Output State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Debounce inputs
    const dStartValue = useDebounce(startValue, 500);
    const dEndValue = useDebounce(endValue, 500);
    const dYears = useDebounce(years, 500);

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
                const res = await calculateCAGR({
                    startValue: dStartValue,
                    endValue: dEndValue,
                    years: dYears
                });
                if (isMounted) setResult(res);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (isMounted) toast({
                    title: "Calculation Failed",
                    description: err.message || "Something went wrong",
                    variant: "destructive"
                });
            } finally {
                if (isMounted) setIsCalculating(false);
            }
        };

        fetchResults();
        return () => { isMounted = false; };
    }, [dStartValue, dEndValue, dYears, toast]);

    const chartData = useMemo(() => {
        if (!result?.chartData) return [];
        return result.chartData.map((d: any) => ({
            year: `Yr ${d.year}`,
            value: d.value
        }));
    }, [result]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-slate-800 mb-2">{label}</p>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00458c]" />
                        <span className="text-slate-600">Value:</span>
                        <span className="font-bold text-[#f37920]">{formatINR(payload[0].value)}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <CalculatorLayout
            title="CAGR Calculator"
            subtitle="Calculate the compounded annual growth rate of your investments."
            inputs={
                <>
                    <LinkedSlider label="Initial Investment" min={1000} max={10000000} step={1000} value={startValue} onChange={setStartValue} prefix="₹" />
                    <LinkedSlider label="Final Value" min={1000} max={50000000} step={1000} value={endValue} onChange={setEndValue} prefix="₹" />
                    <LinkedSlider label="Time Period" min={1} max={40} step={1} value={years} onChange={setYears} suffix=" Yrs" />
                </>
            }
            results={
                <>
                    <SummaryCard label="CAGR (%)" value={result?.summary ? `${result.summary.cagr}%` : "..."} highlight />
                    <SummaryCard label="Absolute Return" value={result?.summary ? formatINR(result.summary.absoluteReturn) : "..."} />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00458c" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#00458c" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" name="Investment Value" stroke="#00458c" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Analyze Portfolio Performance"
            onPrimaryAction={() => toast({ title: "Analysis Tool", description: "Calculating portfolio metrics based on CAGR." })}
            isCalculating={isCalculating}
        />
    );
};
