import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calculator, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Info, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";
import TopNav from "@/components/TopNav";
import SubNav from "@/components/SubNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { optimizeTax, TaxOptimizationResult, TaxInput } from "@/services/tax";

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

const TaxPlanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxOptimizationResult | null>(null);

  const [formData, setFormData] = useState<TaxInput>({
    annual_income: 0,
    is_salaried: true,
    investments_80c: 0,
    health_insurance_80d: 0,
    nps_80ccd_1b: 0,
    hra_exemption: 0,
    home_loan_interest_u_s24b: 0,
    other_deductions: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: parseFloat(value) || 0
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_salaried: checked }));
  };

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = await optimizeTax(formData);
      setResult(data);
      setStep(5);
    } catch (err: any) {
      toast({
        title: "Calculation failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <SubNav />

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Tax Planner & Optimizer (FY 2024-25)
          </h1>
          <p className="text-muted-foreground">
            Optimize your tax liability between Old and New Regimes based on latest Budget 2024 updates.
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-primary">Step {step} of {totalSteps}</span>
            <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Step 1: Income */}
          {step === 1 && (
            <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Step 1: Income Details</h3>
                <p className="text-sm text-muted-foreground">Start with your gross annual earnings.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="annual_income">Gross Annual Income (₹)</Label>
                  <Input 
                    id="annual_income" 
                    type="number" 
                    placeholder="e.g. 1500000" 
                    value={formData.annual_income || ""} 
                    onChange={handleInputChange}
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">Include your basic, allowance, and any other income sources.</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Salaried Professional?</Label>
                    <p className="text-sm text-muted-foreground">
                      This enables Standard Deduction (₹75k for New, ₹50k for Old).
                    </p>
                  </div>
                  <Switch 
                    checked={formData.is_salaried} 
                    onCheckedChange={handleSwitchChange} 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={nextStep} className="gap-2">
                  Next: Deductions <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: 80C & 80D */}
          {step === 2 && (
            <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Step 2: Common Deductions</h3>
                <p className="text-sm text-muted-foreground">Investments that help you save tax in the Old Regime.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="investments_80c">Section 80C Investments (₹)</Label>
                  <Input 
                    id="investments_80c" 
                    type="number" 
                    placeholder="EPF, LIC, ELSS, PPF..." 
                    value={formData.investments_80c || ""} 
                    onChange={handleInputChange} 
                  />
                  <p className="text-xs text-muted-foreground italic">Excludes HRA. Max allowed: ₹1,50,000</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="health_insurance_80d">Health Insurance - 80D (₹)</Label>
                  <Input 
                    id="health_insurance_80d" 
                    type="number" 
                    placeholder="Premium for self/family" 
                    value={formData.health_insurance_80d || ""} 
                    onChange={handleInputChange} 
                  />
                  <p className="text-xs text-muted-foreground italic">Max ₹25k (Self) + ₹50k (Sr Citizen parents)</p>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} className="gap-2">
                  Next: Housing <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: Housing */}
          {step === 3 && (
            <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Step 3: Housing Benefits</h3>
                <p className="text-sm text-muted-foreground">Exemptions related to rent or home loans.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hra_exemption">HRA Exemption (₹)</Label>
                  <Input 
                    id="hra_exemption" 
                    type="number" 
                    placeholder="Calculated HRA exemption" 
                    value={formData.hra_exemption || ""} 
                    onChange={handleInputChange} 
                  />
                  <p className="text-xs text-muted-foreground italic">Applicable if you receive HRA and pay rent.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="home_loan_interest_u_s24b">Home Loan Interest - 24(b) (₹)</Label>
                  <Input 
                    id="home_loan_interest_u_s24b" 
                    type="number" 
                    placeholder="Interest paid on home loan" 
                    value={formData.home_loan_interest_u_s24b || ""} 
                    onChange={handleInputChange} 
                  />
                  <p className="text-xs text-muted-foreground italic">Max disallowed for self-occupied: ₹2L</p>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={nextStep} className="gap-2">
                  Next: Other Benefits <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Others */}
          {step === 4 && (
            <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Step 4: Additional Deductions</h3>
                <p className="text-sm text-muted-foreground">Final set of exemptions like NPS or Education Loans.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nps_80ccd_1b">NPS Contribution - 80CCD(1B) (₹)</Label>
                  <Input 
                    id="nps_80ccd_1b" 
                    type="number" 
                    placeholder="Additional NPS investment" 
                    value={formData.nps_80ccd_1b || ""} 
                    onChange={handleInputChange} 
                  />
                  <p className="text-xs text-muted-foreground italic">Exclusive deduction max: ₹50,000</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other_deductions">Other Deductions (₹)</Label>
                  <Input 
                    id="other_deductions" 
                    type="number" 
                    placeholder="80G, 80E, 80TTA..." 
                    value={formData.other_deductions || ""} 
                    onChange={handleInputChange} 
                  />
                  <p className="text-xs text-muted-foreground italic">Education loan interest, Savings interest, etc.</p>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={prevStep} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  {loading ? "Calculating..." : "Optimize & Compare"} <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 5: Results */}
          {step === 5 && result && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              {/* Recommendation Banner */}
              <Card className={`p-6 border-2 ${result.recommendedRegime === 'NEW' ? 'border-primary bg-primary/5' : 'border-accent bg-accent/5'}`}>
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">
                      Recommendation: {result.recommendedRegime === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'}
                    </h2>
                    <p className="text-lg opacity-90 mt-1">
                      You can save <span className="font-bold">{formatCurrency(result.savings)}</span> every year by choosing this regime.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setStep(1)} size="sm">Edit Inputs</Button>
                </div>
              </Card>

              {/* Side by Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[result.newRegime, result.oldRegime].map((reg, idx) => (
                  <Card key={reg.regime} className={`p-6 relative overflow-hidden ${reg.regime === result.recommendedRegime ? 'ring-2 ring-primary' : 'opacity-80'}`}>
                    {reg.regime === result.recommendedRegime && (
                      <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                        Best Value
                      </div>
                    )}
                    <h3 className="text-xl font-bold mb-4">{reg.regime === 'NEW' ? 'New Regime (Simplified)' : 'Old Regime (Exemption-heavy)'}</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gross Income</span>
                        <span>{formatCurrency(reg.gross_income)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deductions Applied</span>
                        <span className="text-loss">(-){formatCurrency(reg.standard_deduction + reg.other_deductions)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Taxable Income</span>
                        <span>{formatCurrency(reg.taxable_income)}</span>
                      </div>
                      
                      <div className="bg-secondary/30 p-4 rounded-lg mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Base Tax</span>
                          <span>{formatCurrency(reg.base_tax)}</span>
                        </div>
                        {reg.rebate_87a > 0 && (
                          <div className="flex justify-between text-sm text-primary">
                            <span>Rebate 87A</span>
                            <span>(-){formatCurrency(reg.rebate_87a)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Cess (4%)</span>
                          <span>{formatCurrency(reg.cess)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-xl font-bold text-foreground">
                          <span>Total Annual Tax</span>
                          <span>{formatCurrency(reg.total_tax)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-muted rounded">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Monthly Tax</p>
                          <p className="text-lg font-bold">{formatCurrency(reg.monthly_tax)}</p>
                        </div>
                        <div className="p-3 bg-muted rounded">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Monthly Take-home</p>
                          <p className="text-lg font-bold">{formatCurrency(reg.take_home_monthly)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Gap Analysis / Advice */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">Optimization Summary & Gap Analysis</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {result.gap80C! > 0 && (
                    <div className="border border-amber-200 bg-amber-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
                        <AlertCircle className="h-4 w-4" /> 80C Gap: {formatCurrency(result.gap80C!)}
                      </div>
                      <p className="text-xs text-amber-700">
                        You can reduce your taxable income further by investing in ELSS, PPF, or EPF.
                      </p>
                    </div>
                  )}

                  {result.gapNPS! > 0 && (
                    <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                        <CheckCircle2 className="h-4 w-4" /> NPS Opportunity
                      </div>
                      <p className="text-xs text-blue-700">
                        Invest ₹50k in NPS Tier 1 for additional tax relief under Section 80CCD(1B).
                      </p>
                    </div>
                  )}

                  <div className="border border-primary/20 bg-primary/5 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                      <Info className="h-4 w-4" /> Standard Deduction
                    </div>
                    <p className="text-xs text-primary/80">
                      We've automatically applied the {formData.is_salaried ? formatCurrency(75000) : "₹0"} deduction.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded border border-dashed text-center">
                  <p className="text-sm text-muted-foreground">
                    This report is for advisory purposes only. Consult a qualified Tax Advisor before making any final decisions.
                  </p>
                </div>
              </Card>

              <div className="flex justify-center pt-6">
                <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
                   Return to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TaxPlanner;
