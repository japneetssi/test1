import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowRight, 
  Search, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import api from '@/lib/api';

interface BulkClientReassignProps {
  advisors: any[];
  onSuccess: () => void;
}

const BulkClientReassign: React.FC<BulkClientReassignProps> = ({ advisors, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fromAdvisorId, setFromAdvisorId] = useState('');
  const [toAdvisorId, setToAdvisorId] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (fromAdvisorId) {
      fetchAdvisorClients();
    } else {
      setClients([]);
    }
  }, [fromAdvisorId]);

  const fetchAdvisorClients = async () => {
    try {
      setLoadingClients(true);
      const res = await api.get(`/partner/advisors/${fromAdvisorId}/clients`);
      if (res.data.success) {
        setClients(res.data.data);
        setSelectedClientIds([]); // Reset selection
      }
    } catch (error) {
      console.error("Fetch Advisor Clients Error", error);
      toast.error("Failed to load clients for this advisor");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleToggleClient = (clientId: string) => {
    setSelectedClientIds(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId) 
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClientIds.length === filteredClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map(c => c.id));
    }
  };

  const handleReassign = async () => {
    if (!fromAdvisorId || !toAdvisorId || selectedClientIds.length === 0) {
      toast.error("Please select advisors and at least one client");
      return;
    }

    if (fromAdvisorId === toAdvisorId) {
      toast.error("Source and destination advisors must be different");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/partner/advisors/reassign', {
        from_advisor_id: fromAdvisorId,
        to_advisor_id: toAdvisorId,
        client_ids: selectedClientIds
      });

      if (res.data.success) {
        toast.success(`Successfully reassigned ${selectedClientIds.length} clients!`);
        setIsOpen(false);
        onSuccess(); // Refresh the main roster
        // Reset local state
        setFromAdvisorId('');
        setToAdvisorId('');
        setClients([]);
      }
    } catch (error: any) {
      console.error("Reassignment Error", error);
      toast.error(error.response?.data?.message || "Failed to reassign clients");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-blue-200 text-[#00458c] hover:bg-blue-50 font-bold h-12 px-6 rounded-xl gap-2 shadow-sm">
          <Users className="h-4 w-4" /> Bulk Reassign Clients
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl bg-white">
        
        <DialogHeader className="p-8 bg-[#00458c] text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">Bulk Client Reassignment</DialogTitle>
              <DialogDescription className="text-blue-100 font-medium">
                Seamlessly transfer portfolios between advisory team members
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          
          {/* Advisor Selectors */}
          <div className="grid grid-cols-11 items-center gap-4">
            <div className="col-span-5 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departing Advisor</label>
              <Select value={fromAdvisorId} onValueChange={setFromAdvisorId}>
                <SelectTrigger className="h-12 border-slate-200 focus:ring-[#00458c] font-semibold">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  {advisors.map(adv => (
                    <SelectItem key={adv.id} value={adv.id}>{adv.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 flex justify-center mt-6">
              <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>

            <div className="col-span-5 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receiving Advisor</label>
              <Select value={toAdvisorId} onValueChange={setToAdvisorId}>
                <SelectTrigger className="h-12 border-slate-200 focus:ring-[#00458c] font-semibold">
                  <SelectValue placeholder="Select Destination" />
                </SelectTrigger>
                <SelectContent>
                  {advisors.filter(a => a.id !== fromAdvisorId).map(adv => (
                    <SelectItem key={adv.id} value={adv.id}>{adv.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Checklist Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Clients to Transfer</h3>
              {clients.length > 0 && (
                <button 
                  onClick={handleSelectAll}
                  className="text-[11px] font-bold text-[#00458c] hover:underline"
                >
                  {selectedClientIds.length === filteredClients.length ? 'Deselect All' : 'Select All Filtered'}
                </button>
              )}
            </div>

            <div className="border rounded-2xl overflow-hidden bg-slate-50/30">
              <div className="p-3 bg-white border-b relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search clients by name or email..." 
                  className="pl-10 h-10 border-slate-100 bg-slate-50/50 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!fromAdvisorId}
                />
              </div>

              <div className="max-h-[240px] overflow-y-auto p-2 space-y-1">
                {loadingClients ? (
                  <div className="h-32 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-[#00458c] animate-spin" />
                    <p className="text-xs font-bold text-slate-400">Fetching client list...</p>
                  </div>
                ) : !fromAdvisorId ? (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-300">
                    <Users className="h-8 w-8 opacity-20 mb-2" />
                    <p className="text-xs font-medium">Select a departing advisor to see their clients</p>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-300">
                    <p className="text-xs font-medium">No clients found for this advisor</p>
                  </div>
                ) : (
                  filteredClients.map(client => (
                    <div 
                      key={client.id} 
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer ${
                        selectedClientIds.includes(client.id) ? 'bg-blue-50 border border-blue-100' : 'hover:bg-white border border-transparent'
                      }`}
                      onClick={() => handleToggleClient(client.id)}
                    >
                      <Checkbox 
                        checked={selectedClientIds.includes(client.id)}
                        onCheckedChange={() => handleToggleClient(client.id)}
                        className="data-[state=checked]:bg-[#00458c] border-slate-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{client.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{client.email}</p>
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mr-2">Verified</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between px-2">
              <p className="text-[11px] font-bold text-slate-400">
                {selectedClientIds.length} of {clients.length} clients selected
              </p>
              {selectedClientIds.length > 0 && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-bold">Ready for transfer</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 border-t items-center justify-between">
          <div className="flex items-center gap-4 bg-orange-50/50 p-3 rounded-xl border border-orange-100 flex-1 mr-4">
             <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
             <p className="text-[11px] text-orange-800 leading-tight">
               Clients will be notified of the advisor reassignment and their dashboard view will update instantly.
             </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                disabled={selectedClientIds.length === 0 || !toAdvisorId || isSubmitting}
                className="bg-[#f37920] hover:bg-[#e66c1b] text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-orange-100 grow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</>
                ) : (
                  <>Reassign {selectedClientIds.length} Clients</>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-none shadow-2xl rounded-2xl overflow-hidden p-0">
              <div className="p-8 bg-orange-500 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black">Confirm Bulk Transfer?</AlertDialogTitle>
                  <AlertDialogDescription className="text-orange-50 font-medium">
                    This action will immediately move <strong>{selectedClientIds.length} clients</strong> from {advisors.find(a => a.id === fromAdvisorId)?.name} to {advisors.find(a => a.id === toAdvisorId)?.name}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                  "This updates legal accountability and fiduciary tracking for the selected portfolios."
                </p>
                <AlertDialogFooter className="pt-4 flex !justify-between">
                  <AlertDialogCancel className="h-12 rounded-xl border-slate-200 font-bold">Cancel Request</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReassign}
                    className="h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black px-8"
                  >
                    Yes, Confirm Transfer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkClientReassign;
