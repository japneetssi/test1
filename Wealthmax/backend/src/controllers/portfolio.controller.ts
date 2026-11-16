import { Request, Response } from 'express';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioAlignmentService } from '../services/portfolioAlignment.service';
import { ProfileModel } from '../models/profile.model';
import { UserModel } from '../models/user.model';
import { ReportDataService } from '../services/reportData.service';

import logger from '../config/logger';

export class PortfolioController {
    /**
     * Add a single holding manually
     * POST /api/portfolio/manual
     */
    static async addManualHolding(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { isin, asset_type, quantity, average_price } = req.body;

            const result = await PortfolioService.addManualHolding(userId, {
                isin: isin.toUpperCase(),
                asset_type: asset_type.toUpperCase(),
                quantity: parseFloat(quantity),
                average_price: average_price ? parseFloat(average_price) : undefined
            });

            if (!result.success) {
                res.status(400).json(result);
                return;
            }

            res.status(201).json(result);
        } catch (error: any) {
            logger.error('Add Manual Holding Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add holding'
            });
        }
    }

    /**
     * Upload holdings via CSV
     * POST /api/portfolio/upload-csv
     */
    static async uploadCSV(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { csv } = req.body;

            if (!csv || typeof csv !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Missing or invalid CSV content in request body'
                });
                return;
            }

            const result = await PortfolioService.uploadCSV(userId, csv);

            if (!result.success) {
                res.status(400).json(result);
                return;
            }

            res.status(200).json(result);
        } catch (error: any) {
            logger.error('Upload CSV Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process CSV upload'
            });
        }
    }

    /**
     * Get all user holdings with metadata
     * GET /api/portfolio/holdings
     */
    static async getHoldings(req: Request, res: Response) {
        try {
            const userId = (req as any).targetUserId || (req as any).user.id;

            const holdings = await PortfolioService.getHoldings(userId);
            const summary = await PortfolioService.getPortfolioSummary(userId);

            return res.status(200).json({
                success: true,
                data: {
                    holdings,
                    summary
                }
            });
        } catch (error: any) {
            logger.error('Get Holdings Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve holdings'
            });
        }
    }

    /**
     * Get portfolio summary (valuation, count, sync status)
     * GET /api/portfolio/summary
     */
    static async getSummary(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const summary = await PortfolioService.getPortfolioSummary(userId);

            return res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error: any) {
            logger.error('Get Summary Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve portfolio summary'
            });
        }
    }

    /**
     * Delete a holding
     * DELETE /api/portfolio/holdings/:id
     */
    static async deleteHolding(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Holding ID is required'
                });
                return;
            }

            const result = await PortfolioService.deleteHolding(userId, id);

            if (!result.success) {
                res.status(404).json(result);
                return;
            }

            // Wrap in data for consistency with response interceptor
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            logger.error('Delete Holding Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete holding'
            });
        }
    }

    /**
     * Get portfolio alignment analysis
     * GET /api/portfolio/alignment
     */
    static async getAlignment(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            console.log('Alignment Request for user:', userId);

            // Fetch user's persona and risk class
            const user = await UserModel.findById(userId);

            const persona = user?.assigned_persona || 'General';
            const riskClass = user?.risk_class || undefined;

            // Run alignment analysis
            const alignment = await PortfolioAlignmentService.analyzeAlignment(userId, persona, riskClass);

            res.status(200).json({
                success: true,
                data: alignment
            });
        } catch (error: any) {
            logger.error('Get Alignment Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve portfolio alignment'
            });
        }
    }
    /**
     * Upload holdings and transactions from CAS PDF
     * POST /api/portfolio/upload-cas
     */
    static async uploadCAS(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const file = (req as any).file as Express.Multer.File | undefined;
            const { password } = req.body;

            // Validate file upload
            if (!file) {
                res.status(400).json({
                    success: false,
                    message: 'No CAS PDF file provided'
                });
                return;
            }

            // Import services dynamically to avoid circular dependencies
            const { parseCASPdf } = await import('../services/casParser.service');
            const { TransactionService } = await import('../services/transaction.service');

            // Parse CAS PDF
            const parseResult = await parseCASPdf(file.buffer, password);

            if (!parseResult.success && parseResult.holdings.length === 0 && parseResult.transactions.length === 0) {
                res.status(400).json({
                    success: false,
                    message: parseResult.errors[0] || 'Failed to parse CAS PDF',
                    errors: parseResult.errors
                });
                return;
            }

            // Import holdings into portfolio
            const holdingResult = await PortfolioService.uploadCASHoldings(userId, parseResult.holdings);

            // Import transactions
            const transactionResult = await TransactionService.importCASTransactions(userId, parseResult.transactions);

            const allErrors = [
                ...parseResult.errors,
                ...holdingResult.errors,
                ...transactionResult.errors
            ];

            const totalImported = holdingResult.imported + transactionResult.imported;

            res.status(200).json({
                success: totalImported > 0,
                message: totalImported > 0
                    ? `Imported ${holdingResult.imported} holdings and ${transactionResult.imported} transactions from CAS`
                    : 'No new data imported',
                data: {
                    holdings: {
                        totalFound: parseResult.totalHoldingsFound,
                        imported: holdingResult.imported,
                        skipped: holdingResult.skipped
                    },
                    transactions: {
                        totalFound: parseResult.totalTransactionsFound,
                        imported: transactionResult.imported,
                        skipped: transactionResult.skipped
                    },
                    errors: allErrors
                }
            });
        } catch (error: any) {
            logger.error('Upload CAS Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process CAS PDF upload'
            });
        }
    }

    /**
     * Get Portfolio Analytics Snapshot
     * GET /api/portfolio/analytics-snapshot
     */
    static async getAnalyticsSnapshot(req: Request, res: Response) {
        try {
            const userId = (req as any).targetUserId || (req as any).user.id;

            const { AnalyticsSnapshotService } = await import('../services/analyticsSnapshot.service');
            const snapshot = await AnalyticsSnapshotService.getSnapshot(userId);

            return res.status(200).json({
                success: true,
                data: snapshot
            });
        } catch (error: any) {
            logger.error('Get Analytics Snapshot Error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve analytics snapshot'
            });
        }
    }

    /**
     * Generate and download Advisory PDF Report
     * GET /api/portfolio/report/pdf
     */
    /**
     * Download Advisory PDF Report (V3 - Puppeteer based)
     * GET /api/v1/portfolio/report/pdf
     */
    static async downloadReport(req: Request, res: Response) {
        try {
            const userId = (req as any).targetUserId || (req as any).user.id;

            // 1. Fetch Comprehensive Data
            const { AnalyticsService } = await import('../services/analytics.service');
            const { PDFServiceV3 } = await import('../services/pdfV3.service');

            const [snapshot, profile, user, actionItems] = await Promise.all([
                AnalyticsService.getPortfolioSnapshot(userId),
                ProfileModel.findByUserId(userId),
                UserModel.findById(userId),
                ProfileModel.getActionItems(userId)
            ]);

            // 2. Prepare Data for V3 Template (Adapter)
            const pdfData: any = {
                user: {
                    name: user?.full_name || 'Valued Client',
                    email: user?.email || ''
                },
                profile: {
                    age: snapshot.metadata.asOf ? new Date().getFullYear() - new Date(user?.dob || '1990-01-01').getFullYear() : 30,
                    gross_income: profile?.gross_income || 0,
                    fixed_expenses: profile?.fixed_expenses || 0,
                    monthly_emi: profile?.liabilities_emi || 0,
                    existing_assets: profile?.existing_assets || 0,
                    health_score: snapshot.summary.xirr || 0, // Placeholder if real health score not available
                    risk_class: user?.risk_class || 'Moderate'
                },
                actionItems: actionItems.map((item: any) => ({
                    title: item.title,
                    description: item.description,
                    category: item.category,
                    priority: item.priority,
                    gap_amount: item.gap_amount || 0,
                    estimated_score_impact: item.estimated_score_impact || 0
                })),
                portfolioSnapshot: {
                    totalValue: snapshot.summary.totalValue,
                    investedAmount: snapshot.summary.invested,
                    unrealizedGainLoss: snapshot.summary.returns,
                    gainLossPercent: snapshot.summary.returnsPercentage,
                    holdingsCount: snapshot.summary.holdingsCount
                },
                growthChart: {
                    labels: snapshot.performance.growth_curve.map((d: any) => {
                        const date = new Date(d.date);
                        return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().slice(-2)}`;
                    }),
                    portfolioSeries: snapshot.performance.growth_curve.map((d: any) => d.value),
                    benchmarkSeries: snapshot.performance.growth_curve.map((d: any) => d.value * 0.95) // Mock benchmark if not available
                },
                drawdownData: {
                    series: snapshot.performance.drawdown_series.map((d: any) => ({
                        date: d.date,
                        drawdown: d.drawdown
                    })),
                    maxDrawdown: Math.min(...snapshot.performance.drawdown_series.map((d: any) => d.drawdown)),
                },
                riskReturnData: {
                    portfolioXirr: snapshot.summary.xirr || 0,
                    benchmarkXirr: (snapshot.summary.xirr || 0) * 0.9,
                    portfolioVolatility: snapshot.risk.volatility,
                    benchmarkVolatility: 12.5
                },
                assetAllocation: {
                    classes: snapshot.allocation.byAssetType.map((a: any) => ({
                        name: a.type,
                        percentage: a.percentage,
                        xirr: snapshot.summary.xirr || 0
                    }))
                },
                mfCategoryAllocation: {
                    categories: snapshot.allocation.byCategory.map((c: any) => ({
                        category: c.category,
                        percentage: c.percentage,
                        value: (c.percentage / 100) * snapshot.summary.totalValue
                    }))
                },
                amcExposure: {
                    amcs: snapshot.amcExposure.map((a: any) => ({
                        amcName: a.amcName,
                        percentage: a.percentage
                    }))
                },
                schemeAllocation: {
                    schemes: snapshot.allocation.topHoldings.map((h: any) => ({
                        schemeName: h.name,
                        value: h.value,
                        weightPercent: h.weight
                    }))
                },
                behaviorAnalysis: {
                    avgHoldingPeriod: snapshot.behaviorAnalysis.holdingPeriod,
                    concentrationRatio: snapshot.behaviorAnalysis.concentration,
                    churnRate: snapshot.behaviorAnalysis.churnRate
                },
                yearlyInvestments: snapshot.yearlyInvestments,
                taxExposure: snapshot.taxAnalysis,
                overlapAnalysis: {
                    portfolioOverlapPercentage: snapshot.overlapAnalysis.overlapPercentage,
                    similarHoldingsGroups: snapshot.overlapAnalysis.similarHoldings.map((g: any) => ({
                        schemes: g.schemes,
                        overlapPercentage: g.overlapPercentage,
                        commonHoldingsCount: g.commonHoldingsCount
                    }))
                },
                projections: snapshot.projections,
                whiteLabel: {
                    companyName: 'WealthMax',
                    primaryColor: '#1a56db'
                },
                comprehensiveData: ReportDataService.prepareComprehensiveData(user, profile, snapshot)
            };

            // 3. Generate HTML String
            const htmlString = await PDFServiceV3.getReportHTML(pdfData, pdfData.whiteLabel);

            // 4. Send Response
            res.setHeader('Content-Type', 'text/html');
            res.send(htmlString);

        } catch (error: any) {
            logger.error('V3 Report Generation Error', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate advisory report'
            });
        }
    }
}
