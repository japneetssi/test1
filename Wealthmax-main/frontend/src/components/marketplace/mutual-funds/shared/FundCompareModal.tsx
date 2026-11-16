import { X, CheckCircle2 } from "lucide-react";
import { Product } from "../../../ProductCard";

interface FundCompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    funds: Product[];
}

export function FundCompareModal({ isOpen, onClose, funds }: FundCompareModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h2 className="text-xl font-extrabold text-gray-900">Compare Funds</h2>
                        <p className="text-sm text-gray-500 mt-1">Detailed comparison across {funds.length} selected funds</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
                    <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${funds.length}, minmax(0, 1fr))` }}>
                        {/* Headers */}
                        <div className="font-semibold text-sm text-gray-400 uppercase tracking-wider self-end pb-4 border-b border-gray-200">Metrics</div>
                        {funds.map(f => (
                            <div key={f.id} className="pb-4 border-b border-gray-200">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-3">
                                    <span className="font-bold text-[#00458c] text-xs">{(f.amc || f.fundHouse || 'NA').substring(0,2).toUpperCase()}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm leading-tight">{f.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{f.category}</p>
                            </div>
                        ))}

                        {/* Data Rows */}
                        <CompareRow label="1Y Returns" funds={funds} extract={(f) => f.cagr1y ? <span className="text-emerald-600 font-bold">+{f.cagr1y}%</span> : 'N/A'} />
                        <CompareRow label="3Y Returns" funds={funds} extract={(f) => f.cagr3y ? <span className="text-emerald-600 font-bold">+{f.cagr3y}%</span> : 'N/A'} />
                        <CompareRow label="Risk Profile" funds={funds} extract={(f) => <span className="font-medium text-gray-700">{f.risk}</span>} />
                        <CompareRow label="Minimum SIP" funds={funds} extract={(f) => <span className="font-medium text-gray-700">₹{f.minSIP || 500}</span>} />
                        <CompareRow label="Fund Size" funds={funds} extract={(f) => <span className="font-medium text-gray-700">{f.aum || 'N/A'}</span>} />
                        <CompareRow label="Expense Ratio" funds={funds} extract={(f) => <span className="font-medium text-gray-700">{f.expenseRatio ? `${f.expenseRatio}%` : 'N/A'}</span>} />
                        <CompareRow label="Rating" funds={funds} extract={(f) => (
                            <div className="flex items-center gap-1">
                                {f.rating ? <span className="font-bold text-gray-900">{f.rating}</span> : 'N/A'}
                                {f.rating && <StarIcon />}
                            </div>
                        )} />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
}

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
)

const CompareRow = ({ label, funds, extract }: { label: string, funds: Product[], extract: (f: Product) => React.ReactNode }) => (
    <>
        <div className="py-4 border-b border-gray-100 text-sm font-semibold text-gray-600 flex items-center">{label}</div>
        {funds.map(f => (
            <div key={f.id} className="py-4 border-b border-gray-100 flex items-center text-sm">
                {extract(f)}
            </div>
        ))}
    </>
);
