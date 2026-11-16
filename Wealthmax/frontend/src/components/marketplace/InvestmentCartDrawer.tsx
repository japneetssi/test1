import React from 'react';
import { useInvestmentCart } from '../../contexts/InvestmentCartContext';
import { ShoppingCart, X, Plus, Minus, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export function InvestmentCartDrawer() {
    const { cartItems, isCartOpen, setCartOpen, removeFromCart, updateCartItem, clearCart } = useInvestmentCart();
    const { toast } = useToast();

    if (!isCartOpen) return null;

    const totalAmount = cartItems.reduce((acc, item) => acc + item.amount, 0);

    const handleInvest = () => {
        toast({
            title: "Investment Successful!",
            description: `Successfully invested ₹${totalAmount.toLocaleString()} across ${cartItems.length} funds.`,
        });
        clearCart();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-[#1a365d]" />
                        Investment Bucket
                    </h2>
                    <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cartItems.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">
                            Your investment bucket is empty.
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="border rounded-lg p-4 bg-gray-50 relative">
                                <button 
                                    onClick={() => removeFromCart(item.id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <h3 className="font-semibold text-[#1a365d] pr-6">{item.name}</h3>
                                <p className="text-xs text-gray-500">{item.amc}</p>
                                
                                <div className="mt-4 flex flex-col gap-3">
                                    <div className="flex bg-gray-200 rounded-lg p-1">
                                        <button 
                                            className={`flex-1 text-sm py-1 rounded-md transition-colors ${item.investmentType === 'SIP' ? 'bg-white shadow-sm font-medium text-[#1a365d]' : 'text-gray-500'}`}
                                            onClick={() => updateCartItem(item.id, { investmentType: 'SIP' })}
                                        >
                                            SIP
                                        </button>
                                        <button 
                                            className={`flex-1 text-sm py-1 rounded-md transition-colors ${item.investmentType === 'Lumpsum' ? 'bg-white shadow-sm font-medium text-[#1a365d]' : 'text-gray-500'}`}
                                            onClick={() => updateCartItem(item.id, { investmentType: 'Lumpsum' })}
                                        >
                                            Lumpsum
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Amount (₹)</label>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                                onClick={() => updateCartItem(item.id, { amount: Math.max(500, item.amount - 500) })}
                                            >
                                                <Minus className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <input 
                                                type="number" 
                                                className="flex-1 border rounded-lg p-2 text-center font-medium"
                                                value={item.amount}
                                                onChange={(e) => updateCartItem(item.id, { amount: parseInt(e.target.value) || 0 })}
                                            />
                                            <button 
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                                onClick={() => updateCartItem(item.id, { amount: item.amount + 500 })}
                                            >
                                                <Plus className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex justify-between items-center mb-4 text-[#1a365d] font-bold">
                            <span>Total Investment:</span>
                            <span className="text-xl">₹{totalAmount.toLocaleString()}</span>
                        </div>
                        <button 
                            className="w-full bg-[#f37920] hover:bg-[#d96716] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                            onClick={handleInvest}
                        >
                            <CheckCircle className="w-5 h-5" />
                            Proceed to Invest
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
