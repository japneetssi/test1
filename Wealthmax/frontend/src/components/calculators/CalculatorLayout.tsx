import { ReactNode } from "react";
import { Download } from "lucide-react";

interface CalculatorLayoutProps {
    title: string;
    subtitle: string;
    inputs: ReactNode;
    results: ReactNode;
    chart: ReactNode;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void;
    isCalculating?: boolean;
}

export const CalculatorLayout = ({
    title,
    subtitle,
    inputs,
    results,
    chart,
    primaryActionLabel,
    onPrimaryAction,
    isCalculating,
}: CalculatorLayoutProps) => {
    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[500px] print:shadow-none print:border-none print:flex-col print:min-h-0 print:static">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    /* CRITICAL: Ensure modal and its content are visible */
                    body > * { display: none !important; }
                    body > #root, body > [data-radix-portal], body > [role="dialog"] { 
                        display: block !important; 
                    }

                    /* If modal is in a portal, ensure the portal is shown */
                    [data-radix-portal] { 
                        position: static !important; 
                        display: block !important; 
                    }

                    /* Reset the fixed overlay */
                    .fixed.inset-0 { 
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        display: block !important;
                        background: white !important;
                        z-index: 9999 !important;
                    }

                    /* Remove darkened backdrops and blurs */
                    .bg-slate-900\\/60, .backdrop-blur-sm, [data-state="open"]::before { 
                        display: none !important; 
                    }

                    /* The modal card content */
                    .max-w-5xl, [role="dialog"] {
                        max-width: 100% !important;
                        width: 100% !important;
                        box-shadow: none !important;
                        border: none !important;
                        height: auto !important;
                        max-height: none !important;
                        overflow: visible !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    /* Hide modal chrome and interactive bits */
                    .sticky.top-0, .no-print, button, .lucide-x { 
                        display: none !important; 
                    }

                    /* Print layout adjustments */
                    .flex-col.md\\:flex-row { flex-direction: column !important; }
                    .md\\:w-1\\/2 { width: 100% !important; }
                    .grid-cols-2 { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .print-area { display: block !important; width: 100% !important; }
                    
                    /* Chart visibility */
                    .recharts-responsive-container { 
                        min-height: 400px !important; 
                        width: 100% !important;
                        display: block !important;
                    }
                }
            `}} />

            {/* Left Column: Input Engine */}
            <div className="w-full md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 flex flex-col print-area">
                <div className="mb-6 space-y-1">
                    <h2 className="text-2xl font-bold text-[#00458c] tracking-tight">{title}</h2>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>

                <div className="flex-1 space-y-6 no-print">
                    {inputs}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200 no-print">
                    <button
                        onClick={handleDownloadPDF}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-[#00458c] text-[#00458c] font-semibold hover:bg-[#00458c]/5 transition-colors"
                    >
                        <Download size={18} />
                        Download PDF Report
                    </button>
                </div>
            </div>

            {/* Right Column: Visual Analytics & Results */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white print-area">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {results}
                </div>

                <div className="flex-1 min-h-[250px] flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Projected Growth</h3>
                    <div className="flex-1">
                        {chart}
                    </div>
                </div>

                {primaryActionLabel && onPrimaryAction && (
                    <div className="mt-8 pt-6 no-print">
                        <button
                            onClick={onPrimaryAction}
                            disabled={isCalculating}
                            className="w-full flex items-center justify-center px-4 py-3.5 rounded-lg bg-[#f37920] text-white font-bold text-lg hover:bg-[#d96715] transition-colors disabled:opacity-70 shadow-md shadow-[#f37920]/20"
                        >
                            {isCalculating ? "Calculating..." : primaryActionLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const SummaryCard = ({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) => (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-[#f37920]/10 border-[#f37920]/30' : 'bg-slate-50 border-slate-100'}`}>
        <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
        <div className={`text-2xl font-bold ${highlight ? 'text-[#f37920]' : 'text-[#00458c]'}`}>{value}</div>
    </div>
);
