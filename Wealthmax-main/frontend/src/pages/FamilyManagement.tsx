import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Mail,
  Loader2,
  Wallet
} from "lucide-react";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  getFamilyDetails, 
  createFamily, 
  addFamilyMember, 
  Family, 
  FamilyMember 
} from "@/services/family";

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const FamilyManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  
  // Forms
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getFamilyDetails();
      setFamily(data);
    } catch (err: any) {
      toast({
        title: "Error fetching family",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    
    setSubmitting(true);
    try {
      const data = await createFamily(newFamilyName);
      setFamily(data);
      toast({ title: "Family Created", description: `"${newFamilyName}" Unit is now active.` });
      fetchData(); // Refresh to get members (including head)
    } catch (err: any) {
      toast({ title: "Failed to create", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setSubmitting(true);
    try {
      const result = await addFamilyMember(newMemberEmail);
      if (result.success) {
        toast({ title: "Member Added", description: result.message });
        setNewMemberEmail("");
        fetchData();
      } else {
        toast({ title: "Failed", description: result.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopNav />
        <SubNav />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <SubNav />

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Family Management
          </h1>
          <p className="text-muted-foreground">
            Group multiple individual accounts into a single family unit for consolidated advisory.
          </p>
        </div>

        {!family ? (
          /* Empty State: Create Family */
          <Card className="p-12 border-dashed border-2 flex flex-col items-center text-center space-y-6">
            <div className="bg-primary/10 p-6 rounded-full">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-bold">No Family Unit Found</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Start by creating a family unit. As the head, you can link other family member accounts to see a unified view of your family's wealth.
              </p>
            </div>
            <form onSubmit={handleCreateFamily} className="w-full max-w-sm space-y-4">
              <div className="space-y-2 text-left">
                <Label htmlFor="family_name">Family Unit Name</Label>
                <Input 
                  id="family_name" 
                  placeholder="e.g. The Smith Family" 
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Family Unit
              </Button>
            </form>
          </Card>
        ) : (
          /* Family Active: Dashboard */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Unit Info */}
              <Card className="p-6 space-y-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldCheck className="h-24 w-24" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Active Unit</p>
                    <h2 className="text-2xl font-bold">{family.name}</h2>
                 </div>
                 <Separator />
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Created On</span>
                       <span className="font-medium">{new Date(family.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Unique ID</span>
                       <span className="font-mono text-[10px]">{family.id}</span>
                    </div>
                 </div>
              </Card>

              {/* Add Member */}
              <Card className="p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                   <UserPlus className="h-4 w-4 text-primary" />
                   Add New Member
                </h3>
                <form onSubmit={handleAddMember} className="space-y-4">
                   <div className="space-y-2">
                      <Label htmlFor="member_email">Account Email</Label>
                      <div className="flex gap-2">
                         <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="member_email" 
                              type="email" 
                              placeholder="member@email.com" 
                              className="pl-9"
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                            />
                         </div>
                         <Button type="submit" disabled={submitting} size="icon">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                         </Button>
                      </div>
                   </div>
                   <p className="text-[10px] text-muted-foreground italic">
                      Note: The user must already have a registered account on the platform to be added.
                   </p>
                </form>
              </Card>
            </div>

            {/* Member List */}
            <div className="space-y-4">
               <h3 className="text-xl font-bold px-1">Family Members ({family.members?.length})</h3>
               <div className="grid grid-cols-1 gap-3">
                  {family.members?.map((member) => (
                    <Card key={member.id} className="p-4 flex items-center justify-between group hover:border-primary/50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-primary">
                             {member.full_name.charAt(0)}
                          </div>
                          <div>
                             <div className="font-bold flex items-center gap-2">
                                {member.full_name}
                                {member.id === family.head_user_id && (
                                   <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <ShieldCheck className="h-3 w-3" /> Head
                                   </span>
                                )}
                             </div>
                             <div className="text-xs text-muted-foreground">{member.email}</div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-8">
                          <div className="text-right hidden md:block">
                             <div className="text-[10px] text-muted-foreground uppercase font-bold">Individual Net Worth</div>
                             <div className="font-bold flex items-center gap-1">
                                <Wallet className="h-3 w-3 text-primary" />
                                {formatCurrency(member.netWorth || 0)}
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-loss">
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>

            {/* Status Info */}
            <Card className="p-4 bg-primary/5 border-primary/20 flex gap-3 text-sm text-primary/80">
               <CheckCircle2 className="h-5 w-5 shrink-0" />
               <p>
                  You are now managing a unified family unit. This enables "Family View" in your Portfolio and Dashboard pages to see aggregated holdings.
               </p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default FamilyManagement;
