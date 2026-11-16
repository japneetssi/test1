import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  Info,
  MessageSquare,
  FileText
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import ActivityTimeline from './ActivityTimeline';
import DocumentVault from './DocumentVault';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    persona: string;
    healthScore: number;
    totalAssets: number;
  } | null;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ isOpen, onClose, client }) => {
  const [loading, setLoading] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && client) {
      fetchReviewData();
    }
  }, [isOpen, client]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/advisor/portfolio-review/${client?.id}`);
      if (res.data.success) {
        setReviewData(res.data.data);
      }
    } catch (error) {
      console.error("Portfolio Review Fetch Error", error);
      toast.error("Failed to load portfolio analysis");
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white">
        
        {/* Header Section */}
        <DialogHeader className="p-8 bg-[#00458c] text-white shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <DialogTitle className="text-2xl font-black tracking-tight">{client.name}</DialogTitle>
                 <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 px-3 font-bold">
                    ID: {client.id.split('-')[0].toUpperCase()}
                 </Badge>
              </div>
              <DialogDescription className="text-blue-100 font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Comprehensive Client Portfolio Analysis & Rebalancing
              </DialogDescription>
            </div>
            
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Client Persona</p>
                <p className="text-xl font-black text-white">{reviewData?.persona || client.persona}</p>
              </div>
              <div className="h-10 w-[1px] bg-white/20" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Total Assets</p>
                <p className="text-xl font-black text-white">{formatCurrency(reviewData?.totalValue || client.totalAssets)}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Navigation Tabs */}
        <Tabs defaultValue="review" className="flex-1 flex flex-col min-h-0 bg-white">
          <div className="px-8 border-b bg-slate-50/50">
            <TabsList className="h-14 bg-transparent p-0 gap-8">
              <TabsTrigger 
                value="overview" 
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f37920] data-[state=active]:bg-transparent data-[state=active]:text-[#00458c] font-bold text-sm px-2 transition-all"
              >
                Snapshot
              </TabsTrigger>
              <TabsTrigger 
                value="review" 
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f37920] data-[state=active]:bg-transparent data-[state=active]:text-[#00458c] font-bold text-sm px-2 transition-all"
              >
                Portfolio Review & Rebalancing
              </TabsTrigger>
              <TabsTrigger 
                value="alerts" 
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f37920] data-[state=active]:bg-transparent data-[state=active]:text-[#00458c] font-bold text-sm px-2 transition-all"
              >
                Compliance Alerts
              </TabsTrigger>
              <TabsTrigger 
                value="crm" 
                className="h-14 rounded-none border-b-2 border-transparent data-[state=active]:border-[#f37920] data-[state=active]:bg-transparent data-[state=active]:text-[#00458c] font-bold text-sm px-2 transition-all"
              >
                CRM & Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <TabsContent value="overview" className="m-0 space-y-6">
               <div className="grid grid-cols-3 gap-6">
                  <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Portfolio Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-4xl font-black text-emerald-600 tracking-tight">{client.healthScore}%</p>
                       <p className="text-[11px] text-slate-500 font-medium mt-1">Excellent - No critical gaps detected</p>
                    </CardContent>
                  </Card>
                  {/* More summary cards could go here */}
               </div>
            </TabsContent>

            <TabsContent value="review" className="m-0 space-y-8">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <RefreshCcw className="h-8 w-8 text-[#00458c] animate-spin" />
                  <p className="text-[#00458c] font-bold">Analyzing holdings...</p>
                </div>
              ) : reviewData ? (
                <>
                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-none shadow-md bg-slate-50/50">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-sm font-bold text-[#00458c]">Current Asset Allocation</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[280px] pt-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reviewData.currentAllocation}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {reviewData.currentAllocation.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value: number) => [`${value}%`, 'Allocation']}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md bg-slate-50/50">
                      <CardHeader className="pb-0">
                        <CardTitle className="text-sm font-bold text-[#f37920]">Target Model Allocation</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[280px] pt-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reviewData.targetAllocation}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {reviewData.targetAllocation.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value: number) => [`${value}%`, 'Target']}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Rebalancing Strategy */}
                  <div className="space-y-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Rebalancing Action Plan</h3>
                        <p className="text-sm text-slate-500 font-medium">Step-by-step roadmap to realign with the target {reviewData.persona} model.</p>
                      </div>
                      <Badge className="bg-orange-100 text-[#f37920] border-orange-200 px-4 py-1.5 font-bold gap-2">
                        <AlertCircle className="h-3.5 w-3.5" /> High Priority
                      </Badge>
                    </div>

                    <Card className="border shadow-sm overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-bold text-[#00458c] text-[11px] uppercase tracking-widest pl-6">Action</TableHead>
                            <TableHead className="font-bold text-[#00458c] text-[11px] uppercase tracking-widest">Asset Class</TableHead>
                            <TableHead className="font-bold text-[#00458c] text-[11px] uppercase tracking-widest">Target Adjustment</TableHead>
                            <TableHead className="font-bold text-[#00458c] text-[11px] uppercase tracking-widest text-right pr-6">Estimated Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reviewData.actionPlan.length > 0 ? (
                            reviewData.actionPlan.map((action: any, i: number) => (
                              <TableRow key={i} className="hover:bg-slate-50/50">
                                <TableCell className="pl-6">
                                  <Badge className={`${
                                    action.action === 'BUY' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                                  } font-bold px-3 py-1`}>
                                    {action.action}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-bold text-slate-800">{action.assetClass}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {action.action === 'BUY' ? (
                                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="text-xs font-semibold text-slate-600">Rebalancing to target</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right pr-6 font-black text-slate-900">
                                  {formatCurrency(action.amount)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-10">
                                <div className="flex flex-col items-center gap-3">
                                  <CheckCircle2 className="h-8 w-8 text-emerald-200" />
                                  <p className="text-sm font-bold text-slate-600">Portfolio is already in-line with target allocation.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                      <div className="h-10 w-10 bg-[#00458c] rounded-xl flex items-center justify-center shrink-0">
                        <Info className="h-5 w-5 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-[#00458c]">Advisor Insight</h4>
                        <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                          The current portfolio is overweight in {reviewData.currentAllocation[0].value > reviewData.targetAllocation[0].value ? 'Equity' : 'Debt'} by {Math.abs(reviewData.currentAllocation[0].value - reviewData.targetAllocation[0].value).toFixed(1)}%. 
                          Executing the above rebalancing trades will mitigate risk and ensure the client's long-term strategy remains on track.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="alerts" className="m-0 h-64 flex items-center justify-center">
               <p className="text-slate-400 font-medium">Compliance verification reports will appear here.</p>
            </TabsContent>

            <TabsContent value="crm" className="m-0 space-y-6">
               <div className="grid grid-cols-10 gap-8 h-full">
                  {/* Left Column: Timeline (60%) */}
                  <div className="col-span-6 border-r border-slate-100 pr-8">
                     <div className="flex items-center gap-3 mb-6">
                        <MessageSquare className="h-5 w-5 text-[#00458c]" />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Activity Timeline</h3>
                     </div>
                     <ActivityTimeline clientId={client.id} />
                  </div>

                  {/* Right Column: Document Vault (40%) */}
                  <div className="col-span-4">
                     <div className="flex items-center gap-3 mb-6">
                        <FileText className="h-5 w-5 text-[#f37920]" />
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Document Vault</h3>
                     </div>
                     <DocumentVault clientId={client.id} />
                  </div>
               </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailModal;
