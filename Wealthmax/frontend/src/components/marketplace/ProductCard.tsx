import { Star, TrendingUp } from "lucide-react";

export interface Product {
    id: string;
    name: string;
    shortName: string;
    category: string;
    risk: string;
    amc: string;
    nav?: number;
    cagr3y?: number;
    cagr1y?: number;
    aum?: string;
    rating?: number;
    minSIP?: number;
    isRecommended?: boolean;
    isin?: string;
    description?: string;
    fundHouse?: string;
    riskLevel?: string;
}

interface ProductCardProps {
    product: Product;
    index: number;
    riskColor: (r: string) => string;
    categoryColor: (c: string) => string;
    onInvest: () => void;
    onFactsheet: () => void;
}

export function ProductCard({ product, index, riskColor, categoryColor, onInvest, onFactsheet }: ProductCardProps) {
    const isFD = product.category === 'FD';
    const isLoan = product.category === 'Loan';
    const isInsurance = product.category.includes('Insurance');
    const isRealEstate = product.category === 'Real Estate';
    const isEquity = product.category === 'Equity';
    
    let label1 = "NAV / LTP";
    let value1 = product.nav !== undefined ? `₹${product.nav.toLocaleString('en-IN')}` : "N/A";
    let label2 = "3Y CAGR";
    let value2 = product.cagr3y !== undefined ? `${product.cagr3y > 0 ? '+' : ''}${product.cagr3y}%` : "N/A";
    let label3 = "1Y Returns";
    let value3 = product.cagr1y !== undefined ? `${product.cagr1y > 0 ? '+' : ''}${product.cagr1y}%` : "N/A";

    if (isFD) {
        label1 = "Min Deposit";
        value1 = product.minSIP ? `₹${product.minSIP}` : "N/A";
        label2 = "Interest p.a.";
        value2 = product.cagr3y ? `${product.cagr3y}%` : "N/A";
        label3 = "Tenure";
        value3 = `1-5 Yrs`;
    } else if (isLoan) {
        label1 = "Max Loan";
        value1 = `₹50L`;
        label2 = "Interest p.a.";
        value2 = product.cagr3y ? `${product.cagr3y}%` : "N/A";
        label3 = "Processing";
        value3 = `1%`;
    } else if (isInsurance) {
        label1 = "Cover";
        value1 = `₹1Cr`;
        label2 = "Premium";
        value2 = product.cagr3y ? `₹${product.cagr3y}k/yr` : "N/A";
        label3 = "Claim Ratio";
        value3 = `98%`;
    } else if (isRealEstate) {
        label1 = "Min Inv.";
        value1 = product.minSIP ? `₹${(product.minSIP)/1000}k` : "N/A";
        label2 = "Yield";
        value2 = product.cagr3y ? `${product.cagr3y}%` : "N/A";
        label3 = "Appreciation";
        value3 = product.cagr1y ? `~${product.cagr1y}%` : "N/A";
    } else if (isEquity) {
        label1 = "LTP";
        value1 = product.nav !== undefined ? `₹${product.nav}` : "N/A";
        label2 = "Lot Size";
        value2 = product.minSIP ? `${product.minSIP}` : "1";
        label3 = "Exchange";
        value3 = product.amc || "N/A";
    }

    const delayClass = `animate-delay-${(index % 5) + 1}`;

    return (
        <div className={`glass-card flex flex-col overflow-hidden animate-enter ${delayClass} group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-gray-100`}>
            {/* Header */}
            <div className="p-5 pb-4 border-b border-gray-100/50 bg-gradient-to-br from-white to-gray-50/50">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-[#00458c] transition-colors">{product.name}</h3>
                    {product.isRecommended && (
                        <div className="shrink-0 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500 text-white p-1.5 rounded-lg shadow-sm" title="Recommended for you">
                            <Star className="h-4 w-4 fill-white text-white" />
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-auto">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${categoryColor(product.category)} truncate max-w-[120px]`}>{product.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${riskColor(product.risk)}`}>{product.risk}</span>
                    <span className="text-[11px] text-gray-500 font-semibold ml-auto truncate max-w-[120px] bg-white/60 px-2 py-1 rounded border border-gray-100">{product.amc}</span>
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100/50 bg-white">
                <DataCell label={label1} value={value1} />
                <DataCell
                    label={label2}
                    value={value2}
                    valueClass={isLoan ? "text-gray-900 font-extrabold" : "text-emerald-600 font-extrabold"}
                />
                <DataCell 
                    label={label3} 
                    value={value3} 
                    valueClass={(!isFD && !isLoan && !isInsurance && !isRealEstate && (product.cagr1y || 0) >= 20) ? "text-emerald-600 font-extrabold" : "text-gray-900 font-bold"} 
                />
            </div>

            {/* Secondary Data */}
            <div className="flex items-center justify-between px-5 py-3 text-xs text-gray-500 bg-gray-50/50">
                <span className="font-medium">{isInsurance || isLoan || isRealEstate || isEquity ? 'Details' : 'AUM'}: <span className="font-bold text-gray-800">{isInsurance ? 'Check T&C' : isLoan ? 'Quick Disbursal' : isRealEstate ? 'Prime Location' : isEquity ? product.description : (product.aum || 'N/A')}</span></span>
                <span className="font-medium">{isInsurance || isLoan || isFD || isRealEstate ? 'Min Amt' : isEquity ? 'Trading' : 'Min SIP'}: <span className="font-bold text-gray-800">{product.minSIP ? (isEquity ? "Live Market" : `₹${product.minSIP}`) : 'N/A'}</span></span>
                <div className="flex items-center gap-0.5 ml-2 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={`h-3 w-3 ${i < (product.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 p-5 pt-4 mt-auto bg-white border-t border-gray-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#00458c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <button
                    onClick={onFactsheet}
                    className="flex-1 btn-glass-secondary justify-center text-sm py-2.5 relative z-10 font-bold hover:bg-gray-50"
                >
                    View Details
                </button>
                <button
                    onClick={onInvest}
                    className="flex-1 btn-glass-primary justify-center text-sm py-2.5 relative z-10 font-bold shadow-md hover:shadow-lg"
                >
                    <TrendingUp className="h-4 w-4" />
                    {isLoan ? 'Apply Now' : isInsurance ? 'Get Quote' : 'Invest Now'}
                </button>
            </div>
        </div>
    );
}

function DataCell({ label, value, valueClass = "text-gray-900 font-bold" }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex flex-col items-center py-4 px-2 text-center group">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1 group-hover:text-[#00458c] transition-colors">{label}</span>
            <span className={`text-[15px] ${valueClass} truncate w-full`}>{value}</span>
        </div>
    );
}
