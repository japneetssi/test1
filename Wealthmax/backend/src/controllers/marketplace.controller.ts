import { Request, Response } from 'express';
import { MarketplaceService } from '../services/marketplace.service';
import { MarketplaceDiscoveryService } from '../services/marketplace-discovery.service';
import { MarketplaceDashboardService } from '../services/marketplace-dashboard.service';
import { syncAllSchemesList } from '../services/mfapi.service';
import logger from '../config/logger';

export class MarketplaceController {
    static async getDashboard(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const data = await MarketplaceDashboardService.getDashboardData(userId);
            res.status(200).json({ success: true, data });
        } catch (error: any) {
            logger.error('Marketplace Dashboard Error', error);
            res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
        }
    }
    static async getRecommendations(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const products = await MarketplaceService.getRecommendations(userId);

            res.status(200).json({
                success: true,
                data: products
            });
        } catch (error: any) {
            logger.error('Marketplace Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch marketplace recommendations'
            });
        }
    }

    /**
     * Discovery Endpoints
     */

    static async getCatalog(req: Request, res: Response) {
        try {
            // Extract filters from query params
            const filters = {
                category: req.query.category as string,
                riskLevels: req.query.riskLevels ? (req.query.riskLevels as string).split(',') : undefined,
                amcs: req.query.amcs ? (req.query.amcs as string).split(',') : undefined,
                query: req.query.q as string,
                sortBy: req.query.sortBy as string,
                page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50
            };

            const result = await MarketplaceDiscoveryService.getCatalog(filters);
            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getProductDetail(req: Request, res: Response) {
        try {
            const { id } = req.params;
            
            const product = await MarketplaceDiscoveryService.getProductById(id) || await MarketplaceDiscoveryService.getProductByIsin(id);

            if (!product) {
                res.status(404).json({ success: false, message: 'Product not found' });
                return;
            }

            res.json({ success: true, data: product });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getProductHistory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const range = req.query.range as string || '1y';
            const history = await MarketplaceDiscoveryService.getHistory(id, range);
            res.json({ success: true, data: history });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // We can point /search directly to getCatalog since it handles ?q= now
    static async searchProducts(req: Request, res: Response) {
        req.query.limit = '10'; // Return top 10 for autocomplete
        return MarketplaceController.getCatalog(req, res);
    }

    static async getCategories(_req: Request, res: Response) {
        try {
            const categories = await MarketplaceDiscoveryService.getCategories();
            res.json({ success: true, data: categories });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getFilters(_req: Request, res: Response) {
        try {
            const filters = await MarketplaceDiscoveryService.getFilterOptions();
            res.json({ success: true, data: filters });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async triggerSync(_req: Request, res: Response) {
        try {
            // Trigger the sync asynchronously so we don't block or timeout the HTTP request
            syncAllSchemesList().catch(err => {
                logger.error('Background sync failed', err);
            });
            res.json({ success: true, message: 'Sync started in the background. Please wait a few seconds and refresh.' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
