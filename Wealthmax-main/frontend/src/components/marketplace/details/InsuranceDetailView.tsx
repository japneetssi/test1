import React, { useState } from 'react';
import { useInvestmentCart } from '@/contexts/InvestmentCartContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, HeartPulse, CheckCircle2, Calculator, Info, ArrowRight } from 'lucide-react';

export const InsuranceDetailView = ({ product }: { product: any }) => {
    const { addToCart } = useInvestmentCart();
    const { toast } = useToast();
    
    // Determine type (Health vs Term Life)
    const isHealth = product.category?.includes('Health');
    
    // Mock State for calculator
    const [age, setAge] = useState(30);
    const [coverAmount, setCoverAmount] = useState(product.defaultCover || 10000000);

    // Calculate mock premium based on age & cover
    const baseRate = isHealth ? 0.005 : 0.0008;
    const ageMultiplier = 1 + ((age - 18) * 0.03);
    const premium = Math.round(coverAmount * baseRate * ageMultiplier);

    const handleApply = () => {
        addToCart({
            id: product.id,
            name: product.name,
            amc: product.fundHouse || product.amc || 'Insurance Provider',
            nav: premium // Using NAV field to store premium cost for cart
        });
        toast({ title: "Plan Saved", description: `${product.name} premium calculation saved.` });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                                {isHealth ? <HeartPulse className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                {product.category || 'Insurance'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1a365d] leading-tight mb-2">
                            {product.name}
                        </h1>
                        <p className="text-gray-500 font-medium">{product.fundHouse || product.amc || 'Premium Insurance Provider'}</p>
                    </div>

                    <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                        <p className="text-sm text-gray-500 mb-1">Claim Settlement Ratio</p>
                        <p className="text-3xl font-bold text-emerald-600 tracking-tight flex items-end gap-1">
                            {product.claimSettlement || '99.2%'} <span className="text-sm font-normal text-gray-400 mb-1">Excellent</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Left Column (Details & Features) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Features List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#1a365d] mb-6">Key Benefits</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {product.features && product.features.length > 0 ? (
                                product.features.map((feature: string, idx: number) => (
                                    <FeatureItem key={idx} text={feature} />
                                ))
                            ) : (
                                <>
                                    <FeatureItem text="Comprehensive coverage" />
                                    <FeatureItem text="Easy claim process" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* About */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#1a365d] mb-4">About the Plan</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            {product.description || `This comprehensive ${isHealth ? 'health' : 'term life'} insurance plan is designed to provide maximum financial security to you and your loved ones. With industry-leading claim settlement ratios and a vast network of service providers, you can be assured of support when you need it most.`}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Network Hosp.</p>
                                <p className="text-xl font-bold text-gray-900">{product.networkHospitals || 'N/A'}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Entry Age</p>
                                <p className="text-xl font-bold text-gray-900">{product.entryAge || '18-65 Yrs'}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Coverage</p>
                                <p className="text-xl font-bold text-gray-900">{product.maxCoverage || 'Up to ₹1 Cr'}</p>
                            </div>
                            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                                <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Tax Benefit</p>
                                <p className="text-xl font-bold text-gray-900">{product.taxBenefit || (isHealth ? '80D' : '80C')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Premium Calculator Widget) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 p-6 sticky top-24">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Premium Calculator</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Age Slider */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Your Age</label>
                                    <span className="font-bold text-gray-900">{age} Years</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="18" 
                                    max="65" 
                                    value={age} 
                                    onChange={(e) => setAge(parseInt(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>18</span>
                                    <span>65</span>
                                </div>
                            </div>

                            {/* Cover Amount Slider */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Cover Amount</label>
                                    <span className="font-bold text-gray-900">
                                        ₹{(coverAmount / 100000).toFixed(0)} Lakhs
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min={isHealth ? 500000 : 5000000} 
                                    max={isHealth ? 10000000 : 50000000} 
                                    step={500000}
                                    value={coverAmount} 
                                    onChange={(e) => setCoverAmount(parseInt(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Estimated Yearly Premium</p>
                                <p className="text-3xl font-bold text-[#1a365d]">
                                    ₹{premium.toLocaleString('en-IN')}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Excl. 18% GST
                                </p>
                            </div>

                            <button 
                                onClick={handleApply}
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-blue-200"
                            >
                                Proceed to Buy <ArrowRight className="w-4 h-4" />
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
        <div className="mt-0.5 text-blue-600 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
        </div>
        <p className="text-gray-700 font-medium text-sm">{text}</p>
    </div>
);
