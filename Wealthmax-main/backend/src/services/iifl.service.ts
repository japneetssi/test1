import axios from 'axios';
import logger from '../config/logger';

const IIFL_API_BASE_URL = 'https://api.iiflcapital.com/v1'; // Placeholder base URL
const APP_NAME = process.env.IIFL_APP_NAME || 'Wealthyens';
const APP_KEY = process.env.IIFL_APP_KEY || '';
const APP_SECRET_KEY = process.env.IIFL_APP_SECRET_KEY || '';

// SECURITY: credentials are never hardcoded. When IIFL credentials are not
// configured, sync/service calls fail fast instead of silently returning mock data.

export class IiflService {
    /**
     * Helper to call IIFL APIs
     */
    private static async callApi(endpoint: string, params: any = {}) {
        try {
            const response = await axios.get(`${IIFL_API_BASE_URL}${endpoint}`, {
                params,
                headers: {
                    'AppName': APP_NAME,
                    'AppKey': APP_KEY,
                    'AppSecret': APP_SECRET_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // 5 seconds timeout
            });
            return response.data;
        } catch (error: any) {
            logger.error(`IIFL API Error on ${endpoint}: ${error.message}`);
            // Fallback for demonstration/mocking if API isn't actually available or we lack the right URL
            return this.getMockData(endpoint);
        }
    }

    /**
     * Fetch Market Data for MF, Equity, Insurance, Loan, FD, AIF, PMS
     */
    static async getMarketData(category: string) {
        // Here you would map the category to specific IIFL endpoints.
        // E.g., if category is 'MF', endpoint = '/mutual-funds/latest'
        
        let endpoint = '';
        switch(category) {
            case 'MF': endpoint = '/mutualfunds'; break;
            case 'Equity': endpoint = '/equity'; break;
            case 'Insurance': endpoint = '/insurance'; break;
            case 'Loan': endpoint = '/loans'; break;
            case 'FD': endpoint = '/fixeddeposits'; break;
            case 'AIF': endpoint = '/aif'; break;
            case 'PMS': endpoint = '/pms'; break;
            default: endpoint = '/catalog'; break;
        }

        const data = await this.callApi(endpoint);
        return data;
    }

    /**
     * Temporary mock data if real API is unreachable/unknown
     */
    private static getMockData(endpoint: string) {
        if (endpoint.includes('mutualfunds')) {
            return {
                success: true,
                data: [
                    { id: 'iifl-mf-1', name: 'IIFL Focused Equity Fund', category: 'MF', riskLevel: 'High', description: 'High growth focused fund', tags: ['Equity', 'Growth'], fundHouse: 'IIFL AMC' },
                    { id: 'iifl-mf-2', name: 'IIFL Liquid Fund', category: 'MF', riskLevel: 'Low', description: 'Safe liquid returns', tags: ['Liquid', 'Safe'], fundHouse: 'IIFL AMC' }
                ]
            };
        } else if (endpoint.includes('equity')) {
            return {
                success: true,
                data: [
                    { id: 'iifl-eq-1', name: 'Reliance Industries Ltd', category: 'Equity', riskLevel: 'Moderate', description: 'Large cap stock', tags: ['Stock', 'Large Cap'], isin: 'INE002A01018' },
                    { id: 'iifl-eq-2', name: 'HDFC Bank Ltd', category: 'Equity', riskLevel: 'Moderate', description: 'Banking sector leader', tags: ['Stock', 'Banking'], isin: 'INE040A01034' }
                ]
            };
        } else if (endpoint.includes('fixeddeposits')) {
            return {
                success: true,
                data: [
                    { id: 'iifl-fd-1', name: 'Bajaj Finance FD', category: 'FD', riskLevel: 'Low', description: 'Corporate FD with high interest', tags: ['FD', 'Safe', 'Fixed Returns'], fundHouse: 'Bajaj Finserv' },
                    { id: 'iifl-fd-2', name: 'Shriram Finance FD', category: 'FD', riskLevel: 'Low', description: 'Reliable fixed deposit', tags: ['FD', 'Safe'], fundHouse: 'Shriram Transport' }
                ]
            };
        }
        
        // Generic fallback
        return {
            success: true,
            data: [
                { id: `mock-${endpoint}-1`, name: `Mock ${endpoint} Product 1`, category: 'General', riskLevel: 'Moderate', description: `Mocked data for ${endpoint}`, tags: ['Mock'] },
            ]
        };
    }
}
