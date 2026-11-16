import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar, 
  Search,
  LayoutDashboard,
  Users,
  CheckCircle2,
  TrendingUp,
  Loader2,
  Trash2,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// ── Types ──────────────────────────────────────────────────────────────────
interface Prospect {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  stage: 'Prospect' | 'Documentation' | 'KYC' | 'Funded';
  estimated_aum: string | number;
  notes: string;
  last_contact: string;
  created_at: string;
}

const STAGES = [
  { id: 'Prospect', label: 'Initial Leads', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { id: 'Documentation', label: 'Documentation', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'KYC', label: 'KYC Verification', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'Funded', label: 'Funding / Setup', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
];

const OnboardingPipeline = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    estimated_aum: '',
    notes: ''
  });

  const fetchProspects = async () => {
    try {
      const { data } = await api.get('/rm/onboarding');
      if (data.success) {
        setProspects(data.data);
      }
    } catch (err) {
      console.error('Fetch Prospects Error', err);
      toast({ title: 'Pipeline Error', description: 'Failed to load onboarding leads.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  const handleAddProspect = async () => {
    if (!formData.full_name) return;
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/rm/onboarding', {
          ...formData,
          estimated_aum: parseFloat(formData.estimated_aum) || 0
      });
      if (data.success) {
        setProspects([data.data, ...prospects]);
        setIsAddModalOpen(false);
        setFormData({ full_name: '', email: '', mobile: '', estimated_aum: '', notes: '' });
        toast({ title: 'Lead Added', description: `${formData.full_name} is now in the pipeline.` });
      }
    } catch (err) {
      toast({ title: 'Add Failed', description: 'Could not create lead entry.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveStage = async (id: string, currentStage: string) => {
    const stageIndex = STAGES.findIndex(s => s.id === currentStage);
    if (stageIndex === STAGES.length - 1) return; // Already at final stage
    
    const nextStage = STAGES[stageIndex + 1].id;
    setMovingId(id);
    
    try {
      const { data } = await api.patch(`/rm/onboarding/${id}`, { stage: nextStage });
      if (data.success) {
        setProspects(prev => prev.map(p => p.id === id ? { ...p, stage: nextStage as any } : p));
        toast({ title: 'Stage Updated', description: `Moved to ${STAGES[stageIndex + 1].label}` });
      }
    } catch (err) {
      toast({ title: 'Update Failed', description: 'Could not update pipeline stage.', variant: 'destructive' });
    } finally {
      setMovingId(null);
    }
  };

  const handleDeleteProspect = async (id: string) => {
    try {
      await api.delete(`/api/rm/onboarding/${id}`);
      setProspects(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Lead Removed' });
    } catch (err) {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  };

  const formatCurrency = (val: string | number) => {
    const amt = parseFloat(val.toString());
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(1)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(1)} L`;
    return `₹${amt.toLocaleString()}`;
  };

  const getStageProspects = (stageId: string) => prospects.filter(p => p.stage === stageId);
  const getStageTotal = (stageId: string) => 
    getStageProspects(stageId).reduce((sum, p) => sum + parseFloat(p.estimated_aum.toString()), 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* ── Dashboard Header ── */}
      <div className="bg-white border-b px-10 py-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-6 text-[#00458c] hover:bg-transparent"
                onClick={() => navigate('/rm/dashboard')}
              >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Advisor Dashboard
              </Button>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-black text-slate-800">Onboarding Pipeline</span>
           </div>
           <h1 className="text-2xl font-black text-[#00458c] tracking-tight">Lead Lifecycle Management</h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pipeline Value</p>
              <p className="text-lg font-black text-emerald-600">
                {formatCurrency(prospects.reduce((sum, p) => sum + parseFloat(p.estimated_aum.toString()), 0))}
              </p>
           </div>
           <Button 
             onClick={() => setIsAddModalOpen(true)}
             className="bg-[#f37920] hover:bg-[#e06b18] text-white font-bold rounded-2xl px-6 py-6 shadow-xl shadow-orange-900/10 flex items-center gap-2"
           >
              <UserPlus className="h-5 w-5" />
              Add New Lead
           </Button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <main className="flex-1 p-8 h-full overflow-hidden">
        <div className="flex gap-6 h-full overflow-x-auto pb-4 scrollbar-hide">
          {STAGES.map((stage) => {
            const items = getStageProspects(stage.id);
            const total = getStageTotal(stage.id);
            
            return (
              <div key={stage.id} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col gap-6">
                {/* Stage Header */}
                <div className="px-2 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border shadow-sm ${stage.color}`}>
                         {items.length}
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">{stage.label}</h3>
                   </div>
                   {total > 0 && (
                     <Badge variant="outline" className="bg-white text-[10px] font-black tracking-tight text-slate-400 border-slate-100">
                        {formatCurrency(total)}
                     </Badge>
                   )}
                </div>

                {/* Column Body */}
                <div className="flex-1 bg-slate-100/40 rounded-[2rem] p-4 space-y-4 overflow-y-auto scrollbar-hide border border-slate-50">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-32 w-full bg-white rounded-2xl animate-pulse shadow-sm" />
                    ))
                  ) : items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-4">
                       <ArrowRight className="h-8 w-8 mb-3 text-slate-400 rotate-[-45deg]" />
                       <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Stage Clear - Move leads forward</p>
                    </div>
                  ) : (
                    items.map((prospect) => (
                      <Card key={prospect.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
                        <CardContent className="p-5">
                           <div className="flex justify-between items-start mb-4">
                              <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{prospect.full_name}</h4>
                              <button 
                                onClick={() => handleDeleteProspect(prospect.id)}
                                className="text-slate-200 hover:text-red-500 transition-colors"
                              >
                                 <Trash2 className="h-3.5 w-3.5" />
                              </button>
                           </div>

                           <div className="space-y-3">
                              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                 <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                 Target: <span className="text-slate-900">{formatCurrency(prospect.estimated_aum)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                 <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                 Last Contact: <span className="text-slate-700">{new Date(prospect.last_contact).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                              </div>
                           </div>

                           {prospect.notes && (
                             <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[10px] font-medium text-slate-500 line-clamp-2 italic">
                                "{prospect.notes}"
                             </div>
                           )}

                           <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex gap-2">
                                 {prospect.mobile && (
                                   <div className="w-7 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#00458c] cursor-pointer shadow-sm">
                                      <Phone className="h-3.5 w-3.5" />
                                   </div>
                                 )}
                                 {prospect.email && (
                                   <div className="w-7 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#00458c] cursor-pointer shadow-sm">
                                      <Mail className="h-3.5 w-3.5" />
                                   </div>
                                 )}
                              </div>

                              {stage.id !== 'Funded' && (
                                <Button 
                                  size="sm" 
                                  disabled={movingId === prospect.id}
                                  onClick={() => handleMoveStage(prospect.id, prospect.stage)}
                                  className="h-8 rounded-lg bg-slate-900 hover:bg-black text-[10px] font-black uppercase tracking-widest px-3 flex items-center gap-2"
                                >
                                   {movingId === prospect.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                                   Move Stage
                                </Button>
                              )}
                           </div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Add Prospect Modal ── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl overflow-hidden">
             <DialogHeader>
                <DialogTitle className="text-2xl font-black text-slate-900">Add Pipeline Prospect</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500 mt-2">
                   Initialize a new lead into your professional onboarding funnel.
                </DialogDescription>
             </DialogHeader>

             <div className="space-y-6 py-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name *</label>
                   <Input 
                     placeholder="e.g. Rahul Sharma"
                     className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 placeholder:text-slate-300 px-5"
                     value={formData.full_name}
                     onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                     <Input 
                        placeholder="rahul@example.com"
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 placeholder:text-slate-300 px-5"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile</label>
                     <Input 
                        placeholder="+91 98765 43210"
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 placeholder:text-slate-300 px-5"
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                     />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Wealth AUM (₹)</label>
                   <Input 
                     type="number"
                     placeholder="e.g. 5000000"
                     className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-[#00458c] placeholder:text-slate-300 px-5"
                     value={formData.estimated_aum}
                     onChange={(e) => setFormData({...formData, estimated_aum: e.target.value})}
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Advisory Notes</label>
                   <Textarea 
                      placeholder="e.g. Interested in High-Yield Debt and LAS features."
                      className="min-h-[100px] rounded-2xl bg-slate-50 border-none font-bold text-slate-800 placeholder:text-slate-300 p-5 px-5"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                   />
                </div>
             </div>

             <DialogFooter className="flex items-center gap-4 mt-4">
                <Button 
                   variant="ghost" 
                   className="flex-1 rounded-2xl h-14 font-black text-slate-400 uppercase tracking-widest text-xs"
                   onClick={() => setIsAddModalOpen(false)}
                >
                   Discard
                </Button>
                <Button 
                   disabled={isSubmitting || !formData.full_name}
                   onClick={handleAddProspect}
                   className="flex-[1.5] bg-[#00458c] hover:bg-[#00356c] h-14 rounded-2xl font-black shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                   {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                   Initialize Lead
                </Button>
             </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingPipeline;
