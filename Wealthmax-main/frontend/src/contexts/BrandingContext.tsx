
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface Branding {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    actionColor: string;
}

interface BrandingContextType {
    branding: Branding;
    loading: boolean;
    refreshBranding: () => Promise<void>;
}

const defaultBranding: Branding = {
    name: 'WealthMax',
    logoUrl: null,
    primaryColor: '#00458c',
    actionColor: '#f37920',
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [branding, setBranding] = useState<Branding>(defaultBranding);
    const [loading, setLoading] = useState(true);

    const hexToHsl = (hex: string): string => {
        hex = hex.replace(/^#/, '');
        
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const applyBranding = (data: Branding) => {
        const root = document.documentElement;
        
        // Set brand colors as CSS variables
        root.style.setProperty('--brand-primary', data.primaryColor);
        root.style.setProperty('--brand-primary-hsl', hexToHsl(data.primaryColor));
        root.style.setProperty('--brand-action', data.actionColor);
        root.style.setProperty('--brand-action-hsl', hexToHsl(data.actionColor));
        
        // Also update the primary/accent HSL variables for component compatibility
        root.style.setProperty('--primary', hexToHsl(data.primaryColor));
        root.style.setProperty('--accent', hexToHsl(data.actionColor));
        root.style.setProperty('--ring', hexToHsl(data.primaryColor));
        
        setBranding(data);
    };

    const fetchBranding = async () => {
        try {
            const token = localStorage.getItem('wm_token');
            if (!token) {
                setLoading(false);
                return;
            }
            
            const { data } = await api.get('/partner/my-branding');
            if (data.success) {
                applyBranding({
                    name: data.data.name,
                    logoUrl: data.data.logo_url,
                    primaryColor: data.data.primary_color || defaultBranding.primaryColor,
                    actionColor: data.data.action_color || defaultBranding.actionColor,
                });
            }
        } catch (error) {
            console.error('Failed to fetch branding', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranding();
    }, []);

    return (
        <BrandingContext.Provider value={{ branding, loading, refreshBranding: fetchBranding }}>
            {children}
        </BrandingContext.Provider>
    );
};

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
