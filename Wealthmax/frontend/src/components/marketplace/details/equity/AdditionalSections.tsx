import React from 'react';
import { ShareholdingPattern, CorporateAction, NewsArticle, Peer, CompanyOverview, RiskAnalysis, AIInsights } from '@/types/equity';
import { Users, FileText, AlertTriangle, TrendingUp, Link as LinkIcon, Sparkles } from 'lucide-react';

const ShareholdingBar = ({ label, value, color }: { label: string; value: number | null; color: string }) => {
    if (value == null) return null;
    return (
        <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-medium">{label}</span>
                <span className="font-bold text-gray-900">{value.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
        </div>
    );
};

export const ShareholdingView = ({ data, loading }: { data?: any; loading?: boolean }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Shareholding Pattern
            </h2>
            {loading ? (
                <div className="space-y-4">
                    {[1,2,3].map(i => (
                        <div key={i}>
                            <div className="flex justify-between mb-1">
                                <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                                <div className="h-4 bg-gray-100 rounded animate-pulse w-10" />
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2" />
                        </div>
                    ))}
                </div>
            ) : !data || (data.promoters == null && data.institutions == null && data.retail == null) ? (
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">Shareholding data unavailable</p>
                </div>
            ) : (
                <div>
                    <ShareholdingBar label="Promoters / Insiders" value={data.promoters} color="bg-indigo-500" />
                    <ShareholdingBar label="Institutions (FII + DII)" value={data.institutions} color="bg-emerald-500" />
                    <ShareholdingBar label="Retail & Others" value={data.retail} color="bg-amber-400" />
                    <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
                        Source: Yahoo Finance (majorHoldersBreakdown). Detailed FII/DII split requires exchange data.
                    </p>
                </div>
            )}
        </div>
    );
};


export const CorporateActionsView = ({ actions }: { actions?: CorporateAction[] }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Corporate Actions</h2>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            DIV
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">Final Dividend of ₹15.00</p>
                            <p className="text-xs text-gray-500">Ex-Date: 12 Jul 2024 • Record Date: 13 Jul 2024</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const NewsAndInsightsView = ({ news, insights, loading }: { news?: any[], insights?: any, loading?: boolean }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col max-h-[500px]">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" /> Latest News
                </h2>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2 animate-pulse" />
                                <div className="h-4 bg-gray-100 rounded w-1/2 mb-3 animate-pulse" />
                                <div className="flex justify-between items-center">
                                    <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                                    <div className="h-4 bg-gray-100 rounded w-12 animate-pulse" />
                                </div>
                            </div>
                        ))
                    ) : (!news || news.length === 0) ? (
                        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
                            No recent verified news available.
                        </div>
                    ) : (
                        news.map((item, i) => (
                            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="block border-b border-gray-100 pb-4 last:border-0 last:pb-0 group">
                                <p className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{item.headline}</p>
                                {item.summary && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.summary}</p>}
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500">{item.source} • {new Date(item.publishedAt).toLocaleDateString()}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                        item.sentiment === 'Positive' ? 'text-emerald-600 bg-emerald-50' :
                                        item.sentiment === 'Negative' ? 'text-rose-600 bg-rose-50' :
                                        'text-gray-600 bg-gray-100'
                                    }`}>
                                        {item.sentiment}
                                    </span>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl shadow-md p-6 text-white relative overflow-hidden flex flex-col max-h-[500px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" /> AI Insights
                    </h2>
                    {insights?.metadata && (
                        <div className="text-[10px] text-indigo-200/60 text-right">
                            <p>Confidence: {insights.metadata.confidenceLevel}</p>
                            <p>Sources: {insights.metadata.sourcesAnalyzed}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i}>
                                <div className="h-4 bg-indigo-800/50 rounded w-1/3 mb-2 animate-pulse" />
                                <div className="h-3 bg-indigo-800/30 rounded w-full mb-1 animate-pulse" />
                                <div className="h-3 bg-indigo-800/30 rounded w-4/5 animate-pulse" />
                            </div>
                        ))
                    ) : !insights ? (
                        <div className="text-sm text-indigo-300">Insights unavailable.</div>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-200 mb-1">Business Summary</h3>
                                <p className="text-sm text-indigo-50/90 leading-relaxed">{insights.businessSummary}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-200 mb-1">Financial Health: {insights.financialHealth?.status}</h3>
                                <p className="text-sm text-indigo-50/90 leading-relaxed">{insights.financialHealth?.analysis}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-200 mb-1">Valuation: {insights.valuation?.status}</h3>
                                <p className="text-sm text-indigo-50/90 leading-relaxed">{insights.valuation?.analysis}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-200 mb-1">Growth Analysis</h3>
                                <p className="text-sm text-indigo-50/90 leading-relaxed">{insights.growthAnalysis}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-200 mb-1">Technical Outlook: {insights.technicalOutlook?.status}</h3>
                                <p className="text-sm text-indigo-50/90 leading-relaxed">{insights.technicalOutlook?.analysis}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-200 mb-1">Risk Analysis</h3>
                                <p className="text-sm text-indigo-50/90 leading-relaxed">{insights.riskAnalysis}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h3 className="text-sm font-semibold text-emerald-300 mb-2">Strengths</h3>
                                <ul className="list-disc pl-4 text-xs text-indigo-50/90 space-y-1">
                                    {insights.investmentSnapshot?.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                                <h3 className="text-sm font-semibold text-rose-300 mt-3 mb-2">Weaknesses</h3>
                                <ul className="list-disc pl-4 text-xs text-indigo-50/90 space-y-1">
                                    {insights.investmentSnapshot?.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CompanyOverviewView = ({ overview, loading }: { overview?: any, loading?: boolean }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">About Company</h2>
            
            {loading ? (
                <div className="animate-pulse space-y-4 mb-6">
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                    <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-100 rounded w-4/6"></div>
                </div>
            ) : (
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {overview?.description || "Company description unavailable."}
                </p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="h-3 bg-gray-100 rounded w-16 mb-2"></div>
                            <div className="h-4 bg-gray-100 rounded w-24"></div>
                        </div>
                    ))
                ) : (
                    <>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Management</p>
                            <p className="font-semibold text-gray-900 text-sm">{overview?.management?.[0]?.name || "N/A"}</p>
                            {overview?.management?.[0]?.title && <p className="text-[10px] text-gray-500">{overview.management[0].title}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Sector</p>
                            <p className="font-semibold text-gray-900 text-sm">{overview?.sector || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Employees</p>
                            <p className="font-semibold text-gray-900 text-sm">{overview?.employees ? overview.employees.toLocaleString() : "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Headquarters</p>
                            <p className="font-semibold text-gray-900 text-sm">{overview?.headquarters || "N/A"}</p>
                        </div>
                        {overview?.website && (
                            <div className="col-span-2 md:col-span-4 mt-2">
                                <p className="text-xs text-gray-500 mb-1">Website</p>
                                <a href={overview.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-600 text-sm flex items-center gap-1 hover:underline w-fit">
                                    {overview.website} <LinkIcon className="w-3 h-3" />
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
