import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

type Advisor = { id: string; name: string; email: string; assigned_clients?: number; aum_managed?: number; status?: string };
type ClientRow = { id: string; name: string; email?: string };

const ReassignClients: React.FC = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [fromAdvisor, setFromAdvisor] = useState<string | null>(null);
  const [toAdvisor, setToAdvisor] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchAdvisors = async () => {
    try {
      const { data } = await api.get('/partner/advisors');
      if (data.success) setAdvisors(data.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load advisors');
    }
  };

  useEffect(() => { fetchAdvisors(); }, []);

  useEffect(() => {
    const loadClients = async () => {
      if (!fromAdvisor) { setClients([]); setSelected({}); return; }
      setLoading(true);
      try {
        const { data } = await api.get(`/partner/advisors/${fromAdvisor}/clients`);
        if (data.success) {
          setClients(data.data);
          const initial: Record<string, boolean> = {};
          (data.data || []).forEach((c: any) => { initial[c.id] = false; });
          setSelected(initial);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load clients');
      } finally { setLoading(false); }
    };
    loadClients();
  }, [fromAdvisor]);

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleTransfer = async () => {
    if (!fromAdvisor || !toAdvisor || selectedCount === 0) return toast.error('Select source, target and at least one client');
    setIsConfirmOpen(false);
    setLoading(true);
    try {
      const payload = { from_advisor_id: fromAdvisor, to_advisor_id: toAdvisor, client_ids: Object.keys(selected).filter(id => selected[id]) };
      const { data } = await api.post('/partner/advisors/reassign', payload);
      if (data.success) {
        toast.success(data.message || 'Clients reassigned');
        // refresh clients list
        setFromAdvisor(fromAdvisor); // trigger re-fetch
      }
    } catch (err: any) {
      toast.error(err.message || 'Reassign failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Reassign Clients</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow-sm">
          <label className="text-sm font-medium">Departing Advisor</label>
          <select className="w-full border rounded p-2 mt-2" value={fromAdvisor || ''} onChange={e => setFromAdvisor(e.target.value || null)}>
            <option value="">-- Select Advisor --</option>
            {advisors.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
          </select>

          <div className="mt-4">
            <div className="text-sm text-slate-500 mb-2">Assigned Clients</div>
            {loading && <div className="text-sm">Loading clients...</div>}
            {!loading && clients.length === 0 && <div className="text-sm text-slate-500">No clients</div>}
            {!loading && clients.length > 0 && (
              <div className="max-h-64 overflow-auto border rounded p-2">
                {clients.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                    <input type="checkbox" checked={!!selected[c.id]} onChange={() => toggle(c.id)} />
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <label className="text-sm font-medium">Receiving Advisor</label>
          <select className="w-full border rounded p-2 mt-2" value={toAdvisor || ''} onChange={e => setToAdvisor(e.target.value || null)}>
            <option value="">-- Select Advisor --</option>
            {advisors.filter(a => a.id !== fromAdvisor).map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
          </select>

          <div className="mt-6">
            <div className="text-sm text-slate-500 mb-2">Summary</div>
            <div className="space-y-2 text-sm">
              <div>From: <strong>{advisors.find(a => a.id === fromAdvisor)?.name || '—'}</strong></div>
              <div>To: <strong>{advisors.find(a => a.id === toAdvisor)?.name || '—'}</strong></div>
              <div>Selected Clients: <strong>{selectedCount}</strong></div>
            </div>

            <div className="mt-6">
              <Button onClick={() => setIsConfirmOpen(true)} disabled={!fromAdvisor || !toAdvisor || selectedCount === 0}>
                Transfer Selected Clients
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm reassignment</DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <p>Are you sure you want to reassign <strong>{selectedCount}</strong> client(s)? This will update their dashboards immediately.</p>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handleTransfer} disabled={loading}>Yes, Reassign</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReassignClients;
