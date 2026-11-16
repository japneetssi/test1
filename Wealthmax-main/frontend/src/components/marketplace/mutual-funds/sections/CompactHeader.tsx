import { Search, Download, BarChart2, Calendar, Bookmark, ShoppingCart, Bell } from "lucide-react";
import { useState } from "react";

export function CompactHeader() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="bg-[#00458c] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="absolute inset-0 bg-white/5 opacity-50 backdrop-blur-3xl mix-blend-overlay"></div>
            <div className="relative z-10 w-full md:w-auto">
                <h1 className="text-3xl font-extrabold tracking-tight">Mutual Funds</h1>
                <p className="text-white/80 text-sm mt-1">Discover, compare, and invest in top-rated funds.</p>
            </div>

            <div className="relative z-10 flex-1 max-w-2xl w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#00458c] transition-colors" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search schemes, AMCs, ISIN, or Categories..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 transition-all outline-none shadow-sm font-medium"
                />
            </div>

            <div className="relative z-10 flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                <ActionButton icon={<Download />} label="Import" />
                <ActionButton icon={<BarChart2 />} label="Compare" />
                <ActionButton icon={<Calendar />} label="SIP" />
                <div className="w-px h-8 bg-white/20 mx-2 hidden md:block"></div>
                <ActionButton icon={<Bookmark />} />
                <ActionButton icon={<ShoppingCart />} />
                <ActionButton icon={<Bell />} />
            </div>
        </div>
    );
}

const ActionButton = ({ icon, label }: { icon: React.ReactNode, label?: string }) => (
    <button className="flex items-center gap-2 px-3 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all text-sm font-semibold shrink-0">
        <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        {label && <span>{label}</span>}
    </button>
);
