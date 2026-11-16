import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  TrendingUp, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { toast } from "sonner";
import api from '@/lib/api';

interface InvestmentProposalWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
}

const InvestmentProposalWizard: React.FC<InvestmentProposalWizardProps> = ({ isOpen, onClose, clients }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [proposalType, setProposalType] = useState<'LUMPSUM' | 'SIP'>('SIP');
  const [amount, setAmount] = useState(10000);
  const [horizon, setHorizon] = useState(10);
  
  // Fund Search & Selection
  const [fundSearch, setFundSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFunds, setSelectedFunds] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (fundSearch.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        handleFundSearch();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
        setSearchResults([]);
    }
  }, [fundSearch]);

  const handleFundSearch = async () => {
    try {
      setSearching(true);
      const res = await api.get(`/mutual-funds/schemes?search=${fundSearch}&limit=5`);
      if (res.data.success) {
        setSearchResults(res.data.data);
      }
    } catch (error) {
      console.error("Fund Search Error", error);
    } finally {
      setSearching(false);
    }
  };

  const addFund = (fund: any) => {
    if (selectedFunds.find(f => f.schemeCode === fund.schemeCode)) {
      toast.error("Fund already added");
      return;
    }
    if (selectedFunds.length >= 5) {
      toast.error("Maximum 5 funds allowed per proposal");
      return;
    }
    setSelectedFunds([...selectedFunds, { ...fund, weight: 0 }]);
    setFundSearch('');
    setSearchResults([]);
  };

  const removeFund = (code: string) => {
    setSelectedFunds(selectedFunds.filter(f => f.schemeCode !== code));
  };

  const updateWeight = (code: string, weight: number) => {
    setSelectedFunds(selectedFunds.map(f => 
      f.schemeCode === code ? { ...f, weight: weight } : f
    ));
  };

  const totalWeight = selectedFunds.reduce((sum, f) => sum + (Number(f.weight) || 0), 0);

  // Projection Logic (12% CAGR)
  const generateProjectionData = () => {
    const rate = 0.12;
    const monthlyRate = rate / 12;
    const data = [];
    
    if (proposalType === 'LUMPSUM') {
      for (let i = 0; i <= horizon; i++) {
        const value = amount * Math.pow(1 + rate, i);
        data.push({ year: `Yr ${i}`, value: Math.round(value) });
      }
    } else {
      for (let i = 0; i <= horizon; i++) {
        if (i === 0) {
            data.push({ year: 'Start', value: 0 }); continue;
        }
        const n = i * 12;
        const fv = amount * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate);
        data.push({ year: `Yr ${i}`, value: Math.round(fv) });
      }
    }
    return data;
  };

  const projectionData = generateProjectionData();
  const finalValue = projectionData[projectionData.length - 1].value;

  const handleGeneratePDF = async () => {
    if (totalWeight !== 100) {
      toast.error("Total allocation must be exactly 100%");
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) {
        toast.error("Please select a client");
        return;
    }

    try {
      setGenerating(true);
      toast.info("Generating professional proposal...");
      
      const response = await api.post('/advisor/generate-proposal', {
        clientName: client.name,
        proposalType,
        amount,
        horizonYears: horizon,
        funds: selectedFunds.map(f => ({
          schemeCode: f.schemeCode.toString(),
          schemeName: f.schemeName,
          weight: f.weight
        }))
      }, { responseType: 'blob' });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Proposal_${client.name.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast.success("Proposal generated successfully!");
      onClose();
    } catch (error) {
      console.error("PDF Generation Error", error);
      toast.error("Failed to generate PDF proposal");
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl bg-white">
        
        {/* Progress Header */}
        <div className="bg-[#00458c] p-6 text-white shrink-0">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold">Investment Proposal Builder</DialogTitle>
                    <p className="text-xs text-blue-200">Generate professional white-labeled proposals in minutes</p>
                </div>
             </div>
             <div className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                Step {step} of 4
             </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
             <div 
               className="h-full bg-orange-400 transition-all duration-300" 
               style={{ width: `${(step/4) * 100}%` }} 
             />
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          
          {/* STEP 1: CONFIGURATION */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Select Client / Prospect</Label>
                    <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                      <SelectTrigger className="h-12 border-slate-200 shadow-sm focus:ring-[#00458c]">
                        <SelectValue placeholder="Choose a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Proposal Strategy</Label>
                    <div className="flex p-1 bg-slate-100 rounded-lg h-12">
                        <button 
                          onClick={() => setProposalType('SIP')}
                          className={`flex-1 flex items-center justify-center rounded-md font-bold text-sm transition-all ${proposalType === 'SIP' ? 'bg-white text-[#00458c] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monthly SIP
                        </button>
                        <button 
                          onClick={() => setProposalType('LUMPSUM')}
                          className={`flex-1 flex items-center justify-center rounded-md font-bold text-sm transition-all ${proposalType === 'LUMPSUM' ? 'bg-white text-[#00458c] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            One-time Lumpsum
                        </button>
                    </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                 <div className="flex gap-4">
                    <div className="h-12 w-12 bg-[#00458c] rounded-xl flex items-center justify-center shrink-0">
                        <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-[#00458c]">Professional Advisory</h4>
                        <p className="text-sm text-slate-600 leading-relaxed mt-1">
                            Selecting the right strategy helps in optimizing tax liability and alignment with the client's risk persona. Proposals generated are white-labeled with your agency details.
                        </p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* STEP 2: FUND SELECTION */}
          {step === 2 && (
            <div className="space-y-6">
               <div className="space-y-3 relative">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Search Mutual Funds</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Search AMC or Scheme Name..." 
                          className="pl-10 h-12 border-slate-200"
                          value={fundSearch}
                          onChange={(e) => setFundSearch(e.target.value)}
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
                        )}
                    </div>

                    {/* Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 overflow-hidden">
                            {searchResults.map(fund => (
                                <div 
                                  key={fund.schemeCode}
                                  onClick={() => addFund(fund)}
                                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex-1 pr-4">
                                        <div className="text-[13px] font-bold text-slate-800">{fund.schemeName}</div>
                                        <div className="text-[10px] text-slate-500">Code: {fund.schemeCode}</div>
                                    </div>
                                    <Plus className="h-4 w-4 text-slate-300 group-hover:text-[#00458c]" />
                                </div>
                            ))}
                        </div>
                    )}
               </div>

               <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Selected Funds Portfolio</Label>
                        <div className={`text-[11px] font-black px-2 py-1 rounded-full ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                            Total: {totalWeight}% / 100%
                        </div>
                    </div>

                    {selectedFunds.length === 0 ? (
                        <div className="h-32 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400">
                            <PieChartIcon className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs font-medium">Add 1-5 funds to build the proposal</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedFunds.map((fund, idx) => (
                                <Card key={idx} className="border-slate-100 shadow-none hover:border-slate-200 transition-colors">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="text-[13px] font-bold text-slate-800 line-clamp-1">{fund.schemeName}</div>
                                        </div>
                                        <div className="w-24 relative">
                                            <Input 
                                              type="number" 
                                              placeholder="Weight" 
                                              className="h-10 pr-6 text-right font-bold"
                                              value={fund.weight || ''}
                                              onChange={(e) => updateWeight(fund.schemeCode, parseInt(e.target.value) || 0)}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="text-slate-300 hover:text-red-500 hover:bg-red-50"
                                          onClick={() => removeFund(fund.schemeCode)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
               </div>
            </div>
          )}

          {/* STEP 3: PROJECTION */}
          {step === 3 && (
            <div className="space-y-8">
               <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500 uppercase">{proposalType === 'SIP' ? 'Monthly SIP Amount' : 'Lumpsum Amount'}</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                        <Input 
                          type="number" 
                          className="pl-8 h-12 border-slate-200 text-lg font-black"
                          value={amount}
                          onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Investment Horizon (Years)</Label>
                    <Select onValueChange={(v) => setHorizon(parseInt(v))} value={horizon.toString()}>
                      <SelectTrigger className="h-12 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 8, 10, 15, 20, 25, 30].map(y => (
                          <SelectItem key={y} value={y.toString()}>{y} Years</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Growth Projection</h4>
                        <p className="text-[11px] text-slate-400 font-medium italic mt-0.5">Estimated at 12% CAGR Assumed Capital Growth</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Final Projected Value</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(finalValue)}</p>
                    </div>
                 </div>

                 <div className="h-[280px] w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100 shadow-inner">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projectionData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis 
                              dataKey="year" 
                              fontSize={10} 
                              fontWeight="bold" 
                              stroke="#64748b" 
                              tickLine={false} 
                              axisLine={false}
                              dy={10}
                            />
                            <YAxis 
                              fontSize={9} 
                              fontWeight="bold" 
                              stroke="#64748b" 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                formatter={(val: any) => [formatCurrency(val), 'Projected Value']}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#10b981" 
                              strokeWidth={3} 
                              fillOpacity={1} 
                              fill="url(#colorValue)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && (
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp className="h-10 w-10 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Proposal Ready for Generation</h3>
                    <p className="text-sm text-slate-500 max-w-[400px] mt-2">
                        You have constructed a <strong>{proposalType}</strong> proposal with <strong>{selectedFunds.length}</strong> funds and a projected corpus of <strong>{formatCurrency(finalValue)}</strong>.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target Client</p>
                        <p className="font-bold text-slate-800">{clients.find(c => c.id === selectedClientId)?.name}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Time Horizon</p>
                        <p className="font-bold text-slate-800">{horizon} Years</p>
                    </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 italic text-[11px] text-orange-800 leading-relaxed font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-1 shrink-0" />
                    Important: Standard SEBI mutual fund disclaimers and your partner agency branding will be automatically appended to the final PDF document.
                </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-slate-50 border-t items-center justify-between">
           <div className="flex items-center gap-2">
             {step > 1 && (
                <Button 
                    variant="ghost" 
                    onClick={() => setStep(step - 1)}
                    className="gap-2 font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
             )}
           </div>

           <div className="flex items-center gap-3">
             <Button variant="ghost" onClick={onClose} className="font-bold text-slate-400">Cancel</Button>
             
             {step < 4 ? (
                <Button 
                  onClick={() => {
                      if (step === 1 && !selectedClientId) { toast.error("Select a client first"); return; }
                      if (step === 2 && selectedFunds.length === 0) { toast.error("Add at least one fund"); return; }
                      if (step === 2 && totalWeight !== 100) { toast.error("Allocation must sum to 100%"); return; }
                      setStep(step + 1);
                  }}
                  className="bg-[#00458c] hover:bg-[#00356b] min-w-[120px] font-bold gap-2"
                >
                   Next <ChevronRight className="h-4 w-4" />
                </Button>
             ) : (
                <Button 
                  onClick={handleGeneratePDF}
                  disabled={generating}
                  className="bg-[#f37920] hover:bg-[#e66c1b] min-w-[160px] font-bold gap-2 shadow-lg shadow-orange-100"
                >
                   {generating ? (
                       <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                       </>
                   ) : (
                       <>
                        <FileText className="h-4 w-4" />
                        Generate Proposal PDF
                       </>
                   )}
                </Button>
             )}
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentProposalWizard;
