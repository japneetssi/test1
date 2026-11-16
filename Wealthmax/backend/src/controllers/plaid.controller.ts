import { Request, Response } from 'express';
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid';
import { PlaidModel } from '../models/plaid.model';
import logger from '../config/logger';

// Setup Plaid Client
const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || 'client-id',
            'PLAID-SECRET': process.env.PLAID_SECRET || 'secret-id',
        },
    },
});

const plaidClient = new PlaidApi(configuration);

export const createLinkToken = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const request = {
            user: {
                client_user_id: userId,
            },
            client_name: 'WealthMax',
            products: [Products.Auth, Products.Transactions],
            country_codes: [CountryCode.Us, CountryCode.Gb, CountryCode.Ca],
            language: 'en',
        };

        const createTokenResponse = await plaidClient.linkTokenCreate(request);
        return res.json({ success: true, link_token: createTokenResponse.data.link_token });
    } catch (error: any) {
        logger.error('Error creating Plaid link token:', error);
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

export const setAccessToken = async (req: Request, res: Response) => {
    try {
        const { public_token, institution_id, institution_name } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const tokenResponse = await plaidClient.itemPublicTokenExchange({
            public_token: public_token,
        });

        const access_token = tokenResponse.data.access_token;
        const item_id = tokenResponse.data.item_id;

        // Save Item to DB
        const plaidItem = await PlaidModel.saveItem({
            user_id: userId,
            access_token,
            item_id,
            institution_id,
            institution_name
        });

        // Immediately fetch and save accounts for this item
        const accountsResponse = await plaidClient.accountsGet({ access_token });
        const accounts = accountsResponse.data.accounts.map(acc => ({
            account_id: acc.account_id,
            name: acc.name,
            official_name: acc.official_name || undefined,
            type: acc.type,
            subtype: acc.subtype || undefined,
            mask: acc.mask || undefined,
            current_balance: acc.balances.current || undefined,
            available_balance: acc.balances.available || undefined,
            iso_currency_code: acc.balances.iso_currency_code || undefined
        }));

        await PlaidModel.saveAccounts(plaidItem.id!, accounts);

        return res.json({ success: true, message: 'Bank account linked successfully.' });
    } catch (error: any) {
        logger.error('Error setting Plaid access token:', error);
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

export const getAccounts = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // To keep it simple, we just fetch from our DB cache.
        // A production app would sync with Plaid API here first or via webhooks.
        const accounts = await PlaidModel.getAccountsByUserId(userId);
        
        return res.json({ success: true, data: accounts });
    } catch (error: any) {
        logger.error('Error fetching Plaid accounts:', error);
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};
