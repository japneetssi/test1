import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  LayoutDashboard, 
  MessageSquare, 
  FileText,
  Shield,
  TrendingUp,
  Wallet,
  Lock,
  MessageCircle,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import api from "@/lib/api";
import ActivityTimeline from "@/components/advisor/ActivityTimeline";
import DocumentVault from "@/components/advisor/DocumentVault";
import PortfolioRebalancing from "@/pages/PortfolioRebalancing";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  assigned_persona: string;
  health_score: number;
  total_assets: number;
}

interface OptionWealthData {
  lockedPortfolioValue: number;
  unlockableMargin: number;
  eligibleMargin: number;
  coveredCalls: {
    holdingName: string;
    holdingValue: number;
    estMonthlyPremium: number;
  }[];
}

interface FinancialProfile {
  healthScore: number;
  income: number;
  savings: number;
  investments: number;
  emi: number;
  insurance: number;
  allocation: {
    savings: number;
    investments: number;
    emi: number;
    insurance: number;
  };
}

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [optionWealth, setOptionWealth] = useState<OptionWealthData | null>(null);
  const [financialProfile, setFinancialProfile] = useState<FinancialProfile | null>(null);
  const [loadingOptionWealth, setLoadingOptionWealth] = useState(false);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => {
    if (clientId) fetchClientInfo();
  }, [clientId]);

  useEffect(() => {
    if (activeTab === 'optionWealth' && clientId && !optionWealth) {
      fetchOptionWealth();
    }
  }, [activeTab, clientId]);

  useEffect(() => {
    if (activeTab === 'financial' && clientId && !financialProfile) {
      fetchFinancialProfile();
    }
  }, [activeTab, clientId]);

  const fetchFinancialProfile = async () => {
    try {
      setLoadingFinancial(true);
      const res = await api.get(`/advisor/financial-profile/${clientId}`);
      if (res.data.success) {
        setFinancialProfile(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Financial Profile Error", error);
    } finally {
      setLoadingFinancial(false);
    }
  };

  const fetchOptionWealth = async () => {
    try {
      setLoadingOptionWealth(true);
      const res = await api.get(`/advisor/option-wealth/${clientId}`);
      if (res.data.success) {
        setOptionWealth(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Option Wealth Error", error);
    } finally {
      setLoadingOptionWealth(false);
    }
  };

  const fetchClientInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/advisor/clients`);
      if (res.data.success) {
        const clients = res.data.data.clients || res.data.data;
        const found = clients.find((c: any) => c.id === clientId);
        if (found) {
          setClient(found);
        } else {
          toast.error("Client not found");
          navigate('/advisor/dashboard');
        }
      }
    } catch (error) {
      console.error("Fetch Client Error", error);
      toast.error("Failed to load client info");
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (amount: number) => {
    if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#00458c]" />
          <p className="font-black text-xs uppercase tracking-widest text-slate-400">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/advisor/dashboard')}
          className="mb-4 text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#00458c] flex items-center justify-center font-black text-2xl">
                {client.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{client.name}</h1>
                <p className="text-sm text-slate-500 font-medium">{client.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${
                    client.assigned_persona === 'A' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-orange-600 bg-orange-50 border-orange-200'
                  }`}>
                    Persona {client.assigned_persona || 'B'}
                  </Badge>
                  <Badge variant="outline" className="text-slate-400 border-slate-200 text-[10px] font-black uppercase">
                    {formatINR(parseFloat(client.total_assets) || 0)} AUM
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Health Score */}
            <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-xl">
              <Shield className="h-8 w-8 text-[#00458c]" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Health Score</p>
                <p className="text-2xl font-black text-slate-900">{client.health_score || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm h-12">
            <TabsTrigger 
              value="portfolio" 
              className="flex items-center gap-2 px-6 data-[state=active]:bg-[#00458c] data-[state=active]:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Portfolio Review
            </TabsTrigger>
            <TabsTrigger 
              value="crm" 
              className="flex items-center gap-2 px-6 data-[state=active]:bg-[#00458c] data-[state=active]:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              CRM Timeline
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex items-center gap-2 px-6 data-[state=active]:bg-[#00458c] data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              Document Vault
            </TabsTrigger>
            <TabsTrigger 
              value="optionWealth" 
              className="flex items-center gap-2 px-6 data-[state=active]:bg-[#00458c] data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4" />
              Option Wealth Advisory
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="flex items-center gap-2 px-6 data-[state=active]:bg-[#00458c] data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              Financial Health & Gap Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            {clientId && <PortfolioRebalancing clientId={clientId} />}
          </TabsContent>

          <TabsContent value="crm" className="space-y-6">
            {clientId && <ActivityTimeline clientId={clientId} />}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {clientId && <DocumentVault clientId={clientId} />}
          </TabsContent>

          <TabsContent value="optionWealth" className="space-y-6">
            {loadingOptionWealth ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#00458c]" />
              </div>
            ) : (
              <>
                {/* Section 1: Liquidity Unlocker */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Donut Chart */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Liquidity Unlocker
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Locked Portfolio', value: optionWealth?.lockedPortfolioValue || 0 },
                                { name: 'Unlockable Margin', value: optionWealth?.unlockableMargin || 0 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#00458c" />
                              <Cell fill="#f37920" />
                            </Pie>
                            <Tooltip formatter={(value: number) => formatINR(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#00458c]" />
                          <span className="text-xs font-medium text-slate-600">Locked Portfolio</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#f37920]" />
                          <span className="text-xs font-medium text-slate-600">Unlockable LAS</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Eligible Margin Card */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Eligible Margin Limit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center justify-center h-[250px]">
                        <p className="text-4xl font-black text-[#00458c]">
                          {formatINR(optionWealth?.eligibleMargin || 0)}
                        </p>
                        <p className="text-sm text-slate-400 mt-2">Available for option writing</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Section 2: Yield Enhancement */}
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Yield Enhancement - Covered Calls
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-black uppercase text-slate-400">Holding Name</TableHead>
                          <TableHead className="text-right text-xs font-black uppercase text-slate-400">Holding Value</TableHead>
                          <TableHead className="text-right text-xs font-black uppercase text-slate-400">Est. Monthly Premium</TableHead>
                          <TableHead className="text-right text-xs font-black uppercase text-slate-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {optionWealth?.coveredCalls?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-slate-400">
                              No covered call opportunities available
                            </TableCell>
                          </TableRow>
                        ) : (
                          optionWealth?.coveredCalls?.map((call, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{call.holdingName}</TableCell>
                              <TableCell className="text-right">{formatINR(call.holdingValue)}</TableCell>
                              <TableCell className="text-right text-emerald-600 font-medium">
                                +{formatINR(call.estMonthlyPremium)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs font-medium border-[#00458c] text-[#00458c] hover:bg-[#00458c] hover:text-white"
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Discuss Strategy
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {loadingFinancial ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#00458c]" />
              </div>
            ) : financialProfile?.incomplete ? (
              <Card className="border-slate-100 shadow-sm p-12 text-center">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-amber-600 mb-4">
                  <AlertTriangle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Profile Incomplete</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                  {financialProfile.message || "This client has not yet completed their financial profile survey."}
                </p>
                <Button 
                  variant="outline" 
                  className="border-slate-200 text-slate-600"
                  onClick={() => {/* Mock Nudge */}}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Nudge Client to Complete
                </Button>
              </Card>
            ) : (
              <>
                {/* Section 1: Health Score Gauge */}
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Financial Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center py-8">
                      <div className="relative w-48 h-48">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="12"
                          />
                          <circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="none"
                            stroke={financialProfile?.healthScore && financialProfile.healthScore >= 70 ? '#10b981' : financialProfile?.healthScore && financialProfile.healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="12"
                            strokeDasharray={`${(financialProfile?.healthScore || 0) * 5.52} 552`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-black text-slate-900">{financialProfile?.healthScore || 0}</span>
                          <span className="text-xs font-medium text-slate-400 mt-1">out of 100</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-4">
                        {financialProfile?.healthScore && financialProfile.healthScore >= 70 ? 'Excellent financial health' : 
                         financialProfile?.healthScore && financialProfile.healthScore >= 40 ? 'Moderate financial health - room for improvement' : 
                         'Critical financial health - immediate attention required'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: 30-30-30-10 Rule Analysis */}
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      The 30-30-30-10 Rule Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Ideal Split */}
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400 mb-3">Ideal Split</p>
                      <div className="h-8 rounded-lg overflow-hidden flex">
                        <div className="bg-[#00458c] flex items-center justify-center" style={{ width: '30%' }}>
                          <span className="text-xs font-black text-white">30% Savings</span>
                        </div>
                        <div className="bg-[#0ea5e9] flex items-center justify-center" style={{ width: '30%' }}>
                          <span className="text-xs font-black text-white">30% Investments</span>
                        </div>
                        <div className="bg-[#f37920] flex items-center justify-center" style={{ width: '30%' }}>
                          <span className="text-xs font-black text-white">30% EMIs</span>
                        </div>
                        <div className="bg-[#10b981] flex items-center justify-center" style={{ width: '10%' }}>
                          <span className="text-xs font-black text-white">10% Insurance</span>
                        </div>
                      </div>
                    </div>

                    {/* Actual Split */}
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400 mb-3">Actual Split</p>
                      <div className="h-8 rounded-lg overflow-hidden flex">
                        <div 
                          className="flex items-center justify-center" 
                          style={{ 
                            width: `${financialProfile?.allocation?.savings || 0}%`,
                            backgroundColor: (financialProfile?.allocation?.savings || 0) > 30 ? '#ef4444' : '#00458c'
                          }}
                        >
                          {(financialProfile?.allocation?.savings || 0) > 0 && (
                            <span className="text-xs font-black text-white">{Math.round(financialProfile?.allocation?.savings || 0)}%</span>
                          )}
                        </div>
                        <div 
                          className="flex items-center justify-center" 
                          style={{ 
                            width: `${financialProfile?.allocation?.investments || 0}%`,
                            backgroundColor: (financialProfile?.allocation?.investments || 0) > 30 ? '#ef4444' : '#0ea5e9'
                          }}
                        >
                          {(financialProfile?.allocation?.investments || 0) > 0 && (
                            <span className="text-xs font-black text-white">{Math.round(financialProfile?.allocation?.investments || 0)}%</span>
                          )}
                        </div>
                        <div 
                          className="flex items-center justify-center" 
                          style={{ 
                            width: `${financialProfile?.allocation?.emi || 0}%`,
                            backgroundColor: (financialProfile?.allocation?.emi || 0) > 30 ? '#ef4444' : '#f37920'
                          }}
                        >
                          {(financialProfile?.allocation?.emi || 0) > 0 && (
                            <span className="text-xs font-black text-white">{Math.round(financialProfile?.allocation?.emi || 0)}%</span>
                          )}
                        </div>
                        <div 
                          className="flex items-center justify-center" 
                          style={{ 
                            width: `${financialProfile?.allocation?.insurance || 0}%`,
                            backgroundColor: (financialProfile?.allocation?.insurance || 0) > 10 ? '#ef4444' : '#10b981'
                          }}
                        >
                          {(financialProfile?.allocation?.insurance || 0) > 0 && (
                            <span className="text-xs font-black text-white">{Math.round(financialProfile?.allocation?.insurance || 0)}%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#00458c]" />
                        <span className="font-medium">Savings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#0ea5e9]" />
                        <span className="font-medium">Investments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#f37920]" />
                        <span className="font-medium">EMIs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-[#10b981]" />
                        <span className="font-medium">Insurance</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDetail;