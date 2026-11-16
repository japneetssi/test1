import React, { useState } from 'react';
import { useInvestmentCart } from '@/contexts/InvestmentCartContext';
import { useToast } from '@/hooks/use-toast';
import { Landmark, Calculator, ArrowRight, Info, CheckCircle2 } from 'lucide-react';

export const LoanDetailView = ({ product }: { product: any }) => {
    const { addToCart } = useInvestmentCart();
    const { toast } = useToast();
    
    // Mock State for calculator
    const [loanAmount, setLoanAmount] = useState(product.defaultAmount || 1000000);
    const [tenure, setTenure] = useState(product.defaultTenure || 5);

    // EMI Calculation
    const interestRate = product.cagr3y || product.interestRate || 10.5; // Use product data or fixed mock rate
    const monthlyRate = (interestRate / 12) / 100;
    const months = tenure * 12;
    const emi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));

    const handleApply = () => {
        addToCart({
            id: product.id,
            name: product.name,
            amc: product.fundHouse || product.amc || 'Lending Partner',
            nav: emi // Storing calculated EMI in nav field for the cart
        });
        toast({ title: "Loan Application Saved", description: `Your application for ${product.name} is saved in cart.` });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full -z-10 opacity-50"></div>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                                <Landmark className="w-3 h-3" />
                                {product.category || 'Loan'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1a365d] leading-tight mb-2">
                            {product.name}
                        </h1>
                        <p className="text-gray-500 font-medium">{product.fundHouse || product.amc || 'Premium Lending Partner'}</p>
                    </div>

                    <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                        <p className="text-sm text-gray-500 mb-1">Interest Rate</p>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight flex items-end gap-1">
                            {interestRate}% <span className="text-sm font-normal text-gray-400 mb-1">p.a.</span>
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
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Max Tenure</p>
                            <p className="text-xl font-bold text-gray-900">{product.maxTenure || '7 Years'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Processing Fee</p>
                            <p className="text-xl font-bold text-gray-900">{product.processingFee || '1.5%'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Foreclosure</p>
                            <p className="text-xl font-bold text-emerald-600">{product.foreclosure || 'Zero'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Approval</p>
                            <p className="text-xl font-bold text-gray-900">{product.approvalTime || 'Instant'}</p>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#1a365d] mb-6">Loan Benefits</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {product.features && product.features.length > 0 ? (
                                product.features.map((feature: string, idx: number) => (
                                    <FeatureItem key={idx} text={feature} />
                                ))
                            ) : (
                                <>
                                    <FeatureItem text="100% Digital Process" />
                                    <FeatureItem text="No Pre-payment Charges" />
                                    <FeatureItem text="Disbursal in 24 Hours" />
                                    <FeatureItem text="Minimal Documentation" />
                                    <FeatureItem text="Flexible Repayment Options" />
                                    <FeatureItem text="Top-up Facility Available" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* About */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#1a365d] mb-4">About the Loan</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            {product.description || 'Get instant access to funds with our premium loan offering. Designed to meet your immediate financial requirements with competitive interest rates and flexible repayment terms. Experience a hassle-free digital application process.'}
                        </p>
                    </div>
                </div>

                {/* Right Column (EMI Calculator Widget) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-indigo-900/5 border border-gray-100 p-6 sticky top-24">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">EMI Calculator</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Amount Slider */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Loan Amount</label>
                                    <span className="font-bold text-gray-900">
                                        ₹{(loanAmount / 100000).toFixed(0)} Lakhs
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="50000" 
                                    max="5000000" 
                                    step="50000"
                                    value={loanAmount} 
                                    onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                                    className="w-full accent-indigo-600"
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
                                    max="7" 
                                    value={tenure} 
                                    onChange={(e) => setTenure(parseInt(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>1 Yr</span>
                                    <span>7 Yrs</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Your Monthly EMI</p>
                                <p className="text-3xl font-bold text-[#1a365d]">
                                    ₹{emi.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Principal + Interest
                                </p>
                            </div>

                            <button 
                                onClick={handleApply}
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-indigo-200"
                            >
                                Apply Now <ArrowRight className="w-4 h-4" />
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
        <div className="mt-0.5 text-indigo-600 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
        </div>
        <p className="text-gray-700 font-medium text-sm">{text}</p>
    </div>
);
