import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, TrendingUp, Wallet, Target, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const ProposalGenerator = () => {
  const [step, setStep] = useState(0);
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState(10000);
  const [horizonYears, setHorizonYears] = useState(10);
  const [assumedCagr, setAssumedCagr] = useState(12);
  const [generating, setGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    try {
      setGenerating(true);
      toast.info("Generating PDF...");
      
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("PDF generated successfully (placeholder)!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const formatINR = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const calculateProjection = () => {
    const projectedValue = amount * Math.pow(1 + assumedCagr / 100, horizonYears);
    return projectedValue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Proposal Generator</h2>
          <p className="text-sm text-slate-500">Create customized investment proposals</p>
        </div>
      </div>

      <Tabs value={step.toString()} onValueChange={(v) => setStep(parseInt(v))}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="0" disabled={step < 0}>
            <Target className="h-4 w-4 mr-2" />
            Client & Type
          </TabsTrigger>
          <TabsTrigger value="1" disabled={step < 1}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Fund Selection
          </TabsTrigger>
          <TabsTrigger value="2" disabled={step < 2}>
            <Wallet className="h-4 w-4 mr-2" />
            Projection
          </TabsTrigger>
          <TabsTrigger value="3" disabled={step < 3}>
            <Download className="h-4 w-4 mr-2" />
            Generate PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="0" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Enter client details to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input 
                    placeholder="John Doe" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proposal Type</Label>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1">SIP</Button>
                    <Button variant="secondary" className="flex-1">Lumpsum</Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setStep(1)}>Next Step</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="1" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fund Selection</CardTitle>
              <CardDescription>Select mutual funds for the proposal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">Fund selection placeholder</p>
              <div className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={() => setStep(2)}>Next Step</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="2" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Investment Projection</CardTitle>
              <CardDescription>Enter investment parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horizon (Years)</Label>
                  <Input 
                    type="number" 
                    value={horizonYears} 
                    onChange={(e) => setHorizonYears(parseInt(e.target.value) || 10)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assumed CAGR (%)</Label>
                  <Input 
                    type="number" 
                    value={assumedCagr} 
                    onChange={(e) => setAssumedCagr(parseFloat(e.target.value) || 12)} 
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-800">
                  Projected Value: {formatINR(calculateProjection())}
                </p>
              </div>

              <div className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)}>Next Step</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Proposal</CardTitle>
              <CardDescription>Review and generate the proposal PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleGeneratePdf} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Generate PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProposalGenerator;
