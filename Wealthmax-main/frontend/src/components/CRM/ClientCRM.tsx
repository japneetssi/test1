import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Download, Trash2 } from 'lucide-react';

type Interaction = {
  id: string;
  client_id: string;
  advisor_id: string;
  type: string;
  notes: string;
  created_at: string;
};

type DocumentMeta = {
  id: string;
  client_id: string;
  advisor_id: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
};

const ClientCRM: React.FC<{ clientId?: string }>= ({ clientId: propClientId }) => {
  const params = useParams();
  const clientId = propClientId || params.clientId;
  const toast = toast();

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [newType, setNewType] = useState<'call'|'meeting'|'email'|'note'>('meeting');

  const fetchAll = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [logsRes, docsRes] = await Promise.all([
        api.get(`/advisor/interaction-logs/${clientId}`),
        api.get(`/advisor/documents/${clientId}`),
      ]);
      if (logsRes.data?.success) setInteractions(logsRes.data.data);
      if (docsRes.data?.success) setDocuments(docsRes.data.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [clientId]);

  const handleAddLog = async () => {
    if (!clientId || !newNotes.trim()) return;
    try {
      const { data } = await api.post(`/advisor/interaction-logs/${clientId}`, { type: newType, notes: newNotes });
      if (data.success) {
        setInteractions(prev => [data.data, ...prev]);
        setNewNotes('');
        toast.success('Interaction logged');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create log');
    }
  };

  // Dropzone setup
  const onDrop = async (acceptedFiles: File[]) => {
    if (!clientId || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const form = new FormData();
    form.append('document', file, file.name);
    try {
      const { data } = await api.post(`/advisor/documents/upload/${clientId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setDocuments(prev => [data.data, ...prev]);
        toast.success('Uploaded');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const handleDownload = (doc: DocumentMeta) => {
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');
    const url = doc.url.startsWith('http') ? doc.url : `${base}${doc.url}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (id: string) => {
    // Simple client-side removal; backend delete endpoint not implemented in this task
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success('Removed from view');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column: timeline (span 2 on md) */}
      <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold mb-3">Activity Timeline</h3>

        <div className="space-y-3 mb-6">
          <div className="flex gap-2 items-start">
            <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="border p-2 rounded w-36">
              <option value="meeting">Meeting</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="note">Note</option>
            </select>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Write meeting notes, outcome, next steps..."
              className="flex-1 border rounded p-3 min-h-[90px] resize-none"
            />
            <Button onClick={handleAddLog} className="ml-2">Log</Button>
          </div>
        </div>

        <div className="border-t pt-4">
          {loading && <div className="text-sm text-slate-500">Loading...</div>}
          {!loading && interactions.length === 0 && <div className="text-sm text-slate-500">No interactions yet</div>}
          <ul className="space-y-4 mt-4">
            {interactions.map((it) => (
              <li key={it.id} className="flex items-start gap-4">
                <div className="w-10 text-center">
                  <div className="h-10 w-10 rounded-full bg-slate-100 border flex items-center justify-center text-slate-600 font-bold text-xs">{it.type.charAt(0).toUpperCase()}</div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-bold text-slate-800">{it.type.toUpperCase()}</div>
                    <div className="text-xs text-slate-400">{new Date(it.created_at).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{it.notes}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right column: Document Vault */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold mb-3">Document Vault</h3>

        <div {...getRootProps()} className={`border-2 border-dashed rounded p-6 text-center cursor-pointer ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>
          <input {...getInputProps()} />
          <p className="text-sm text-slate-600">Drag & drop a file here, or click to browse</p>
          <p className="text-xs text-slate-400 mt-2">Max 5MB per file</p>
        </div>

        <div className="mt-4 space-y-3">
          {documents.length === 0 && <div className="text-sm text-slate-500">No documents uploaded</div>}
          <ul className="space-y-2">
            {documents.map(doc => (
              <li key={doc.id} className="flex items-center justify-between border rounded p-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-sm font-bold">{doc.filename.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{doc.filename}</div>
                    <div className="text-xs text-slate-400">{new Date(doc.uploaded_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => handleDownload(doc)}><Download className="h-4 w-4" /></Button>
                  <Button variant="ghost" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClientCRM;
