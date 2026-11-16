import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
    id: string;
    name: string;
    amc: string;
    nav?: number;
    investmentType: 'SIP' | 'Lumpsum';
    amount: number;
}

interface InvestmentCartContextType {
    cartItems: CartItem[];
    isCartOpen: boolean;
    setCartOpen: (open: boolean) => void;
    addToCart: (item: Omit<CartItem, 'investmentType' | 'amount'>) => void;
    removeFromCart: (id: string) => void;
    updateCartItem: (id: string, updates: Partial<CartItem>) => void;
    clearCart: () => void;
}

const InvestmentCartContext = createContext<InvestmentCartContextType | undefined>(undefined);

export function InvestmentCartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setCartOpen] = useState(false);

    const addToCart = (item: Omit<CartItem, 'investmentType' | 'amount'>) => {
        setCartItems((prev) => {
            const exists = prev.find((i) => i.id === item.id);
            if (exists) return prev;
            return [...prev, { ...item, investmentType: 'SIP', amount: 1000 }];
        });
        setCartOpen(true);
    };

    const removeFromCart = (id: string) => {
        setCartItems((prev) => prev.filter((i) => i.id !== id));
    };

    const updateCartItem = (id: string, updates: Partial<CartItem>) => {
        setCartItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setCartOpen(false);
    };

    return (
        <InvestmentCartContext.Provider
            value={{
                cartItems,
                isCartOpen,
                setCartOpen,
                addToCart,
                removeFromCart,
                updateCartItem,
                clearCart,
            }}
        >
            {children}
        </InvestmentCartContext.Provider>
    );
}

export function useInvestmentCart() {
    const context = useContext(InvestmentCartContext);
    if (context === undefined) {
        throw new Error('useInvestmentCart must be used within an InvestmentCartProvider');
    }
    return context;
}
