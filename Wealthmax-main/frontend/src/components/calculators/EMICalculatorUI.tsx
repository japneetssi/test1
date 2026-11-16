import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { calculateEMI } from "@/services/calculator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const EMICalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [loanAmount, setLoanAmount] = useState(2000000);
    const [interestRate, setInterestRate] = useState(8.5);
    const [tenureYears, setTenureYears] = useState(20);

    // Output State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const dLoanAmount = useDebounce(loanAmount, 500);
    const dInterestRate = useDebounce(interestRate, 500);
    const dTenureYears = useDebounce(tenureYears, 500);

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
                const res = await calculateEMI({
                    loanAmount: dLoanAmount,
                    interestRate: dInterestRate,
                    tenureYears: dTenureYears
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
    }, [dLoanAmount, dInterestRate, dTenureYears, toast]);

    const chartData = useMemo(() => {
        const data: { year: string; balance: number; principalPaid: number; interestPaid: number; }[] = [];
        if (!result?.summary) return data;

        // Detailed amortization schedule using summary data
        let balance = loanAmount;
        const emi = result.summary.monthlyEMI;
        const monthlyRate = interestRate / 100 / 12;

        for (let y = 1; y <= tenureYears; y++) {
            let principalPaidYear = 0;
            let interestPaidYear = 0;

            for (let m = 1; m <= 12; m++) {
                const interestPaid = balance * monthlyRate;
                const principalPaid = emi - interestPaid;
                balance -= principalPaid;
                principalPaidYear += principalPaid;
                interestPaidYear += interestPaid;
            }

            data.push({
                year: `Yr ${y}`,
                balance: Math.max(0, Math.round(balance)),
                principalPaid: Math.round(principalPaidYear),
                interestPaid: Math.round(interestPaidYear)
            });
        }
        return data;
    }, [result, loanAmount, tenureYears, interestRate]);

    return (
        <CalculatorLayout
            title="EMI & Tax Planner"
            subtitle="Plan your EMIs and map out your interest vs principal repayment."
            inputs={
                <>
                    <LinkedSlider label="Loan Amount" min={100000} max={20000000} step={100000} value={loanAmount} onChange={setLoanAmount} prefix="₹" />
                    <LinkedSlider label="Interest Rate" min={5} max={20} step={0.1} value={interestRate} onChange={setInterestRate} suffix="%" />
                    <LinkedSlider label="Loan Tenure" min={1} max={30} step={1} value={tenureYears} onChange={setTenureYears} suffix=" Yrs" />
                </>
            }
            results={
                <>
                    <SummaryCard label="Equated Monthly Installment (EMI)" value={result?.summary ? formatINR(result.summary.monthlyEMI) : "Calculating..."} highlight />
                    <SummaryCard label="Total Interest Payable" value={result?.summary ? formatINR(result.summary.totalInterest) : "Calculating..."} />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00458c" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#00458c" stopOpacity={0.2} />
                            </linearGradient>
                            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f37920" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f37920" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(val: number) => formatINR(val)} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        {/* Stacked area representing yearly breakdown */}
                        <Area type="monotone" dataKey="principalPaid" stackId="1" name="Principal Component" stroke="#00458c" strokeWidth={2} fillOpacity={1} fill="url(#colorPrincipal)" />
                        <Area type="monotone" dataKey="interestPaid" stackId="1" name="Interest Component" stroke="#f37920" strokeWidth={2} fillOpacity={1} fill="url(#colorInterest)" />
                    </AreaChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Apply for Loan"
            onPrimaryAction={() => toast({ title: "Redirecting", description: "Taking you to Loan Application." })}
            isCalculating={isCalculating}
        />
    );
};
