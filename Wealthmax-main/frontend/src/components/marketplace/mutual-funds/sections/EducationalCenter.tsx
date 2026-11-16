import { BookOpen, PlayCircle, FileText } from "lucide-react";

export function EducationalCenter() {
    const resources = [
        { title: "Beginner's Guide to Mutual Funds", type: "Article", icon: <FileText className="text-blue-500" /> },
        { title: "How to choose the right SIP amount?", type: "Video", icon: <PlayCircle className="text-red-500" /> },
        { title: "Understanding Expense Ratio & Exit Load", type: "Article", icon: <FileText className="text-emerald-500" /> },
        { title: "Tax Saving with ELSS explained", type: "Video", icon: <PlayCircle className="text-purple-500" /> }
    ];

    return (
        <section className="mb-10">
            <div className="flex items-center gap-2 mb-6">
                <BookOpen className="h-6 w-6 text-[#00458c]" />
                <h2 className="text-xl font-extrabold text-gray-900">Learn & Grow</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {resources.map((res, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            {res.icon}
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-[#00458c] transition-colors line-clamp-2 mb-4 flex-1">{res.title}</h3>
                        <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase tracking-wider self-start mt-auto">{res.type}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
