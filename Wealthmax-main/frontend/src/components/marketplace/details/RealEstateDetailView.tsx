import React, { useState } from 'react';
import { useInvestmentCart } from '@/contexts/InvestmentCartContext';
import { useToast } from '@/hooks/use-toast';
import { Building2, MapPin, ArrowRight, TrendingUp, Key, Info } from 'lucide-react';

export const RealEstateDetailView = ({ product }: { product: any }) => {
    const { addToCart } = useInvestmentCart();
    const { toast } = useToast();
    
    // Mock State for calculator
    const [units, setUnits] = useState(1);
    
    // Values
    const unitPrice = product.minSIP || 2500000; // Default to product minSIP or 25L per unit/fraction
    const totalInvestment = units * unitPrice;
    const rentalYield = product.cagr3y || product.rentalYield || 8.5; // Use product data if available
    const expectedAppreciation = product.cagr1y || product.expectedAppreciation || 12; // Use product data
    const monthlyRent = Math.round((totalInvestment * (rentalYield / 100)) / 12);

    const handleInvest = () => {
        addToCart({
            id: product.id,
            name: product.name,
            amc: product.fundHouse || product.amc || 'Real Estate Developer',
            nav: totalInvestment
        });
        toast({ title: "Investment Blocked", description: `You have blocked ${units} unit(s) of ${product.name}.` });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-bl-full -z-10 opacity-50"></div>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-teal-100 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                Fractional Real Estate
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#1a365d] leading-tight mb-2">
                            {product.name}
                        </h1>
                        <p className="text-gray-500 font-medium flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {product.fundHouse || product.amc || 'Premium Commercial Park, Bangalore'}
                        </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                        <p className="text-sm text-gray-500 mb-1">Target IRR</p>
                        <p className="text-3xl font-bold text-teal-600 tracking-tight flex items-end gap-1">
                            {rentalYield + expectedAppreciation}% <span className="text-sm font-normal text-gray-400 mb-1">p.a.</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Left Column (Details & Images) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Placeholder for Property Image Gallery */}
                    <div className="bg-gray-100 rounded-2xl border border-gray-200 h-64 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-50 opacity-50"></div>
                        <Building2 className="w-16 h-16 mb-2 relative z-10 text-gray-300" />
                        <span className="relative z-10 font-medium">Property Image Gallery</span>
                    </div>

                    {/* Key Terms */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Rental Yield</p>
                            <p className="text-xl font-bold text-gray-900">{rentalYield}%</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Expected Appr.</p>
                            <p className="text-xl font-bold text-gray-900">{expectedAppreciation}%</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Asset Type</p>
                            <p className="text-xl font-bold text-gray-900">{product.assetType || 'Commercial'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Lock-in</p>
                            <p className="text-xl font-bold text-gray-900">{product.lockIn || '3 Years'}</p>
                        </div>
                    </div>

                    {/* About */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#1a365d] mb-4">Property Overview</h2>
                        <p className="text-gray-600 leading-relaxed mb-6">
                            {product.description || 'Invest in Grade-A commercial real estate with steady rental yields from MNC tenants and strong capital appreciation potential. This asset is fully leased out with a lock-in period of 5 years, providing stable cash flows.'}
                        </p>
                        
                        <h3 className="text-md font-bold text-gray-900 mb-3">Tenant Details</h3>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600 text-sm">Anchor Tenant</span>
                                <span className="font-bold text-gray-900">Fortune 500 Tech Co.</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600 text-sm">Lease Tenure</span>
                                <span className="font-bold text-gray-900">9 Years (Started 2023)</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600 text-sm">Lock-in Period</span>
                                <span className="font-bold text-gray-900">5 Years</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 text-sm">Rent Escalation</span>
                                <span className="font-bold text-gray-900">15% every 3 years</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Investment Widget) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-teal-900/5 border border-gray-100 p-6 sticky top-24">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-teal-100 p-2 rounded-lg text-teal-700">
                                <Key className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Investment Summary</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Units Selection */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Number of Units</label>
                                    <span className="font-bold text-gray-900">{units}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setUnits(Math.max(1, units - 1))}
                                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center font-bold text-xl text-gray-900">
                                        {units}
                                    </div>
                                    <button 
                                        onClick={() => setUnits(units + 1)}
                                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Monthly Rent</p>
                                    <p className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                                        +₹{monthlyRent.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Investment Amount</p>
                                    <p className="text-xl font-bold text-[#1a365d]">
                                        ₹{(totalInvestment / 100000).toFixed(0)} L
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Info className="w-3 h-3" /> Includes 1% platform fee
                            </p>

                            <button 
                                onClick={handleInvest}
                                className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-teal-200"
                            >
                                Block Unit(s) <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
