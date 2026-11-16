import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopNav from '@/components/TopNav';
import SubNav from '@/components/SubNav';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Star, AlertCircle, ShoppingCart } from 'lucide-react';
import { useInvestmentCart } from '@/contexts/InvestmentCartContext';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MutualFundDetailView } from '@/components/marketplace/details/MutualFundDetailView';
import { EquityDetailView } from '@/components/marketplace/details/EquityDetailView';
import { InsuranceDetailView } from '@/components/marketplace/details/InsuranceDetailView';
import { LoanDetailView } from '@/components/marketplace/details/LoanDetailView';
import { FDDetailView } from '@/components/marketplace/details/FDDetailView';
import { AIFPMSDetailView } from '@/components/marketplace/details/AIFPMSDetailView';
import { RealEstateDetailView } from '@/components/marketplace/details/RealEstateDetailView';

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useInvestmentCart();
    const { toast } = useToast();
    
    const [fund, setFund] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [timeframe, setTimeframe] = useState<string>('1Y');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchFundDetail = async () => {
            try {
                const [res, histRes] = await Promise.all([
                    fetch(`https://wealthmax-og-backend.onrender.com/api/v1/marketplace/catalog/${id}`),
                    fetch(`https://wealthmax-og-backend.onrender.com/api/v1/marketplace/catalog/${id}/history`)
                ]);
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setFund(data.data);
                    } else {
                        setError(true);
                    }
                } else {
                    setError(true);
                }

                if (histRes.ok) {
                    const histData = await histRes.json();
                    if (histData.success && histData.data) {
                        setHistory(histData.data);
                    }
                }

            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchFundDetail();
        }
    }, [id]);

    const getFilteredHistory = () => {
        if (!history.length || timeframe === 'ALL') return history;
        const now = new Date();
        const cutoff = new Date();
        if (timeframe === '1M') cutoff.setMonth(now.getMonth() - 1);
        else if (timeframe === '6M') cutoff.setMonth(now.getMonth() - 6);
        else if (timeframe === '1Y') cutoff.setFullYear(now.getFullYear() - 1);
        else if (timeframe === '3Y') cutoff.setFullYear(now.getFullYear() - 3);
        else if (timeframe === '5Y') cutoff.setFullYear(now.getFullYear() - 5);
        
        return history.filter(h => new Date(h.date) >= cutoff);
    };

    const handleInvest = () => {
        if (!fund) return;
        addToCart({
            id: fund.id,
            name: fund.name,
            amc: fund.fundHouse || fund.amc || 'Unknown AMC',
            nav: fund.stats?.nav || fund.nav
        });
        toast({ title: "Added to Cart", description: `${fund.name} added to your investment bucket.` });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col">
                <TopNav />
                <SubNav />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a365d]" />
                </div>
            </div>
        );
    }

    if (error || !fund) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col">
                <TopNav />
                <SubNav />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-[#1a365d] mb-2">Fund Not Found</h2>
                    <p className="text-gray-500 mb-6">We couldn't load the details for this mutual fund.</p>
                    <button 
                        onClick={() => navigate('/marketplace')}
                        className="btn-glass-primary"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col">
            <TopNav />
            <SubNav />
            
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Back Button */}
                <button 
                    onClick={() => navigate('/marketplace')}
                    className="flex items-center gap-2 text-gray-500 hover:text-[#1a365d] transition-colors mb-6 font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Marketplace
                </button>

                {fund.category === 'Equity' ? (
                    <EquityDetailView product={fund} history={history} />
                ) : fund.category?.includes('Insurance') ? (
                    <InsuranceDetailView product={fund} />
                ) : fund.category === 'Loan' ? (
                    <LoanDetailView product={fund} />
                ) : fund.category === 'FD' ? (
                    <FDDetailView product={fund} />
                ) : fund.category === 'AIF' || fund.category === 'PMS' ? (
                    <AIFPMSDetailView product={fund} history={history} />
                ) : fund.category === 'Real Estate' ? (
                    <RealEstateDetailView product={fund} />
                ) : (
                    <MutualFundDetailView product={fund} history={history} />
                )}

            </main>
        </div>
    );
}
