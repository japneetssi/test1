import { Newspaper, Clock, ExternalLink } from "lucide-react";

interface NewsItem {
    id: string;
    title: string;
    date: string;
    source: string;
    category: string;
}

export function MarketIntelligence({ news }: { news: NewsItem[] }) {
    if (!news || news.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="flex items-center gap-2 mb-6">
                <Newspaper className="h-6 w-6 text-[#00458c]" />
                <h2 className="text-xl font-extrabold text-gray-900">Market Intelligence</h2>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {news.map((item, index) => (
                    <div key={item.id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors cursor-pointer group ${index !== news.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded uppercase tracking-wider">{item.category}</span>
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> {item.date}</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#00458c] transition-colors">{item.title}</h3>
                            <p className="text-xs text-gray-500 font-medium mt-1">Source: <span className="text-gray-700">{item.source}</span></p>
                        </div>
                        <div className="shrink-0">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:border-[#00458c] group-hover:text-[#00458c] group-hover:shadow-sm transition-all">
                                <ExternalLink className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
