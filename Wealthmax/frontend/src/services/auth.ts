import api from "../lib/api";

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: 'user' | 'advisor' | 'admin';
    partner_id?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token: string;
    };
}

export const authService = {
    // Mobile/Email OTP Login
    async requestOTP(identifier: string) {
        const response = await api.post("/auth/otp/request", { identifier });
        return response.data;
    },

    async verifyOTP(identifier: string, otp: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/auth/otp/verify", { identifier, otp });
        return response.data;
    },

    // Standard Login (Can be used as fallback if backend supports email+password)
    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/auth/login", { email, password });
        return response.data;
    },

    // Register
    async register(data: { full_name: string; email: string; mobile: string; pan?: string; advisor_id?: string | null; password?: string }): Promise<AuthResponse> {
        const payload = {
            ...data,
            // Since UI doesn't collect password but backend requires it, auto-generate a secure one
            password: data.password || Math.random().toString(36).slice(-10) + "A1!",
        };
        const response = await api.post<AuthResponse>("/auth/register", payload);
        return response.data;
    },
};
