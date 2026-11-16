import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Mail, Link, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
}

interface InviteResponse {
  inviteId: string;
  inviteToken: string;
  inviteLink: string;
  expiresAt: string;
}

export const InviteClientModal: React.FC<InviteClientModalProps> = ({ isOpen, onClose, onInviteSent }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setGeneratedLink(null);
    setSendingEmail(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canSubmit = clientName.trim().length > 0 && isValidEmail(clientEmail);

  const handleSendInvite = async (sendEmail: boolean = true) => {
    if (!canSubmit) return;

    setLoading(true);
    setSendingEmail(sendEmail);
    
    try {
      const { data } = await api.post('/advisor/invites/send', {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        sendEmail
      });

      if (data.success) {
        const inviteData = data.data as InviteResponse;
        setGeneratedLink(inviteData.inviteLink);
        
        if (sendEmail) {
          toast.success('Invitation sent successfully!');
        } else {
          toast.success('Invitation link generated!');
        }
        
        onInviteSent?.();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#00458c]" />
            Invite New Client
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Send an invitation to your prospective client to join WealthMax
          </DialogDescription>
        </DialogHeader>

        {!generatedLink ? (
          <div className="space-y-4 py-4">
            {/* Client Name Input */}
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-sm font-semibold text-slate-700">
                Client Name
              </Label>
              <Input
                id="clientName"
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-12 rounded-xl border-slate-200"
              />
            </div>

            {/* Client Email Input */}
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="text-sm font-semibold text-slate-700">
                Client Email
              </Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="h-12 rounded-xl border-slate-200"
              />
              {clientEmail && !isValidEmail(clientEmail) && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Please enter a valid email address
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleSendInvite(true)}
                disabled={!canSubmit || loading}
                className="flex-1 h-12 rounded-xl bg-[#00458c] hover:bg-blue-800 font-semibold"
              >
                {loading && sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invite Email
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleSendInvite(false)}
                disabled={!canSubmit || loading}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-slate-200 font-semibold"
              >
                {loading && !sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Generate Link Only
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-400 text-center pt-2">
              The invitation link will be valid for 7 days
            </p>
          </div>
        ) : (
          /* Generated Link Display */
          <div className="space-y-4 py-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-800">
                {sendingEmail ? 'Invitation sent successfully!' : 'Link generated successfully!'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Shareable Link
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={generatedLink}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 text-sm font-mono"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="h-12 px-4 rounded-xl border-slate-200"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Share this link via WhatsApp, SMS, or any other messaging app. 
              The client can click the link to complete their registration.
            </p>

            <DialogFooter className="pt-4">
              <Button
                onClick={handleClose}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteClientModal;
