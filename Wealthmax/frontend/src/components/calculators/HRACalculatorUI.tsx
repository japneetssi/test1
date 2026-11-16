import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { calculateHRA } from "@/services/calculator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const HRACalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [basic, setBasic] = useState(600000);
    const [da, setDa] = useState(0);
    const [rentPaid, setRentPaid] = useState(200000);
    const [isMetro, setIsMetro] = useState(true);

    // Output State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const dBasic = useDebounce(basic, 500);
    const dDa = useDebounce(da, 500);
    const dRentPaid = useDebounce(rentPaid, 500);
    const dIsMetro = useDebounce(isMetro, 500);

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
                const res = await calculateHRA({
                    basic: dBasic,
                    da: dDa,
                    rentPaid: dRentPaid,
                    isMetro: dIsMetro
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
    }, [dBasic, dDa, dRentPaid, dIsMetro, toast]);

    const chartData = useMemo(() => {
        if (!result?.summary) return [];

        return [
            { name: "Rent Paid", amount: rentPaid },
            { name: "Exempt HRA", amount: result.summary.exemptAmountYearly },
            { name: "Taxable", amount: Math.max(0, rentPaid - result.summary.exemptAmountYearly) },
        ];
    }, [rentPaid, result]);

    return (
        <CalculatorLayout
            title="HRA Exemption Calculator"
            subtitle="Optimize your tax savings based on your rent payments."
            inputs={
                <>
                    <LinkedSlider label="Annual Basic Salary" min={200000} max={10000000} step={50000} value={basic} onChange={setBasic} prefix="₹" />
                    <LinkedSlider label="Annual Dearness Allowance (DA)" min={0} max={5000000} step={10000} value={da} onChange={setDa} prefix="₹" />
                    <LinkedSlider label="Annual Rent Paid" min={60000} max={2400000} step={12000} value={rentPaid} onChange={setRentPaid} prefix="₹" />

                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block">City Type</label>
                            <span className="text-xs text-slate-500">Metro cities allow up to 50% basic limit</span>
                        </div>
                        <div className="flex rounded-md shadow-sm" role="group">
                            <button
                                type="button"
                                onClick={() => setIsMetro(true)}
                                className={`px-4 py-2 text-sm font-medium border border-slate-200 rounded-l-lg hover:bg-slate-100 ${isMetro ? 'bg-[#00458c] text-white border-[#00458c] hover:bg-[#00458c]' : 'text-slate-700 bg-white inline-flex'}`}
                            >
                                Metro
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsMetro(false)}
                                className={`px-4 py-2 text-sm font-medium border border-l-0 border-slate-200 rounded-r-lg hover:bg-slate-100 ${!isMetro ? 'bg-[#00458c] text-white border-[#00458c] hover:bg-[#00458c]' : 'text-slate-700 bg-white inline-flex'}`}
                            >
                                Non-Metro
                            </button>
                        </div>
                    </div>
                </>
            }
            results={
                <>
                    <SummaryCard label="Tax Exempt HRA (Annual)" value={result?.summary ? formatINR(result.summary.exemptAmountYearly) : "Calculating..."} highlight />
                    <SummaryCard label="Monthly Exemption" value={result?.summary ? formatINR(result.summary.exemptAmountMonthly) : "Calculating..."} />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(val: number) => formatINR(val)} />
                        <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 1 ? '#00458c' : (index === 2 ? '#f37920' : '#94a3b8')} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Plan Tax Savings"
            onPrimaryAction={() => toast({ title: "Redirecting", description: "Taking you to ELSS platform." })}
            isCalculating={isCalculating}
        />
    );
};
