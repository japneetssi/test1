import { useState } from "react";
import { SlidersHorizontal, ChevronDown, Search } from "lucide-react";

interface MarketplaceSidebarProps {
    selectedRisks: string[];
    setSelectedRisks: React.Dispatch<React.SetStateAction<string[]>>;
    selectedAMCs: string[];
    setSelectedAMCs: React.Dispatch<React.SetStateAction<string[]>>;
    amcList: string[];
}

export function MarketplaceSidebar({
    selectedRisks, setSelectedRisks,
    selectedAMCs, setSelectedAMCs,
    amcList
}: MarketplaceSidebarProps) {
    const [amcSearch, setAmcSearch] = useState("");

    const toggleFilter = (value: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    };

    const clearAll = () => {
        setSelectedRisks([]);
        setSelectedAMCs([]);
        setAmcSearch("");
    };

    const filteredAMCs = amcList.filter(amc => amc.toLowerCase().includes(amcSearch.toLowerCase()));

    return (
        <aside className="w-full md:w-64 shrink-0 glass-panel p-5 space-y-6 md:sticky md:top-6 h-fit md:max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar animate-enter">
            <div className="flex items-center justify-between border-b border-gray-200/50 pb-3 mb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#00458c] uppercase tracking-wider">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                </div>
                {(selectedRisks.length > 0 || selectedAMCs.length > 0) && (
                    <button onClick={clearAll} className="text-[11px] font-bold text-[#f37920] hover:underline">
                        Clear All
                    </button>
                )}
            </div>

            {/* Active Filters Summary */}
            {(selectedRisks.length > 0 || selectedAMCs.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedRisks.map(r => (
                        <span key={r} className="inline-flex items-center px-2 py-1 rounded bg-[#00458c]/10 text-[#00458c] text-[10px] font-bold">
                            {r}
                            <button onClick={() => toggleFilter(r, selectedRisks, setSelectedRisks)} className="ml-1 text-gray-500 hover:text-red-500">&times;</button>
                        </span>
                    ))}
                    {selectedAMCs.slice(0, 3).map(a => (
                        <span key={a} className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-700 text-[10px] font-bold truncate max-w-[100px]">
                            {a}
                            <button onClick={() => toggleFilter(a, selectedAMCs, setSelectedAMCs)} className="ml-1 text-gray-500 hover:text-red-500">&times;</button>
                        </span>
                    ))}
                    {selectedAMCs.length > 3 && <span className="text-[10px] text-gray-500 font-bold px-1 py-1">+{selectedAMCs.length - 3}</span>}
                </div>
            )}

            <FilterSection title="Risk Profile">
                {(["Conservative", "Moderate", "Aggressive"]).map(risk => (
                    <CheckboxItem
                        key={risk}
                        label={risk}
                        checked={selectedRisks.includes(risk)}
                        onChange={() => toggleFilter(risk, selectedRisks, setSelectedRisks)}
                    />
                ))}
            </FilterSection>

            {amcList.length > 0 && (
                <FilterSection title="AMC / Fund House">
                    <div className="relative mb-3 group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#00458c]" />
                        <input
                            type="text"
                            placeholder="Search AMC..."
                            value={amcSearch}
                            onChange={e => setAmcSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#00458c]/30"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {filteredAMCs.map(amc => (
                            <CheckboxItem
                                key={amc}
                                label={amc}
                                checked={selectedAMCs.includes(amc)}
                                onChange={() => toggleFilter(amc, selectedAMCs, setSelectedAMCs)}
                            />
                        ))}
                        {filteredAMCs.length === 0 && <p className="text-xs text-gray-500 py-2">No AMCs found.</p>}
                    </div>
                </FilterSection>
            )}
        </aside>
    );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="bg-white/40 rounded-xl p-3 border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:bg-white/50">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center justify-between w-full p-1"
            >
                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{title}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${open ? "" : "-rotate-90"}`} />
            </button>
            {open && <div className="space-y-2 mt-3 animate-enter">{children}</div>}
        </div>
    );
}

function CheckboxItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void; }) {
    return (
        <label className="flex items-center justify-between gap-3 cursor-pointer group px-1 py-1 rounded-lg transition-colors hover:bg-white/60">
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={onChange}
                        className="peer w-4 h-4 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#00458c] checked:border-[#00458c] transition-all cursor-pointer focus:ring-2 focus:ring-[#00458c]/30 focus:outline-none"
                    />
                    <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <span className={`text-sm font-medium transition-colors ${checked ? "text-[#00458c] font-semibold" : "text-gray-700 group-hover:text-gray-900"}`}>{label}</span>
            </div>
        </label>
    );
}
