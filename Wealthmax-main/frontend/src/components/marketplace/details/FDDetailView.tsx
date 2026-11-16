import React, { useState } from 'react';
import { useInvestmentCart } from '@/contexts/InvestmentCartContext';
import { useToast } from '@/hooks/use-toast';
import { PiggyBank, Calculator, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const FDDetailView = ({ product }: { product: any }) => {
    const { addToCart } = useInvestmentCart();
    const { toast } = useToast();
    
    // Mock State for calculator
    const [investmentAmount, setInvestmentAmount] = useState(product.minSIP || 100000); // Default to product minSIP or 1 Lakh
    const [tenure, setTenure] = useState(product.defaultTenure || 3); // 3 Years
    const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);

    // Calculate mock Returns
    const baseRate = product.cagr3y || product.interestRate || 7.5; // Use product data or fixed mock rate
    const seniorRate = baseRate + 0.5;
    const applicableRate = isSeniorCitizen ? seniorRate : baseRate;
    
    // Compound interest calculation
    const amount = investmentAmount * Math.pow((1 + (applicableRate / 100) / 4), 4 * tenure);
    const returns = Math.round(amount - investmentAmount);

    const handleApply = () => {
        addToCart({
            id: product.id,
            name: product.name,
            amc: product.fundHouse || product.amc || 'Bank Partner',
            nav: investmentAmount 
        });
        toast({ title: "FD Initiated", description: `${product.name} added to cart.` });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-bl-full -z-10 opacity-50"></div>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                                <PiggyBank className="w-3 h-3" />
                                {product.category || 'Fixed Deposit'}
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                DICGC Insured
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1a365d] leading-tight mb-2">
                            {product.name}
                        </h1>
                        <p className="text-gray-500 font-medium">{product.fundHouse || product.amc || 'Premium Bank Partner'}</p>
                    </div>

                    <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                        <p className="text-sm text-gray-500 mb-1">Max Interest Rate</p>
                        <p className="text-3xl font-bold text-amber-600 tracking-tight flex items-end gap-1">
                            {seniorRate}% <span className="text-sm font-normal text-gray-400 mb-1">p.a.</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Left Column (Details & Features) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Key Terms */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">General Rate</p>
                            <p className="text-xl font-bold text-gray-900">{baseRate}%</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Senior Citizen</p>
                            <p className="text-xl font-bold text-gray-900">{seniorRate}%</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Lock-in</p>
                            <p className="text-xl font-bold text-gray-900">{product.lockIn || 'None'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Compounding</p>
                            <p className="text-xl font-bold text-gray-900">{product.compounding || 'Quarterly'}</p>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#1a365d] mb-6">FD Benefits</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {product.features && product.features.length > 0 ? (
                                product.features.map((feature: string, idx: number) => (
                                    <FeatureItem key={idx} text={feature} />
                                ))
                            ) : (
                                <>
                                    <FeatureItem text="Guaranteed Returns" />
                                    <FeatureItem text="Premature Withdrawal Available" />
                                    <FeatureItem text="Loan Against FD up to 90%" />
                                    <FeatureItem text="Insured up to ₹5 Lakhs by RBI" />
                                    <FeatureItem text="Auto-renewal Facility" />
                                    <FeatureItem text="No Account Opening Fee" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* About */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#1a365d] mb-4">About the Fixed Deposit</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            {product.description || 'Secure your savings with our high-yielding Fixed Deposit. Offering competitive interest rates, flexible tenure options, and guaranteed returns, it is the safest way to grow your wealth steadily without market risks.'}
                        </p>
                    </div>
                </div>

                {/* Right Column (Returns Calculator Widget) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-amber-900/5 border border-gray-100 p-6 sticky top-24">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Returns Calculator</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Amount Slider */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Investment Amount</label>
                                    <span className="font-bold text-gray-900">
                                        ₹{investmentAmount.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="10000" 
                                    max="5000000" 
                                    step="10000"
                                    value={investmentAmount} 
                                    onChange={(e) => setInvestmentAmount(parseInt(e.target.value))}
                                    className="w-full accent-amber-500"
                                />
                            </div>

                            {/* Tenure Slider */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Tenure</label>
                                    <span className="font-bold text-gray-900">{tenure} Years</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    value={tenure} 
                                    onChange={(e) => setTenure(parseInt(e.target.value))}
                                    className="w-full accent-amber-500"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>1 Yr</span>
                                    <span>10 Yrs</span>
                                </div>
                            </div>

                            {/* Senior Citizen Toggle */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-sm font-medium text-gray-700">Senior Citizen (60+ yrs)</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isSeniorCitizen} onChange={() => setIsSeniorCitizen(!isSeniorCitizen)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Total Interest</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                        +₹{returns.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Maturity Amount</p>
                                    <p className="text-xl font-bold text-[#1a365d]">
                                        ₹{Math.round(amount).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={handleApply}
                                className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-amber-200"
                            >
                                Invest Now <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ text }: { text: string }) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 text-amber-500 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
        </div>
        <p className="text-gray-700 font-medium text-sm">{text}</p>
    </div>
);
