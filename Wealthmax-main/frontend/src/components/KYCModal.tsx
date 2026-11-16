import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Shield, X } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { validateAndFormatPhone, parsePhoneInput, formatPhoneForDisplay } from "@/lib/phoneUtils";

interface KYCModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentData: {
        full_name?: string;
        dob?: string;
        pan_number?: string;
        email?: string;
        mobile?: string;
        marital_status?: string;
        occupation?: string;
        retirement_age_goal?: string;
        govt_id_type?: string;
        govt_id_number?: string;
        address?: string;
        kyc_status?: string;
    };
    onSuccess: () => void;
}

type GovtIDType = 'aadhaar' | 'passport' | 'driving_license' | 'voter_id';

export default function KYCModal({ isOpen, onClose, currentData, onSuccess }: KYCModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        dob: "",
        pan_number: "",
        email: "",
        mobile: "",
        marital_status: "",
        occupation: "",
        retirement_age_goal: "",
        govt_id_type: "aadhaar" as GovtIDType,
        govt_id_number: "",
        address: ""
    });
    const [mobileError, setMobileError] = useState<string>("");
    const { toast } = useToast();

    // Initialize form with current data when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                full_name: currentData.full_name || "",
                dob: currentData.dob ? new Date(currentData.dob).toISOString().split('T')[0] : "",
                pan_number: currentData.pan_number || "",
                email: currentData.email || "",
                mobile: currentData.mobile || "",
                marital_status: currentData.marital_status || "",
                occupation: currentData.occupation || "",
                retirement_age_goal: currentData.retirement_age_goal?.toString() || "",
                govt_id_type: (currentData.govt_id_type as GovtIDType) || "aadhaar",
                govt_id_number: currentData.govt_id_number || "",
                address: currentData.address || ""
            });
        }
    }, [isOpen, currentData]);

    const handleClose = () => {
        onClose();
    };

    const validateForm = (): string | null => {
        if (formData.full_name && (!formData.full_name.trim() || formData.full_name.length < 2 || formData.full_name.length > 50)) {
            return "Full Name must be 2-50 characters";
        }
        if (formData.full_name && !/^[a-zA-Z\s]+$/.test(formData.full_name)) return "Full Name can only contain letters and spaces";
        
        if (formData.dob) {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 18) return "You must be at least 18 years old";
        }

        if (formData.mobile) {
            const phoneResult = validateAndFormatPhone(formData.mobile);
            if (!phoneResult.isValid) {
                setMobileError(phoneResult.error || 'Invalid phone number');
                return phoneResult.error || 'Invalid mobile number';
            }
            setMobileError('');
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid email format";
        
        return null;
    };

    const submitFormData = async () => {
        const error = validateForm();
        if (error) {
            toast({
                title: "Validation Error",
                description: error,
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const updateData: Record<string, any> = {};
            if (formData.full_name) updateData.full_name = formData.full_name;
            if (formData.dob) updateData.dob = formData.dob;
            if (formData.email) updateData.email = formData.email;
            if (formData.mobile) updateData.mobile = formData.mobile;
            if (formData.marital_status) updateData.marital_status = formData.marital_status;
            if (formData.occupation) updateData.occupation = formData.occupation;
            if (formData.retirement_age_goal) updateData.retirement_age_goal = parseInt(formData.retirement_age_goal);
            if (formData.govt_id_type) updateData.govt_id_type = formData.govt_id_type;
            if (formData.govt_id_number) updateData.govt_id_number = formData.govt_id_number;
            if (formData.pan_number) updateData.pan_number = formData.pan_number;
            if (formData.address) updateData.address = formData.address;

            await api.post('/user/identity/update', updateData);
            
            toast({
                title: "Changes Saved",
                description: "Your identity details have been updated"
            });
            onSuccess();
            handleClose();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to update identity",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div 
                className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden m-4 max-h-[90vh] flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="kyc-modal-title"
            >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-[#00458c]/[0.02]">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-[#00458c]" />
                        <h2 id="kyc-modal-title" className="text-xl font-bold text-[#00458c]">Edit Identity & KYC</h2>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Enter your full name"
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your@email.com"
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Mobile Number (E.164 Format)</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={formatPhoneForDisplay(formData.mobile)}
                                    onChange={(e) => {
                                        const parsed = parsePhoneInput(e.target.value);
                                        setFormData({ ...formData, mobile: parsed });
                                    }}
                                    onBlur={(e) => {
                                        const result = validateAndFormatPhone(formData.mobile);
                                        if (!result.isValid && formData.mobile) {
                                            setMobileError(result.error || 'Invalid phone number');
                                        }
                                    }}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                                    aria-invalid={!!mobileError}
                                    aria-describedby={mobileError ? "mobile-error" : undefined}
                                />
                                {mobileError && (
                                    <span id="mobile-error" className="absolute -bottom-5 left-0 text-xs text-red-500">{mobileError}</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Format: +[Country Code][Number]</p>
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Residential Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Enter your residential address"
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">PAN Number</label>
                            <input
                                type="text"
                                value={formData.pan_number}
                                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all uppercase placeholder:normal-case"
                            />
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Marital Status</label>
                            <select
                                value={formData.marital_status}
                                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            >
                                <option value="">Select Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Occupation</label>
                            <input
                                type="text"
                                value={formData.occupation}
                                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                                placeholder="Enter your occupation"
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Retirement Age Goal</label>
                            <input
                                type="number"
                                value={formData.retirement_age_goal}
                                onChange={(e) => setFormData({ ...formData, retirement_age_goal: e.target.value })}
                                placeholder="e.g., 60"
                                min="18"
                                max="100"
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">Government ID Type</label>
                            <select
                                value={formData.govt_id_type}
                                onChange={(e) => setFormData({ ...formData, govt_id_type: e.target.value as GovtIDType })}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            >
                                <option value="aadhaar">Aadhaar Card</option>
                                <option value="passport">Passport</option>
                                <option value="driving_license">Driving License</option>
                                <option value="voter_id">Voter ID</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[#00458c] text-sm font-bold mb-2">
                                {formData.govt_id_type === 'aadhaar' ? 'Aadhaar Number' : 
                                 formData.govt_id_type === 'passport' ? 'Passport Number' : 
                                 formData.govt_id_type === 'driving_license' ? 'License Number' : 'Voter ID Number'}
                            </label>
                            <input
                                type="text"
                                value={formData.govt_id_number}
                                onChange={(e) => setFormData({ ...formData, govt_id_number: e.target.value })}
                                placeholder={formData.govt_id_type === 'aadhaar' ? '12-digit Aadhaar number' : 'Enter ID number'}
                                className="w-full h-11 px-4 rounded-lg border border-gray-300 text-[14px] font-semibold focus:border-[#f37920] focus:ring-1 focus:ring-[#f37920] outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span>Your data is encrypted and secure</span>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2"
                        >
                            Cancel
                        </button>
                        
                        <Button
                            onClick={submitFormData}
                            disabled={loading}
                            className="bg-[#f37920] hover:bg-[#d96815] text-white font-bold h-10 px-6"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
