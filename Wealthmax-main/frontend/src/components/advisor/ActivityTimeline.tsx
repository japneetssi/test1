import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar, 
  Plus, 
  Loader2, 
  Clock,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import api from '@/lib/api';
import { format } from 'date-fns';

interface ActivityTimelineProps {
  clientId: string;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ clientId }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [type, setType] = useState('Meeting');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [clientId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/advisor/interaction-logs/${clientId}`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Logs Error", error);
      toast.error("Failed to load activity timeline");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error("Please enter some notes");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/advisor/interaction-logs/${clientId}`, {
        type,
        notes
      });
      if (res.data.success) {
        setLogs([res.data.data, ...logs]);
        setNotes('');
        toast.success("Interaction logged successfully");
      }
    } catch (error) {
      console.error("Log Interaction Error", error);
      toast.error("Failed to log interaction");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Meeting': return <Calendar className="h-4 w-4 text-emerald-500" />;
      case 'Call': return <Phone className="h-4 w-4 text-blue-500" />;
      case 'Email': return <Mail className="h-4 w-4 text-orange-500" />;
      default: return <MessageSquare className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Log Input Area */}
      <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#00458c] p-2 rounded-lg">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-700">Log New Interaction</span>
            </div>
            <div className="w-32">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 text-xs font-bold border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Note">General Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="p-4">
            <Textarea 
              placeholder="What did you discuss with the client?"
              className="min-h-[100px] border-none focus-visible:ring-0 text-sm p-0 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="p-4 bg-slate-50/30 border-t flex justify-end">
            <Button 
              type="submit" 
              disabled={submitting}
              className="bg-[#00458c] hover:bg-[#00356b] h-9 px-6 font-bold text-xs gap-2"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquare className="h-3 w-3" />}
              Save Interaction
            </Button>
          </div>
        </form>
      </Card>

      {/* Timeline List */}
      <div className="relative pl-8 space-y-6">
        {/* Vertical Line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-slate-100" />

        {loading ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <Loader2 className="h-6 w-6 text-[#00458c] animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading timeline...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3 text-slate-400">
            <Clock className="h-8 w-8 opacity-20" />
            <p className="text-xs font-medium">No interactions recorded yet.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-[33px] top-1 h-8 w-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 group-hover:border-[#00458c] transition-colors shadow-sm">
                {getIcon(log.type)}
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      log.type === 'Meeting' ? 'bg-emerald-50 text-emerald-600' :
                      log.type === 'Call' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 ml-3">
                      {format(new Date(log.created_at), 'dd MMM yyyy · h:mm a')}
                    </span>
                  </div>
                  <button className="text-slate-300 hover:text-slate-500">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {log.notes}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                   <ChevronRight className="h-3 w-3" />
                   Logged by Primary Advisor
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
