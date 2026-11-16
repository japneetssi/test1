import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalculatorLayout, SummaryCard } from "./CalculatorLayout";
import { LinkedSlider } from "./LinkedSlider";
import { calculateHomeAffordability } from "@/services/calculator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export const HomeAffordabilityCalculatorUI = () => {
    const { toast } = useToast();

    // Input State
    const [monthlyIncome, setMonthlyIncome] = useState(150000);
    const [existingEMI, setExistingEMI] = useState(20000);
    const [interestRate, setInterestRate] = useState(8.5);
    const [tenureYears, setTenureYears] = useState(20);

    // Output State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const dMonthlyIncome = useDebounce(monthlyIncome, 500);
    const dExistingEMI = useDebounce(existingEMI, 500);
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
                const res = await calculateHomeAffordability({
                    monthlyIncome: dMonthlyIncome,
                    existingEMI: dExistingEMI,
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
    }, [dMonthlyIncome, dExistingEMI, dInterestRate, dTenureYears, toast]);

    const chartData = useMemo(() => {
        const data: { year: string; balance: number; paidToDate: number }[] = [];
        if (!result?.summary) return data;

        // Repayment schedule visualization using backend summary
        const loanAmt = result.summary.loanEligible;
        const maxEMI = result.summary.maxMonthlyEMI;
        let balance = loanAmt;

        const monthlyRate = interestRate / 100 / 12;

        for (let y = 1; y <= tenureYears; y++) {
            for (let m = 1; m <= 12; m++) {
                const interestPaid = balance * monthlyRate;
                const principalPaid = maxEMI - interestPaid;
                balance -= principalPaid;
                if (balance < 0) balance = 0;
            }

            data.push({
                year: `Yr ${y}`,
                balance: Math.round(balance),
                paidToDate: Math.round((y * 12 * maxEMI)),
            });
        }
        return data;
    }, [result, tenureYears, interestRate]);

    return (
        <CalculatorLayout
            title="Home Affordability Calculator"
            subtitle="Find out the maximum property value you can afford based on your income."
            inputs={
                <>
                    <LinkedSlider label="Net Monthly Income" min={30000} max={2000000} step={10000} value={monthlyIncome} onChange={setMonthlyIncome} prefix="₹" />
                    <LinkedSlider label="Existing Monthly EMIs" min={0} max={1000000} step={5000} value={existingEMI} onChange={setExistingEMI} prefix="₹" />
                    <LinkedSlider label="Home Loan Interest Rate" min={6} max={15} step={0.1} value={interestRate} onChange={setInterestRate} suffix="%" />
                    <LinkedSlider label="Loan Tenure" min={5} max={30} step={1} value={tenureYears} onChange={setTenureYears} suffix=" Yrs" />
                </>
            }
            results={
                <>
                    <SummaryCard label="Max Property Value" value={result?.summary ? formatINR(result.summary.loanEligible * 1.2) : "Calculating..."} highlight />
                    <SummaryCard label="Eligible Loan Amount" value={result?.summary ? formatINR(result.summary.loanEligible) : "Calculating..."} />
                </>
            }
            chart={
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00458c" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#00458c" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={formatINR} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} formatter={(val: number) => formatINR(val)} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="balance" name="Remaining Principal" stroke="#00458c" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                </ResponsiveContainer>
            }
            primaryActionLabel="Apply for Home Loan"
            onPrimaryAction={() => toast({ title: "Redirecting", description: "Taking you to Home Loan offers." })}
            isCalculating={isCalculating}
        />
    );
};
