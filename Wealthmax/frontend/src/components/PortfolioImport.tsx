import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, FileSpreadsheet, KeyRound, Search, Plus, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface PortfolioImportProps {
    onSuccess: () => void;
}

export default function PortfolioImport({ onSuccess }: PortfolioImportProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("cas");
    const [loading, setLoading] = useState(false);

    // CAS Tab State
    const [casFile, setCasFile] = useState<File | null>(null);
    const [casPassword, setCasPassword] = useState("");
    const [dragActive, setDragActive] = useState(false);

    // Manual Tab State
    // Manual Tab State
    const [manualRows, setManualRows] = useState([{ id: 1, isin: "", type: "EQUITY", quantity: "", price: "", average_price: "" }]);

    // CSV Tab State
    const [csvFile, setCsvFile] = useState<File | null>(null);

    // ── Drag & Drop Handlers ──
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (activeTab === "cas") setCasFile(e.dataTransfer.files[0]);
            if (activeTab === "csv") setCsvFile(e.dataTransfer.files[0]);
        }
    };

    // ── Upload CAS ──
    const handleUploadCAS = async () => {
        if (!casFile) {
            toast({ title: "Error", description: "Please select a CAS PDF file", variant: "destructive" });
            return;
        }
        if (!casPassword) {
            toast({ title: "Error", description: "CAS PDF password is required", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", casFile);
            formData.append("password", casPassword);

            const { data } = await api.post('/portfolio/upload-cas', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: "Success",
                description: data.message || "CAS parsed and portfolio updated successfully",
            });
            setOpen(false);
            onSuccess();
        } catch (err: any) {
            toast({
                title: "Import Failed",
                description: err.response?.data?.message || err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Predefined CSV Upload ──
    const handleUploadCSV = async () => {
        if (!csvFile) {
            toast({ title: "Error", description: "Please select a CSV file", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                try {
                    const { data } = await api.post('/portfolio/upload-csv', { csv: text });
                    toast({ title: "Success", description: data.message });
                    setOpen(false);
                    onSuccess();
                } catch (err: any) {
                    toast({ title: "CSV Error", description: err.response?.data?.message || err.message, variant: "destructive" });
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsText(csvFile);
        } catch (err: any) {
            toast({ title: "Import Failed", description: err.message, variant: "destructive" });
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "isin,asset_type,quantity,average_price\n";
        const sample = "INE002A01018,EQUITY,10,2500.50\nINF200K01171,MUTUAL_FUND,500,150.25";
        const blob = new Blob([headers + sample], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "wealthmax_portfolio_template.csv";
        a.click();
    };

    // ── Manual Import ──
    const handleSaveManual = async () => {
        // filter out empty rows
        const validRows = manualRows.filter(r => r.isin.trim() !== "" && r.quantity !== "");
        if (validRows.length === 0) {
            toast({ title: "Error", description: "Please fill out at least one holding", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            // Add rows one by one
            for (const row of validRows) {
                await api.post('/portfolio/manual', {
                    isin: row.isin,
                    asset_type: row.type,
                    quantity: parseFloat(row.quantity),
                    average_price: row.average_price ? parseFloat(row.average_price) : undefined
                });
            }
            toast({ title: "Success", description: `Added ${validRows.length} holding(s)` });
            setOpen(false);
            onSuccess();
        } catch (err: any) {
            toast({ title: "Save Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#f37920] hover:bg-[#d96815] text-white">
                    <Plus className="w-4 h-4 mr-2" /> Import Portfolio
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden font-sans border-0 shadow-2xl">

                {/* ── Header ── */}
                <div className="bg-[#00458c] p-6 text-white text-center">
                    <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
                        <Lock className="w-6 h-6 text-blue-100" />
                    </div>
                    <h2 className="text-xl font-extrabold mb-1">Import Your Portfolio</h2>
                    <p className="text-[13px] text-blue-100/80 font-medium">Secured by AES-256 encryption. Read-only access to activate your Financial Health Score.</p>
                </div>

                {/* ── Tabs ── */}
                <div className="p-6 bg-gray-50/50">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-gray-200/50 p-1 rounded-lg mb-6">
                            <TabsTrigger value="cas" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#00458c] data-[state=active]:font-bold data-[state=active]:shadow-sm text-xs">
                                Upload CAS (PDF)
                            </TabsTrigger>
                            <TabsTrigger value="csv" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#00458c] data-[state=active]:font-bold data-[state=active]:shadow-sm text-xs">
                                Upload CSV
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#00458c] data-[state=active]:font-bold data-[state=active]:shadow-sm text-xs">
                                Add Manually
                            </TabsTrigger>
                        </TabsList>

                        {/* ────────────────────────────────────────────────────────
                            TAB 1: CAS UPLOAD 
                        ───────────────────────────────────────────────────────── */}
                        <TabsContent value="cas" className="mt-0">
                            <div
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors bg-white
                                    ${dragActive ? "border-[#00458c] bg-[#00458c]/5" : "border-gray-200 hover:border-gray-300"}`}
                            >
                                <div className="w-14 h-14 bg-blue-50 text-[#00458c] rounded-2xl flex items-center justify-center mb-4">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 mb-1">
                                    {casFile ? casFile.name : "Drag & drop your CAS PDF here"}
                                </h3>
                                <p className="text-[11px] text-gray-500 max-w-[280px] text-center mb-4">
                                    {casFile ? `${(casFile.size / 1024 / 1024).toFixed(2)} MB` : "NSDL/CDSL Consolidated Account Statement"}
                                </p>
                                <Input
                                    type="file" accept=".pdf" className="hidden" id="cas-upload"
                                    onChange={(e) => e.target.files && setCasFile(e.target.files[0])}
                                />
                                <Label htmlFor="cas-upload" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                                    Browse Files
                                </Label>
                            </div>

                            <a href="#" className="block text-center mt-3 text-[11px] font-bold text-[#00458c] hover:underline">
                                How do I download my CAS?
                            </a>

                            <div className="mt-5 space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 ml-1">
                                    <KeyRound className="w-3.5 h-3.5 text-gray-400" /> CAS Password
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="Usually your PAN (Uppercase)"
                                    className="h-11 bg-white"
                                    value={casPassword}
                                    onChange={(e) => setCasPassword(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full mt-6 h-12 bg-[#f37920] hover:bg-[#d96815] text-white font-bold text-sm shadow-md"
                                onClick={handleUploadCAS} disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Process Statement"}
                            </Button>
                        </TabsContent>

                        {/* ────────────────────────────────────────────────────────
                            TAB 2: CSV UPLOAD 
                        ───────────────────────────────────────────────────────── */}
                        <TabsContent value="csv" className="mt-0">
                            <div
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                className="border-2 border-dashed border-gray-200 bg-white rounded-xl p-8 flex flex-col items-center justify-center hover:border-gray-300 transition-colors"
                            >
                                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                                    <FileSpreadsheet className="w-7 h-7" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 mb-1">
                                    {csvFile ? csvFile.name : "Drag & drop your CSV file here"}
                                </h3>
                                <p className="text-[11px] text-gray-500 max-w-[280px] text-center mb-4">
                                    {csvFile ? `${(csvFile.size / 1024).toFixed(2)} KB` : "Ensure columns match ISIN, Asset_Type, Quantity, Average_Price."}
                                </p>
                                <Input
                                    type="file" accept=".csv" className="hidden" id="csv-upload"
                                    onChange={(e) => e.target.files && setCsvFile(e.target.files[0])}
                                />
                                <div className="flex gap-2">
                                    <Label htmlFor="csv-upload" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                                        Browse Files
                                    </Label>
                                    <Button variant="ghost" className="text-[10px] h-8 text-[#00458c] font-bold" onClick={downloadTemplate}>
                                        Download Template
                                    </Button>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-6 h-12 bg-[#f37920] hover:bg-[#d96815] text-white font-bold text-sm shadow-md flex items-center gap-2"
                                onClick={handleUploadCSV} disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <><UploadCloud className="w-4 h-4" /> Upload & Map Data</>
                                )}
                            </Button>
                        </TabsContent>

                        {/* ────────────────────────────────────────────────────────
                            TAB 3: MANUAL ENTRY
                        ───────────────────────────────────────────────────────── */}
                        <TabsContent value="manual" className="mt-0">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="grid grid-cols-[1fr_70px_80px_80px_35px] gap-1.5 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">ISIN / Scrip</div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Type</div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Qty</div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Avg Price</div>
                                    <div />
                                </div>
                                <div className="p-2 space-y-2 max-h-[220px] overflow-y-auto">
                                    {manualRows.map((row, i) => (
                                        <div key={row.id} className="grid grid-cols-[1fr_70px_80px_80px_35px] gap-1.5 items-center px-1">
                                            <div className="relative">
                                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                                <Input
                                                    placeholder="ISIN"
                                                    className="h-8 pl-7 text-[11px] bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200 transition-colors focus:bg-white"
                                                    value={row.isin}
                                                    onChange={(e) => {
                                                        const newRows = [...manualRows];
                                                        newRows[i].isin = e.target.value.toUpperCase();
                                                        setManualRows(newRows);
                                                    }}
                                                />
                                            </div>
                                            <select
                                                className="h-8 w-full rounded-md border-transparent bg-gray-50 px-1 text-[10px] font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-1 focus:ring-[#00458c]"
                                                value={row.type}
                                                onChange={(e) => {
                                                    const newRows = [...manualRows];
                                                    newRows[i].type = e.target.value;
                                                    setManualRows(newRows);
                                                }}
                                            >
                                                <option value="EQUITY">NSE</option>
                                                <option value="MUTUAL_FUND">MF</option>
                                            </select>
                                            <Input
                                                type="number"
                                                placeholder="Qty"
                                                className="h-8 text-[11px] tabular-nums bg-gray-50 border-transparent hover:bg-gray-100 transition-colors focus:bg-white text-right"
                                                value={row.quantity}
                                                onChange={(e) => {
                                                    const newRows = [...manualRows];
                                                    newRows[i].quantity = e.target.value;
                                                    setManualRows(newRows);
                                                }}
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Price"
                                                className="h-8 text-[11px] tabular-nums bg-gray-50 border-transparent hover:bg-gray-100 transition-colors focus:bg-white text-right"
                                                value={row.average_price}
                                                onChange={(e) => {
                                                    const newRows = [...manualRows];
                                                    newRows[i].average_price = e.target.value;
                                                    setManualRows(newRows);
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => setManualRows(manualRows.filter(r => r.id !== row.id))}
                                                disabled={manualRows.length === 1}
                                            >
                                                &times;
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full mt-2 text-[11px] font-semibold text-[#00458c] bg-blue-50/50 hover:bg-blue-50"
                                onClick={() => setManualRows([...manualRows, { id: Date.now(), isin: "", type: "EQUITY", quantity: "", price: "", average_price: "" }])}
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Another Asset
                            </Button>

                            <Button
                                className="w-full mt-4 h-12 bg-[#f37920] hover:bg-[#d96815] text-white font-bold text-sm shadow-md"
                                onClick={handleSaveManual} disabled={loading}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Holdings"}
                            </Button>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
