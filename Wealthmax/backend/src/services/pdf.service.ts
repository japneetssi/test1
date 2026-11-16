import { AnalyticsService } from './analytics.service';
import { TemplateService } from './pdf/template.service';
import logger from '../config/logger';


export class PDFService {
    /**
     * Generate Advisory HTML Report
     */
    static async getAdvisoryReportHTML(user: any, options: any = {}): Promise<string> {
        try {
            // 1. Fetch comprehensive portfolio snapshot
            const snapshot = await AnalyticsService.getPortfolioSnapshot(user.id);

            // 2. Prepare data object for template
            const data = {
                user: {
                    name: user.name,
                    email: user.email
                },
                snapshot,
                branding: options.branding
            };

            // 3. Generate HTML
            const html = TemplateService.generateAdvisoryHTML(data);

            return html;

        } catch (error: any) {
            logger.error('HTML generation error', error);
            throw new Error('Failed to generate HTML report');
        }
    }
}
