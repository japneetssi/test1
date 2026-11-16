import React, { useState, useEffect } from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export const DiscoverStocks = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/equity-dashboard/categories');
                if (res.data.success) setData(res.data.data);
            } catch (e) {
                console.error("Failed to fetch categories", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="h-40 bg-white rounded-xl border border-gray-200 animate-pulse"></div>;
    }

    if (!data) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Compass className="h-6 w-6 text-teal-600" />
                    Discover Stocks
                </h2>
                <button className="text-sm font-medium text-[#00458c] hover:underline flex items-center gap-1">
                    All Categories <ArrowRight className="h-4 w-4" />
                </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {data.map((cat: any, i: number) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center group hover:border-[#00458c]/30">
                        <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform">{cat.icon}</div>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">{cat.name}</h4>
                        <p className="text-[10px] text-gray-500 mt-1">{cat.count} Stocks</p>
                        <p className={`text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded ${cat.returnToday.startsWith('-') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {cat.returnToday} Today
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
