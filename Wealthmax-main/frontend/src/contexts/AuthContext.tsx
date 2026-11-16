import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthResponse } from "../services/auth";
import api from "../lib/api";

interface Branding {
    name: string;
    logo_url: string | null;
    primary_color: string;
    action_color: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    branding: Branding | null;
    isAuthenticated: boolean;
    isHydrated: boolean;
    login: (data: AuthResponse["data"]) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [branding, setBranding] = useState<Branding | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    const fetchBranding = async (partnerId: string) => {
        try {
            const res = await api.get(`/partner/public-branding/${partnerId}`);
            if (res.data.success) {
                setBranding(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch branding", error);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("wm_token");
        const storedUser = localStorage.getItem("wm_user");
        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                if (parsedUser.partner_id) {
                    fetchBranding(parsedUser.partner_id);
                }
            } catch (e) {
                // ignore
            }
        }
        setIsHydrated(true);
    }, []);

    const login = (data: AuthResponse["data"]) => {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("wm_token", data.token);
        localStorage.setItem("wm_user", JSON.stringify(data.user));
        if (data.refreshToken) {
            localStorage.setItem("wm_refresh_token", data.refreshToken);
        } else {
            localStorage.removeItem("wm_refresh_token");
        }

        if (data.user.partner_id) {
            fetchBranding(data.user.partner_id);
        } else {
            setBranding(null);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setBranding(null);
        localStorage.removeItem("wm_token");
        localStorage.removeItem("wm_user");
        localStorage.removeItem("wm_refresh_token");
    };

    return (
        <AuthContext.Provider value={{ user, token, branding, isAuthenticated: !!token, isHydrated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
