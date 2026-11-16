import React, { useEffect, useState } from 'react';
import { plaidService, PlaidAccount } from '../services/plaid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Landmark, CircleDollarSign, CreditCard } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export const LinkedAccounts: React.FC = () => {
    const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAccounts = async () => {
        try {
            const response = await plaidService.getAccounts();
            if (response.data) {
                setAccounts(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch linked accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const formatCurrency = (amount: number | undefined, currency: string | undefined = 'USD') => {
        if (amount === undefined) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const getIconForType = (type: string) => {
        if (type === 'credit') return <CreditCard className="w-6 h-6 text-orange-500" />;
        return <CircleDollarSign className="w-6 h-6 text-green-500" />;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[100px] w-full rounded-xl" />
                <Skeleton className="h-[100px] w-full rounded-xl" />
            </div>
        );
    }

    if (accounts.length === undefined || accounts.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-slate-50 dark:bg-slate-900/20">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <Landmark className="w-12 h-12 mb-2 opacity-50" />
                    <p>No bank accounts linked yet.</p>
                    <p className="text-sm">Link an account to get real-time net worth tracking.</p>
                </CardContent>
            </Card>
        );
    }

    // Group accounts by institution
    const groupedAccounts = accounts.reduce((acc, account) => {
        const inst = account.institution_name || 'Other';
        if (!acc[inst]) acc[inst] = [];
        acc[inst].push(account);
        return acc;
    }, {} as Record<string, PlaidAccount[]>);

    return (
        <div className="space-y-6">
            {Object.entries(groupedAccounts).map(([institution, instAccounts]) => (
                <Card key={institution} className="overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-indigo-500" />
                            {institution}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {instAccounts.map((account) => (
                                <div key={account.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                            {getIconForType(account.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{account.name}</p>
                                            <p className="text-sm text-slate-500 capitalize">{account.subtype || account.type} •••• {account.mask}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                                            {formatCurrency(account.current_balance, account.iso_currency_code)}
                                        </p>
                                        {account.type === 'credit' && (
                                            <p className="text-xs text-orange-500 font-medium">Balance owed</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
