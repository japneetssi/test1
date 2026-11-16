import { randomUUID } from 'crypto';
import logger from '../config/logger';

export interface ProposalFund {
    schemeCode: string;
    schemeName: string;
    weight: number; // Percentage (e.g., 50)
}

export interface ProposalRequest {
    clientName: string;
    proposalType: 'LUMPSUM' | 'SIP';
    amount: number;
    horizonYears: number;
    funds: ProposalFund[];
}

export interface PartnerBranding {
    name: string;
    logo_url?: string;
    primary_color: string;
    action_color: string;
}

export class ProposalService {
    /**
     * Generate an Investment Proposal HTML String
     */
    public static async getProposalHTML(data: ProposalRequest, branding: PartnerBranding): Promise<string> {
        try {
            const proposalId = `PROP-${randomUUID().slice(0, 8).toUpperCase()}`;
            const generatedDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            // 1. Calculate Projections (12% CAGR)
            const projectionData = this.calculateProjections(data.amount, data.horizonYears, data.proposalType);

            // 2. Generate HTML
            const html = this.generateHTML(data, branding, proposalId, generatedDate, projectionData);

            return html;
        } catch (error) {
            logger.error('Proposal HTML Generation failed', error);
            throw error;
        }
    }

    private static calculateProjections(amount: number, years: number, type: 'LUMPSUM' | 'SIP') {
        const rate = 0.12; // 12% CAGR
        const monthlyRate = rate / 12;
        const totalMonths = years * 12;
        const data: Array<{ year: number, value: number }> = [];

        if (type === 'LUMPSUM') {
            for (let i = 0; i <= years; i++) {
                const value = amount * Math.pow(1 + rate, i);
                data.push({ year: i, value: Math.round(value) });
            }
        } else {
            // SIP Future Value formula: P * [((1 + r)^n - 1) / r] * (1 + r)
            for (let i = 0; i <= years; i++) {
                if (i === 0) {
                    data.push({ year: 0, value: 0 });
                    continue;
                }
                const n = i * 12;
                const fv = amount * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate) * (1 + monthlyRate);
                data.push({ year: i, value: Math.round(fv) });
            }
        }

        return {
            finalValue: data[data.length - 1].value,
            totalInvested: type === 'LUMPSUM' ? amount : amount * totalMonths,
            yearlyData: data
        };
    }

    private static generateHTML(data: ProposalRequest, branding: PartnerBranding, id: string, date: string, projection: any): string {
        const primaryColor = branding.primary_color || '#00458c';

        const fundsHtml = data.funds.map(f => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${f.schemeName}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${f.weight}%</td>
            </tr>
        `).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; }
        .logo { max-height: 50px; }
        .partner-name { font-size: 24px; font-weight: bold; color: ${primaryColor}; }
        .proposal-title { margin-top: 40px; text-align: center; font-size: 28px; font-weight: bold; }
        .client-info { margin-top: 20px; text-align: center; color: #666; }
        
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 5px solid ${primaryColor}; }
        .summary-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .summary-value { font-size: 20px; font-weight: bold; margin-top: 5px; }

        .allocation { margin-top: 40px; }
        .allocation-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .allocation-table th { background: #f0f2f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }

        .projection-section { margin-top: 40px; page-break-before: always; }
        .chart-placeholder { height: 300px; width: 100%; background: #fff; border: 1px solid #eee; position: relative; margin-top: 20px; }
        
        .footer { margin-top: 60px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        .disclaimer { font-style: italic; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            ${branding.logo_url ? `<img src="${branding.logo_url}" class="logo" />` : `<div class="partner-name">${branding.name}</div>`}
        </div>
        <div style="text-align: right;">
            <div style="font-size: 12px; color: #666;">Proposal Date</div>
            <div style="font-weight: bold;">${date}</div>
            <div style="font-size: 10px; color: #999;">Ref: ${id}</div>
        </div>
    </div>

    <div class="proposal-title">Investment Proposal</div>
    <div class="client-info">Prepared especially for <strong>${data.clientName}</strong></div>

    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-label">Total Investment</div>
            <div class="summary-value">₹${data.amount.toLocaleString('en-IN')}${data.proposalType === 'SIP' ? '/month' : ''}</div>
            <div style="font-size: 11px; color: #999; margin-top: 4px;">Type: ${data.proposalType}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Projected Value (in ${data.horizonYears} yrs)</div>
            <div class="summary-value" style="color: #10b981;">₹${projection.finalValue.toLocaleString('en-IN')}</div>
            <div style="font-size: 11px; color: #999; margin-top: 4px;">Assumed CAGR: 12%</div>
        </div>
    </div>

    <div class="allocation">
        <h3>Proposed Asset Allocation</h3>
        <table class="allocation-table">
            <thead>
                <tr>
                    <th>Mutual Fund Scheme</th>
                    <th style="text-align: right;">Allocation %</th>
                </tr>
            </thead>
            <tbody>
                ${fundsHtml}
            </tbody>
        </table>
    </div>

    <div class="projection-section">
        <h3>Growth Projection over ${data.horizonYears} Years</h3>
        <p style="font-size: 12px; color: #666;">This chart illustrates how your investment of <strong>₹${projection.totalInvested.toLocaleString('en-IN')}</strong> could grow to <strong>₹${projection.finalValue.toLocaleString('en-IN')}</strong> at a conservative 12% annual return.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background: #f0f2f5;">
                    <th style="padding: 10px; text-align: left;">Year</th>
                    <th style="padding: 10px; text-align: right;">Projected Value</th>
                </tr>
            </thead>
            <tbody>
                ${projection.yearlyData.filter((_d: any, i: number) => i % Math.max(1, Math.floor(data.horizonYears / 5)) === 0 || i === data.horizonYears).map((d: any) => `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Year ${d.year}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${d.value.toLocaleString('en-IN')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <div style="font-weight: bold;">Standard Disclaimers:</div>
        <div class="disclaimer">Mutual Fund investments are subject to market risks, read all scheme related documents carefully. The projections provided are for illustrative purposes only based on an assumed 12% CAGR and are not guaranteed. Past performance is not indicative of future results.</div>
        <div style="margin-top: 20px; text-align: center;">Generated via WealthMax Advisory AI Platform</div>
    </div>
</body>
</html>
        `;
    }
}
