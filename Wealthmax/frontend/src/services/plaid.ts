import api from "../lib/api";

export interface PlaidAccount {
    id: string;
    account_id: string;
    name: string;
    official_name?: string;
    type: string;
    subtype?: string;
    mask?: string;
    current_balance?: number;
    available_balance?: number;
    iso_currency_code?: string;
    institution_name?: string;
}

export const plaidService = {
    async createLinkToken(): Promise<{ link_token: string }> {
        const response = await api.post("/plaid/create-link-token");
        return response.data;
    },

    async setAccessToken(publicToken: string, institutionId: string, institutionName: string) {
        const response = await api.post("/plaid/set-access-token", {
            public_token: publicToken,
            institution_id: institutionId,
            institution_name: institutionName
        });
        return response.data;
    },

    async getAccounts(): Promise<{ data: PlaidAccount[] }> {
        const response = await api.get("/plaid/accounts");
        return response.data;
    }
};
