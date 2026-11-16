import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

type AdvisorRow = {
  id: string;
  name: string;
  email: string;
  assigned_clients: number;
  aum_managed: number;
  status: string;
};

const PartnerAdvisorManagement: React.FC = () => {
  const [advisors, setAdvisors] = useState<AdvisorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdvisors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/partner/advisors');
      if (data.success) setAdvisors(data.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load advisors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdvisors(); }, []);

  const filteredAdvisors = useMemo(() => {
    if (!searchQuery.trim()) return advisors;
    const query = searchQuery.toLowerCase();
    return advisors.filter(a => 
      a.name?.toLowerCase().includes(query) || 
      a.email?.toLowerCase().includes(query)
    );
  }, [advisors, searchQuery]);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) return toast.error('Name and email required');
    try {
      const { data } = await api.post('/partner/advisors/invite', { name: inviteName, email: inviteEmail });
      if (data.success) {
        toast.success('Invitation sent');
        setIsInviteOpen(false);
        setInviteEmail('');
        setInviteName('');
        fetchAdvisors();
      }
    } catch (err: any) {
      toast.error(err.message || 'Invite failed');
    }
  };

  const formatAUM = (value: number | null | undefined) => {
    if (value == null) return '₹0';
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Advisor Management</h1>
        <Button onClick={() => setIsInviteOpen(true)}>+ Invite Advisor</Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm pl-10 pr-4 py-2 border rounded-md"
        />
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Advisor Name</th>
              <th className="p-4">Email</th>
              <th className="p-4 text-right">Active Clients</th>
              <th className="p-4 text-right">Total AUM</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr>
            )}
            {!loading && filteredAdvisors.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center">No advisors found</td></tr>
            )}
            {filteredAdvisors.map(a => (
              <tr key={a.id} className="border-t">
                <td className="p-4 font-semibold">{a.name}</td>
                <td className="p-4 text-sm text-slate-600">{a.email}</td>
                <td className="p-4 text-right">{a.assigned_clients ?? 0}</td>
                <td className="p-4 text-right">{formatAUM(a.aum_managed)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    a.status === 'active' ? 'bg-green-100 text-green-700' : 
                    a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {a.status || 'unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Advisor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input className="w-full border rounded p-2 mt-1" value={inviteName} onChange={e => setInviteName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input className="w-full border rounded p-2 mt-1" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite}>Send Invite</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerAdvisorManagement;