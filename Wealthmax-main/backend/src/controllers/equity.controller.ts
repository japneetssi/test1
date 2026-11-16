import { Request, Response } from 'express';
import { EquityService } from '../services/equity.service';
import NodeCache from 'node-cache';

// Cache for short-lived live data (e.g., VWAP, current price) -> 1 minute
const shortCache = new NodeCache({ stdTTL: 60 });

// Cache for long-lived financial data (e.g., ROE, Book Value, Shareholding) -> 24 hours
const longCache = new NodeCache({ stdTTL: 86400 });

export class EquityController {
    
    private static async getTicker(req: Request, res: Response): Promise<string | null> {
        const symbol = req.params.symbol;
        // If symbol starts with iifl-, resolve it
        const ticker = symbol.startsWith('iifl-') 
            ? await EquityService.getTickerFromId(symbol) 
            : symbol;
            
        if (!ticker) {
            res.status(404).json({ success: false, error: 'Symbol not found or could not be mapped to Yahoo Finance.' });
            return null;
        }
        return ticker;
    }

    static async getOverview(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `overview_${ticker}`;
            const cached = longCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getOverview(ticker);
            longCache.set(cacheKey, data);
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            console.error('getOverview error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getMarketData(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `marketdata_${ticker}`;
            const cached = shortCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getMarketData(ticker);
            shortCache.set(cacheKey, data);
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            console.error('getMarketData error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getValuation(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `valuation_${ticker}`;
            const cached = longCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getValuation(ticker);
            longCache.set(cacheKey, data);
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getFinancials(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `financials_${ticker}`;
            const cached = longCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getFinancials(ticker);
            longCache.set(cacheKey, data);
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getShareholding(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `shareholding_${ticker}`;
            const cached = longCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getShareholding(ticker);
            longCache.set(cacheKey, data);
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getPerformance(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `performance_${ticker}`;
            const cached = longCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getPerformance(ticker);
            longCache.set(cacheKey, data); // 24 hours caching for performance since we recalculate historical once a day
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getNews(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `news_${ticker}`;
            const cached = shortCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getNews(ticker);
            shortCache.set(cacheKey, data);
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getCompanyProfile(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `company_${ticker}`;
            const cached = longCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getCompanyProfile(ticker);
            longCache.set(cacheKey, data);
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getAIInsights(req: Request, res: Response): Promise<any> {
        try {
            const ticker = await EquityController.getTicker(req, res);
            if (!ticker) return undefined;

            const cacheKey = `insights_${ticker}`;
            const cached = longCache.get(cacheKey);
            if (cached) return res.json({ success: true, data: cached, source: 'cache', timestamp: new Date().toISOString() });

            const data = await EquityService.getAIInsights(ticker);
            longCache.set(cacheKey, data);
            
            res.json({ success: true, data, source: 'live', timestamp: new Date().toISOString() });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
