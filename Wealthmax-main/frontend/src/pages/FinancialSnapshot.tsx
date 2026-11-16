import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Trash2, Plus } from "lucide-react";
import logo from "@/assets/wealthmax-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import api from "@/lib/api";

// Utility for formatting numbers in Indian Rupee format (e.g., 15,00,000)
const formatINR = (val: string) => {
    const numeric = val.replace(/[^0-9]/g, "");
    if (!numeric) return "";
    return Number(numeric).toLocaleString("en-IN");
};

// Utility to parse back to raw number
const parseINR = (val: string | number) => {
    if (val === undefined || val === null) return "0";
    return val.toString().replace(/[^0-9]/g, "");
};

export default function FinancialSnapshot() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        dob: "",
        dependents: "0",
        occupation: "Salaried Professional",
        maritalStatus: "Single",
        pan_number: "",
        gross_income: "0",
        additional_income: "0",
        monthly_household_expenses: "0",
        monthly_obligations: "0",
        emergency_fund_amount: "0",
        income_details: [] as { source: string; amount: string; frequency: string }[],
        expense_details: [] as { source: string; amount: string; frequency: string }[],
        asset_details: [
            { category: 'Financial', type: 'Individual stocks', amount: '' },
            { category: 'Financial', type: 'Mutual funds', amount: '' },
            { category: 'Financial', type: 'Individual bonds', amount: '' },
            { category: 'Physical', type: 'Real Estate', amount: '' },
            { category: 'Financial', type: 'Cash & Cash Equivalents', amount: '' },
            { category: 'Physical', type: 'Commodities', amount: '' },
        ] as { category: string; type: string; amount: string }[],
        liability_details: [
            { type: 'Home Loan', amount: '', emi: '' },
            { type: 'Personal Loan', amount: '', emi: '' },
            { type: 'Car Loan', amount: '', emi: '' },
            { type: 'Credit Card', amount: '', emi: '' }
        ] as { type: string; amount: string; emi: string }[],
        safety_net_details: [] as { type: string; premium: string; amount: string }[],
        dependent_details: [] as { name: string; age: string; income: string }[],
        goal_details: [] as { name: string; target_amount: string; years_away: string; priority: string; category: string; current_amount: string }[]
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/profile');
                if (data?.data) {
                    const p = data.data;
                    const m = p.modularData || {};
                    setFormData(prev => ({
                        ...prev,
                        dob: (() => {
                            if (!p.dob) return "";
                            const d = new Date(p.dob);
                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        })(),
                        dependents: p.dependents?.toString() || "0",
                        occupation: p.occupation || prev.occupation,
                        maritalStatus: p.marital_status || prev.maritalStatus,
                        pan_number: p.pan_number || "",
                        gross_income: p.gross_income ? formatINR(p.gross_income.toString()) : "0",
                        additional_income: p.other_income ? formatINR(p.other_income.toString()) : "0",
                        monthly_household_expenses: p.fixed_expenses ? formatINR(p.fixed_expenses.toString()) : "0",
                        monthly_obligations: p.liabilities_emi ? formatINR(p.liabilities_emi.toString()) : "0",
                        emergency_fund_amount: m.safetyNet?.emergency_fund_amount ? formatINR(m.safetyNet.emergency_fund_amount.toString()) : "0",
                        income_details: m.income && m.income.length > 0 ? m.income : prev.income_details,
                        expense_details: m.expenses && m.expenses.length > 0 ? m.expenses : prev.expense_details,
                        asset_details: m.assets && m.assets.length > 0 ? m.assets : prev.asset_details,
                        liability_details: m.liabilities && m.liabilities.length > 0 ? m.liabilities : prev.liability_details,
                        safety_net_details: m.safetyNet?.insurance && m.safetyNet.insurance.length > 0 ? m.safetyNet.insurance : prev.safety_net_details,
                        dependent_details: m.safetyNet?.dependents && m.safetyNet.dependents.length > 0 ? m.safetyNet.dependents : prev.dependent_details,
                        goal_details: m.goals && m.goals.length > 0 ? m.goals : prev.goal_details,
                    }));
                }
            } catch (error) {
                console.error("Failed to load profile for snapshot", error);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (field: string, value: string) => {
        if (["dob", "occupation", "maritalStatus", "pan_number", "dependents"].includes(field)) {
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({ ...prev, [field]: formatINR(value) }));
        }
    };

    const addArrayItem = (key: string, defaultItem: any) => {
        setFormData(prev => ({ ...prev, [key]: [...(prev as any)[key], defaultItem] }));
    };

    const updateArrayItem = (key: string, index: number, field: string, value: string) => {
        setFormData(prev => {
            const arr = [...(prev as any)[key]];
            if (field === 'amount' || field === 'emi' || field === 'premium' || field === 'income') {
                arr[index][field] = formatINR(value);
            } else {
                arr[index][field] = value;
            }
            return { ...prev, [key]: arr };
        });
    };

    const removeArrayItem = (key: string, index: number) => {
        setFormData(prev => {
            const arr = [...(prev as any)[key]];
            arr.splice(index, 1);
            return { ...prev, [key]: arr };
        });
    };

    const normalizeToAnnual = (amount: number, freq: string) => {
        if (freq === 'Monthly') return amount * 12;
        if (freq === 'Quarterly') return amount * 4;
        if (freq === 'Daily') return amount * 365;
        return amount; // Annually
    };

    const normalizeToMonthly = (amount: number, freq: string) => {
        if (freq === 'Annually') return amount / 12;
        if (freq === 'Quarterly') return amount / 3;
        if (freq === 'Daily') return amount * 30; // Approx
        return amount; // Monthly
    };

    const normalizeExpensesToMonthly = (amount: number, freq: string) => {
        if (freq === 'Annually') return amount / 12;
        // FIX (audit #16): a quarter has 3 months — dividing by 4 deflated
        // monthly expenses by 25%.
        if (freq === 'Quarterly') return amount / 3;
        if (freq === 'Daily') return amount * 30;
        return amount / 1; // Monthly
    };

    // Calculate totals for UI display
    const calculateTotal = (arr: any[], field: string) => {
        return arr.reduce((acc, item) => acc + (Number(parseINR(item[field] || '0'))), 0);
    };

    const totalAssets = calculateTotal(formData.asset_details, 'amount');
    const totalLiabilities = calculateTotal(formData.liability_details, 'amount');
    const totalEMI = calculateTotal(formData.liability_details, 'emi');
    const calculatedGrossIncome = formData.income_details.reduce((sum, item) => sum + normalizeToAnnual(Number(parseINR(item.amount || '0')), item.frequency || 'Monthly'), 0) + Number(parseINR(formData.additional_income || '0'));
    const calculatedExpenses = formData.expense_details.reduce((sum, item) => sum + normalizeExpensesToMonthly(Number(parseINR(item.amount || '0')), item.frequency || 'Monthly'), 0);

    useEffect(() => {
        if (formData.income_details.length > 0) {
            const calculatedGross = formData.income_details.reduce((sum, item) => sum + normalizeToAnnual(Number(parseINR(item.amount || '0')), item.frequency || 'Monthly'), 0) + Number(parseINR(formData.additional_income || '0'));
            setFormData(prev => ({ ...prev, gross_income: formatINR(calculatedGross.toString()) }));
        }
    }, [formData.income_details, formData.additional_income]);

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();

        // Bundle the detailed modular data
        const snapshotData = {
            dob: formData.dob,
            dependents: formData.dependents,
            occupation: formData.occupation,
            marital_status: formData.maritalStatus,
            pan_number: formData.pan_number,
            gross_income: Number(parseINR(formData.gross_income || '0')),
            additional_income: Number(parseINR(formData.additional_income)),
            monthly_household_expenses: calculatedExpenses,
            monthly_obligations: totalEMI,
            emergency_fund_amount: Number(parseINR(formData.emergency_fund_amount)),
            
            // Format arrays back to raw numbers
            income_details: formData.income_details.map(i => ({...i, amount: Number(parseINR(i.amount))})),
            expense_details: formData.expense_details.map(e => ({...e, amount: Number(parseINR(e.amount))})),
            asset_details: formData.asset_details.map(a => ({...a, amount: Number(parseINR(a.amount))})),
            liability_details: formData.liability_details.map(l => ({...l, amount: Number(parseINR(l.amount)), emi: Number(parseINR(l.emi))})),
            safety_net_details: formData.safety_net_details.map(s => ({...s, premium: Number(parseINR(s.premium)), amount: Number(parseINR(s.amount))})),
            dependent_details: formData.dependent_details.map(d => ({...d, age: Number(d.age), income: Number(parseINR(d.income))})),
            goal_details: formData.goal_details.map(g => ({...g, target_amount: Number(parseINR(g.target_amount)), current_amount: Number(parseINR(g.current_amount)), years_away: Number(g.years_away)})),
        };

        // Pass data forward to Step 2 (Risk Profiling)
        navigate("/survey", { state: { snapshotData, retake: true } });
    };

    return (
        <div className="min-h-[calc(100vh-52px)] bg-gray-50 flex flex-col font-sans text-[#1d1d1f]">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm sticky top-[52px] z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <OptimizedImage src={logo} alt="WealthMax" className="h-7 w-7 rounded object-cover" />
                        <span className="text-[#00458c] font-bold text-lg hidden sm:inline">WealthMax</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#00458c]">Step 1 of 2</span>
                        <span className="text-sm text-gray-500">Your Detailed Financial Baseline</span>
                        <div className="flex gap-1 ml-2">
                            <div className="w-8 h-1.5 bg-[#f37920] rounded-full" />
                            <div className="w-8 h-1.5 bg-gray-200 rounded-full" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl shadow-[#00458c]/5 border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-12">
                        <div className="mb-10 text-center">
                            <h1 className="text-3xl font-extrabold text-[#00458c] mb-3">Hi, {user?.full_name?.split(' ')[0] || "there"} 👋</h1>
                            <p className="text-gray-500 text-lg">Let's build your detailed financial snapshot to personalize your experience.</p>
                        </div>

                        <form onSubmit={handleNext} className="space-y-12">
                            {/* Section 1: Personal Profile */}
                            <div>
                                <h2 className="text-xl font-bold text-[#00458c] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-[#00458c] text-white flex items-center justify-center text-sm">1</span>
                                    Personal Profile
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Occupation</label>
                                        <select
                                            value={formData.occupation}
                                            onChange={(e) => handleChange("occupation", e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:border-[#f37920] outline-none transition-all bg-white"
                                        >
                                            <option>Salaried Professional</option>
                                            <option>Business / Investor</option>
                                            <option>Self-Employed / Freelancer</option>
                                            <option>Retired</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Marital Status</label>
                                        <select
                                            value={formData.maritalStatus}
                                            onChange={(e) => handleChange("maritalStatus", e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:border-[#f37920] outline-none transition-all bg-white"
                                        >
                                            <option>Single</option>
                                            <option>Married</option>
                                            <option>Divorced / Widowed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.dob}
                                            onChange={(e) => handleChange("dob", e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:border-[#f37920] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">PAN Number</label>
                                        <input
                                            type="text"
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                            value={formData.pan_number}
                                            onChange={(e) => handleChange("pan_number", e.target.value.toUpperCase())}
                                            className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:border-[#f37920] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Number of Dependents</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 2"
                                            value={formData.dependents}
                                            onChange={(e) => handleChange("dependents", e.target.value)}
                                            className="w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:border-[#f37920] outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Income Details */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#00458c] flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-[#00458c] text-white flex items-center justify-center text-sm">2</span>
                                        Income Details
                                    </h2>
                                    <button type="button" onClick={() => addArrayItem('income_details', { source: '', amount: '', frequency: 'Monthly' })} className="text-sm font-semibold text-[#f37920] flex items-center gap-1 hover:underline">
                                        <Plus className="w-4 h-4" /> Add Income
                                    </button>
                                </div>
                                <div className="space-y-4 mb-6">
                                    {formData.income_details.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Source</label>
                                                <input type="text" value={item.source} onChange={(e) => updateArrayItem('income_details', idx, 'source', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="e.g. Salary" required />
                                            </div>
                                            <div className="flex-1 relative">
                                                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                                                <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                <input type="text" value={item.amount} onChange={(e) => updateArrayItem('income_details', idx, 'amount', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" required />
                                            </div>
                                            <div className="flex-[0.8]">
                                                <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                                                <select value={item.frequency} onChange={(e) => updateArrayItem('income_details', idx, 'frequency', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none bg-white">
                                                    <option value="Daily">Daily</option>
                                                    <option value="Monthly">Monthly</option>
                                                    <option value="Quarterly">Quarterly</option>
                                                    <option value="Annually">Annually</option>
                                                </select>
                                            </div>
                                            <button type="button" onClick={() => removeArrayItem('income_details', idx)} className="mt-6 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Additional Income (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                            <input type="text" value={formData.additional_income} onChange={(e) => handleChange("additional_income", e.target.value)} className="w-full h-12 pl-8 pr-4 rounded-xl border border-gray-200 text-base focus:border-[#f37920] outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Gross Annual Income</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                            <input type="text" value={formData.gross_income} onChange={(e) => handleChange("gross_income", e.target.value)} className="w-full h-12 pl-8 pr-4 rounded-xl border border-blue-200 bg-white text-[#00458c] font-bold text-lg focus:border-[#f37920] outline-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Expenses */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#00458c] flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-[#00458c] text-white flex items-center justify-center text-sm">3</span>
                                        Expense Details
                                    </h2>
                                    <button type="button" onClick={() => addArrayItem('expense_details', { source: '', amount: '', frequency: 'Monthly' })} className="text-sm font-semibold text-[#f37920] flex items-center gap-1 hover:underline">
                                        <Plus className="w-4 h-4" /> Add Expense
                                    </button>
                                </div>
                                <div className="space-y-4 mb-6">
                                    {formData.expense_details.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Source</label>
                                                <input type="text" value={item.source} onChange={(e) => updateArrayItem('expense_details', idx, 'source', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="e.g. Groceries" required />
                                            </div>
                                            <div className="flex-1 relative">
                                                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                                                <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                <input type="text" value={item.amount} onChange={(e) => updateArrayItem('expense_details', idx, 'amount', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" required />
                                            </div>
                                            <div className="flex-[0.8]">
                                                <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                                                <select value={item.frequency} onChange={(e) => updateArrayItem('expense_details', idx, 'frequency', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none bg-white">
                                                    <option value="Daily">Daily</option>
                                                    <option value="Monthly">Monthly</option>
                                                    <option value="Quarterly">Quarterly</option>
                                                    <option value="Annually">Annually</option>
                                                </select>
                                            </div>
                                            <button type="button" onClick={() => removeArrayItem('expense_details', idx)} className="mt-6 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Calculated Monthly Expenses</label>
                                        <div className="h-12 flex items-center px-4 rounded-xl border border-blue-200 bg-white text-red-600 font-bold text-lg">
                                            ₹ {calculatedExpenses.toLocaleString("en-IN")}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Calculated Total EMI</label>
                                        <div className="h-12 flex items-center px-4 rounded-xl border border-blue-200 bg-white text-red-600 font-bold text-lg">
                                            ₹ {totalEMI.toLocaleString("en-IN")}
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">(Derived from Liabilities)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Assets */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#00458c] flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-[#00458c] text-white flex items-center justify-center text-sm">4</span>
                                        Assets Breakdown
                                    </h2>
                                    <button type="button" onClick={() => addArrayItem('asset_details', { category: 'Financial', type: 'Bank Balance', amount: '' })} className="text-sm font-semibold text-[#f37920] flex items-center gap-1 hover:underline">
                                        <Plus className="w-4 h-4" /> Add Asset
                                    </button>
                                </div>
                                <div className="space-y-4 mb-6">
                                    {formData.asset_details.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Category</label>
                                                <select value={item.category} onChange={(e) => updateArrayItem('asset_details', idx, 'category', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none bg-white">
                                                    <option>Financial</option>
                                                    <option>Physical</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div className="flex-[1.5]">
                                                <label className="block text-xs text-gray-500 mb-1">Type/Name</label>
                                                <select value={item.type} onChange={(e) => updateArrayItem('asset_details', idx, 'type', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none bg-white" required>
                                                    <option value="" disabled>Select Type</option>
                                                    <option value="Individual stocks">Individual stocks</option>
                                                    <option value="Individual bonds">Individual bonds</option>
                                                    <option value="Mutual funds">Mutual funds</option>
                                                    <option value="ETFs">ETFs</option>
                                                    <option value="Index funds">Index funds</option>
                                                    <option value="REITs">REITs</option>
                                                    <option value="Certificates of Deposit (CDs)">Certificates of Deposit (CDs)</option>
                                                    <option value="Options and futures">Options and futures</option>
                                                    <option value="Annuities">Annuities</option>
                                                    <option value="Cash & Cash Equivalents">Cash & Cash Equivalents</option>
                                                    <option value="Real Estate">Real Estate</option>
                                                    <option value="Commodities">Commodities</option>
                                                    <option value="Alternatives">Alternatives</option>
                                                </select>
                                            </div>
                                            <div className="flex-1 relative">
                                                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                                                <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                <input type="text" value={item.amount} onChange={(e) => updateArrayItem('asset_details', idx, 'amount', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" required />
                                            </div>
                                            <button type="button" onClick={() => removeArrayItem('asset_details', idx)} className="mt-6 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-green-800 uppercase tracking-wide">Total Net Worth (Assets)</span>
                                    <span className="text-xl font-bold text-green-700">₹ {totalAssets.toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            {/* Section 5: Liabilities */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#00458c] flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-[#00458c] text-white flex items-center justify-center text-sm">5</span>
                                        Liabilities Details
                                    </h2>
                                    <button type="button" onClick={() => addArrayItem('liability_details', { type: 'Home Loan', amount: '', emi: '' })} className="text-sm font-semibold text-[#f37920] flex items-center gap-1 hover:underline">
                                        <Plus className="w-4 h-4" /> Add Liability
                                    </button>
                                </div>
                                <div className="space-y-4 mb-6">
                                    {formData.liability_details.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex-[1.2]">
                                                <label className="block text-xs text-gray-500 mb-1">Type</label>
                                                <select value={item.type} onChange={(e) => updateArrayItem('liability_details', idx, 'type', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none bg-white">
                                                    <option>Home Loan</option>
                                                    <option>Personal Loan</option>
                                                    <option>Car Loan</option>
                                                    <option>Credit Card</option>
                                                    <option>Business Loan</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div className="flex-1 relative">
                                                <label className="block text-xs text-gray-500 mb-1">O/S Amount</label>
                                                <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                <input type="text" value={item.amount} onChange={(e) => updateArrayItem('liability_details', idx, 'amount', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" required />
                                            </div>
                                            <div className="flex-1 relative">
                                                <label className="block text-xs text-gray-500 mb-1">Monthly EMI</label>
                                                <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                <input type="text" value={item.emi} onChange={(e) => updateArrayItem('liability_details', idx, 'emi', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" required />
                                            </div>
                                            <button type="button" onClick={() => removeArrayItem('liability_details', idx)} className="mt-6 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-red-800 uppercase tracking-wide">Total Liabilities</span>
                                    <span className="text-xl font-bold text-red-700">₹ {totalLiabilities.toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            {/* Section 6: Safety Net */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#00458c] flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-[#00458c] text-white flex items-center justify-center text-sm">6</span>
                                        Safety Net & Insurance
                                    </h2>
                                    <button type="button" onClick={() => addArrayItem('safety_net_details', { type: 'Life/Term Insurance', premium: '', amount: '' })} className="text-sm font-semibold text-[#f37920] flex items-center gap-1 hover:underline">
                                        <Plus className="w-4 h-4" /> Add Insurance
                                    </button>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-[#00458c] text-xs font-bold uppercase mb-2">Dedicated Emergency Fund (₹)</label>
                                    <div className="relative max-w-sm">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                        <input type="text" value={formData.emergency_fund_amount} onChange={(e) => handleChange("emergency_fund_amount", e.target.value)} className="w-full h-12 pl-8 pr-4 rounded-xl border border-gray-200 text-base focus:border-[#f37920] outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {formData.safety_net_details.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex-[1.2]">
                                                <label className="block text-xs text-gray-500 mb-1">Type</label>
                                                <select value={item.type} onChange={(e) => updateArrayItem('safety_net_details', idx, 'type', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none bg-white">
                                                    <option>Life/Term Insurance</option>
                                                    <option>Health Insurance</option>
                                                    <option>General Insurance</option>
                                                </select>
                                            </div>
                                            <div className="flex-1 relative">
                                                <label className="block text-xs text-gray-500 mb-1">Premium</label>
                                                <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                <input type="text" value={item.premium} onChange={(e) => updateArrayItem('safety_net_details', idx, 'premium', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="Yearly" required />
                                            </div>
                                            <div className="flex-1 relative">
                                                <label className="block text-xs text-gray-500 mb-1">Coverage</label>
                                                <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                <input type="text" value={item.amount} onChange={(e) => updateArrayItem('safety_net_details', idx, 'amount', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" required />
                                            </div>
                                            <button type="button" onClick={() => removeArrayItem('safety_net_details', idx)} className="mt-6 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 7: Dependents Data */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#00458c] flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-[#00458c] text-white flex items-center justify-center text-sm">7</span>
                                        Dependents Details
                                    </h2>
                                    <button type="button" onClick={() => addArrayItem('dependent_details', { name: '', age: '', income: '' })} className="text-sm font-semibold text-[#f37920] flex items-center gap-1 hover:underline">
                                        <Plus className="w-4 h-4" /> Add Dependent
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {formData.dependent_details.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex-[1.5]">
                                                <label className="block text-xs text-gray-500 mb-1">Name</label>
                                                <input type="text" value={item.name} onChange={(e) => updateArrayItem('dependent_details', idx, 'name', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="Dependent Name" required />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Age</label>
                                                <input type="number" value={item.age} onChange={(e) => updateArrayItem('dependent_details', idx, 'age', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="Age" required />
                                            </div>
                                            <div className="flex-[1.5] relative">
                                                <label className="block text-xs text-gray-500 mb-1">Income</label>
                                                <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                <input type="text" value={item.income} onChange={(e) => updateArrayItem('dependent_details', idx, 'income', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="Yearly" />
                                            </div>
                                            <button type="button" onClick={() => removeArrayItem('dependent_details', idx)} className="mt-6 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 8: Goals Details */}
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-[#00458c] flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-[#00458c] text-white flex items-center justify-center text-sm">8</span>
                                        Financial Goals Details
                                    </h2>
                                    <button type="button" onClick={() => addArrayItem('goal_details', { name: '', target_amount: '', years_away: '', priority: 'High', category: 'Retirement goal', current_amount: '' })} className="text-sm font-semibold text-[#f37920] flex items-center gap-1 hover:underline">
                                        <Plus className="w-4 h-4" /> Add Goal
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {formData.goal_details.map((item, idx) => (
                                        <div key={idx} className="flex flex-col gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50 relative">
                                            <button type="button" onClick={() => removeArrayItem('goal_details', idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            
                                            <div className="flex gap-4">
                                                <div className="flex-[1.5]">
                                                    <label className="block text-xs text-gray-500 mb-1">Goal Name</label>
                                                    <input type="text" value={item.name} onChange={(e) => updateArrayItem('goal_details', idx, 'name', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="e.g. Dream Home" required />
                                                </div>
                                                <div className="flex-1 relative">
                                                    <label className="block text-xs text-gray-500 mb-1">Target Amount</label>
                                                    <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                    <input type="text" value={item.target_amount} onChange={(e) => updateArrayItem('goal_details', idx, 'target_amount', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="Amount" required />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500 mb-1">Years Away</label>
                                                    <input type="number" value={item.years_away} onChange={(e) => updateArrayItem('goal_details', idx, 'years_away', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="e.g. 5" required />
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-4">
                                                <div className="flex-1 relative">
                                                    <label className="block text-xs text-gray-500 mb-1">Current Saved</label>
                                                    <span className="absolute left-3 top-[26px] text-gray-400 text-sm">₹</span>
                                                    <input type="text" value={item.current_amount} onChange={(e) => updateArrayItem('goal_details', idx, 'current_amount', e.target.value)} className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none" placeholder="Amount" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-gray-500 mb-1">Priority</label>
                                                    <select value={item.priority} onChange={(e) => updateArrayItem('goal_details', idx, 'priority', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none bg-white">
                                                        <option>High</option>
                                                        <option>Medium</option>
                                                        <option>Low</option>
                                                    </select>
                                                </div>
                                                <div className="flex-[1.5]">
                                                    <label className="block text-xs text-gray-500 mb-1">Category</label>
                                                    <select value={item.category} onChange={(e) => updateArrayItem('goal_details', idx, 'category', e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-[#f37920] outline-none bg-white">
                                                        <option value="Retirement goal">Retirement</option>
                                                        <option value="Home purchase">Home Purchase</option>
                                                        <option value="Child education">Child Education</option>
                                                        <option value="Vehicle purchase">Vehicle Purchase</option>
                                                        <option value="Vacation">Vacation</option>
                                                        <option value="Wedding goal">Wedding</option>
                                                        <option value="Business funds">Business Funds</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-12 flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-[#f37920] hover:bg-[#e06b18] text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-[#f37920]/20 transition-all hover:shadow-xl flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                >
                                    Proceed to Risk Analysis <ArrowRight className="h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
