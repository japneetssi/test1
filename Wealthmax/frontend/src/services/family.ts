import { api } from "@/lib/api";
import { AnalyticsSnapshot } from "./portfolio";

export interface Family {
    id: string;
    name: string;
    head_user_id: string;
    created_at: string;
    members?: FamilyMember[];
}

export interface FamilyMember {
    id: string;
    full_name: string;
    email: string;
    role: string;
    netWorth?: number;
}

export const createFamily = async (name: string): Promise<Family> => {
    const response = await api.post("/family/create", { name });
    return response.data.data;
};

export const addFamilyMember = async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post("/family/add-member", { email });
    return response.data;
};

export const getFamilyDetails = async (): Promise<Family | null> => {
    const response = await api.get("/family/details");
    return response.data.data;
};

export const getConsolidatedAnalytics = async (): Promise<AnalyticsSnapshot> => {
    const response = await api.get("/family/consolidated-analytics");
    return response.data.data;
};

export const getFamilyHoldings = async (): Promise<any[]> => {
    const response = await api.get("/family/holdings");
    return response.data.data;
};
