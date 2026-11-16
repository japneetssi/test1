import React, { useState, useEffect, useCallback } from 'react';
import { 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  FileIcon,
  Search
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import api from '@/lib/api';
import { format } from 'date-fns';

interface DocumentVaultProps {
  clientId: string;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ clientId }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/advisor/documents/${clientId}`);
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Documents Error", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('document', acceptedFiles[0]);

    try {
      const res = await api.post(`/advisor/documents/upload/${clientId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setDocuments([res.data.data, ...documents]);
        toast.success("Document uploaded successfully");
      }
    } catch (error) {
      console.error("Upload Error", error);
      toast.error("File upload failed");
    } finally {
      setUploading(false);
    }
  }, [clientId, documents]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpg', '.jpeg', '.png']
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (mime.includes('image')) return <FileIcon className="h-6 w-6 text-emerald-500" />;
    return <File className="h-6 w-6 text-blue-500" />;
  };

  const handleDownload = (doc: any) => {
    // In dev, url is like /uploads/document-123.pdf
    // Backend is likely on PORT 3000 or similar
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}${doc.url}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.setAttribute('download', doc.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
          isDragActive ? 'border-[#00458c] bg-blue-50/50' : 'border-slate-200 hover:border-[#00458c] hover:bg-slate-50/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
           {uploading ? (
             <Loader2 className="h-8 w-8 text-[#00458c] animate-spin" />
           ) : (
             <Upload className="h-8 w-8 text-[#00458c]" />
           )}
        </div>
        <h4 className="text-sm font-bold text-slate-800">Drag & Drop Documents</h4>
        <p className="text-[11px] text-slate-400 font-medium mt-1">PDF, Word, or JPG up to 5MB</p>
      </div>

      {/* Security Badge */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none">AES-256 Encrypted Vault</span>
      </div>

      {/* Document List Header */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input 
            placeholder="Search vault..." 
            className="pl-9 h-10 border-slate-200 text-xs font-bold bg-slate-50/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {loading ? (
             <div className="flex flex-col items-center py-10 gap-2">
                <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
                <p className="text-[10px] font-bold text-slate-300">Scanning repository...</p>
             </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2 text-slate-300">
               <AlertCircle className="h-8 w-8 opacity-20" />
               <p className="text-[11px] font-medium">Vault is empty.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <Card key={doc.id} className="border-slate-100 shadow-none hover:shadow-md hover:border-blue-100 transition-all overflow-hidden group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                    {getFileIcon(doc.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[13px] font-bold text-slate-800 truncate">{doc.filename}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      {formatFileSize(doc.size)} · {format(new Date(doc.uploaded_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-[#00458c] hover:bg-blue-50"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVault;
