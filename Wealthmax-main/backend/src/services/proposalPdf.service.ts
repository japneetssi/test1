import { randomUUID } from 'crypto';
import logger from '../config/logger';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ProposalFund {
    schemeCode: string | number;
    schemeName: string;
    weight: number; // percentage 0-100
}

export interface ProposalBranding {
    companyName: string;
    logoUrl?: string;
    primaryColor: string;
    actionColor?: string;
}

export interface ProposalInput {
    clientName: string;
    advisorName: string;
    proposalType: 'SIP' | 'Lumpsum';
    funds: ProposalFund[];
    amount: number;
    horizonYears: number;
    assumedCagr: number; // e.g. 12
    branding: ProposalBranding;
}

interface ProjectionPoint {
    year: number;
    invested: number;
    projected: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ProposalPdfService {

    /**
     * Generate an Investment Proposal HTML String
     */
    public static async getProposalHtml(input: ProposalInput): Promise<string> {
        try {
            const reportId = `WM-PRP-${randomUUID().slice(0, 8).toUpperCase()}`;
            const generatedDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
            });

            // Calculate projections
            const projectionData = this.calculateProjection(input);
            const finalValue = projectionData[projectionData.length - 1].projected;
            const totalInvested = projectionData[projectionData.length - 1].invested;

            const html = this.buildHtml(input, projectionData, finalValue, totalInvested, reportId, generatedDate);

            logger.info(`Proposal HTML generated: ${reportId}`);
            return html;

        } catch (error) {
            logger.error('Proposal HTML Generation failed', error);
            throw error;
        }
    }

    // ── Projection Math ───────────────────────────────────────────────────

    private static calculateProjection(input: ProposalInput): ProjectionPoint[] {
        const { proposalType, amount, horizonYears, assumedCagr } = input;
        const rate = assumedCagr / 100;
        const points: ProjectionPoint[] = [{ year: 0, invested: 0, projected: 0 }];

        if (proposalType === 'Lumpsum') {
            for (let y = 1; y <= horizonYears; y++) {
                points.push({
                    year: y,
                    invested: amount,
                    projected: Math.round(amount * Math.pow(1 + rate, y))
                });
            }
        } else {
            // SIP: monthly investment
            const monthlyRate = rate / 12;
            for (let y = 1; y <= horizonYears; y++) {
                const months = y * 12;
                const invested = amount * months;
                const fv = amount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
                points.push({
                    year: y,
                    invested: Math.round(invested),
                    projected: Math.round(fv)
                });
            }
        }

        return points;
    }

    // ── Format Helpers ────────────────────────────────────────────────────

    private static formatINR(amount: number): string {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        }).format(amount);
    }

    // ── HTML Builder ──────────────────────────────────────────────────────

    private static buildHtml(
        input: ProposalInput,
        projection: ProjectionPoint[],
        finalValue: number,
        totalInvested: number,
        reportId: string,
        generatedDate: string
    ): string {
        const { branding, clientName, advisorName, proposalType, funds, amount, horizonYears, assumedCagr } = input;
        const pc = branding.primaryColor || '#1a56db';
        const ac = branding.actionColor || '#f37920';
        const wealthGain = finalValue - totalInvested;
        const gainPercent = totalInvested > 0 ? ((wealthGain / totalInvested) * 100).toFixed(0) : '0';

        const logoHtml = branding.logoUrl
            ? `<img src="${branding.logoUrl}" alt="${branding.companyName}" style="max-height:60px;margin-bottom:16px;" />`
            : '';

        // Fund allocation rows
        const fundRows = funds.map((f, i) => `
            <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;font-size:11pt;color:#374151;">${i + 1}</td>
                <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;font-size:11pt;font-weight:600;color:#1f2937;">${f.schemeName}</td>
                <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
                            <div style="height:100%;width:${f.weight}%;background:linear-gradient(90deg,${pc},${pc}cc);border-radius:4px;"></div>
                        </div>
                        <span style="font-size:11pt;font-weight:700;color:${pc};min-width:45px;">${f.weight}%</span>
                    </div>
                </td>
                <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:11pt;font-weight:600;color:#1f2937;">
                    ${this.formatINR(proposalType === 'SIP' ? (amount * f.weight / 100) : (amount * f.weight / 100))}
                </td>
            </tr>
        `).join('');

        // Chart data
        const chartLabels = JSON.stringify(projection.map(p => `Year ${p.year}`));
        const chartProjected = JSON.stringify(projection.map(p => p.projected));
        const chartInvested = JSON.stringify(projection.map(p => p.invested));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${branding.companyName} Investment Proposal</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.5; }
        .page { page-break-after: always; padding: 50px; min-height: 100vh; position: relative; }
        .page:last-child { page-break-after: avoid; }

        /* Cover */
        .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; min-height: 90vh; }
        .cover-company { font-size: 36pt; font-weight: 700; color: ${pc}; margin-bottom: 4px; }
        .cover-tagline { font-size: 11pt; color: #6b7280; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 50px; }
        .cover-line { width: 180px; height: 3px; background: linear-gradient(90deg, ${pc}, ${ac}); margin: 30px auto; border-radius: 2px; }
        .cover-title { font-size: 22pt; font-weight: 700; color: #1f2937; margin-bottom: 10px; }
        .cover-subtitle { font-size: 14pt; color: ${pc}; font-weight: 600; margin-bottom: 50px; letter-spacing: 1px; }
        .cover-client { font-size: 18pt; font-weight: 600; color: #374151; margin-bottom: 8px; }
        .cover-date { font-size: 11pt; color: #9ca3af; }
        .cover-footer { position: absolute; bottom: 40px; left: 50px; right: 50px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        .cover-footer p { font-size: 9pt; color: #9ca3af; margin: 2px 0; }

        /* Section */
        .section-header { font-size: 16pt; font-weight: 700; color: ${pc}; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 2px solid ${pc}; }
        .section-subtext { font-size: 10pt; color: #6b7280; margin-bottom: 24px; }

        /* Summary Cards */
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
        .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
        .summary-card.primary { background: linear-gradient(135deg, ${pc}12, ${pc}06); border-color: ${pc}30; }
        .summary-label { font-size: 9pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600; }
        .summary-value { font-size: 20pt; font-weight: 700; color: #1f2937; }
        .summary-value.accent { color: ${pc}; }
        .summary-sub { font-size: 10pt; color: #10b981; margin-top: 4px; font-weight: 600; }

        /* Fund Table */
        .fund-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px; }
        .fund-table th { background: #f9fafb; padding: 14px 16px; text-align: left; font-size: 9pt; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
        .fund-table th:nth-child(3) { text-align: center; }
        .fund-table th:last-child { text-align: right; }

        /* Chart */
        .chart-container { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; height: 340px; }
        .chart-legend { display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 10pt; color: #6b7280; }
        .legend-dot { width: 12px; height: 12px; border-radius: 6px; }

        /* Projection Summary */
        .proj-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .proj-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; }
        .proj-card.highlight { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-color: #6ee7b7; }
        .proj-card .proj-label { font-size: 9pt; color: #6b7280; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
        .proj-card .proj-value { font-size: 22pt; font-weight: 700; color: #1f2937; }
        .proj-card .proj-value.green { color: #059669; }
        .proj-card .proj-value.blue { color: ${pc}; }

        /* Disclaimers */
        .disclaimer-section { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin-top: 30px; }
        .disclaimer-title { font-size: 11pt; font-weight: 700; color: #991b1b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .disclaimer-text { font-size: 8.5pt; color: #7f1d1d; line-height: 1.7; }
        .disclaimer-text p { margin-bottom: 6px; }
        .compliance-meta { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 1px solid #fecaca; font-size: 8pt; color: #991b1b; }

        /* Assumptions */
        .assumptions-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
        .assumptions-title { font-size: 10pt; font-weight: 700; color: #92400e; margin-bottom: 8px; }
        .assumptions-text { font-size: 9pt; color: #92400e; line-height: 1.6; }
    </style>
</head>
<body>

    <!-- PAGE 1: Cover Page -->
    <div class="page cover">
        ${logoHtml}
        <div class="cover-company">${branding.companyName}</div>
        <div class="cover-tagline">Investment Advisory</div>
        <div class="cover-line"></div>
        <div class="cover-title">Investment Proposal</div>
        <div class="cover-subtitle">${proposalType === 'SIP' ? 'Systematic Investment Plan' : 'Lumpsum Investment'}</div>
        <div class="cover-client">Prepared for: ${clientName}</div>
        <div class="cover-date">${generatedDate}</div>
        <div class="cover-footer">
            <p>Proposal ID: ${reportId} · Prepared by: ${advisorName}</p>
            <p style="font-style:italic;">This is an illustrative proposal, not a binding commitment. Past performance is not indicative of future results.</p>
        </div>
    </div>

    <!-- PAGE 2: Fund Allocation & Summary -->
    <div class="page">
        <div class="section-header">Proposed Fund Allocation</div>
        <div class="section-subtext">The following ${proposalType === 'SIP' ? 'monthly SIP' : 'lumpsum'} allocation has been recommended based on your financial profile and risk appetite.</div>

        <div class="summary-grid">
            <div class="summary-card primary">
                <div class="summary-label">Investment Type</div>
                <div class="summary-value accent">${proposalType}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">${proposalType === 'SIP' ? 'Monthly Amount' : 'Investment Amount'}</div>
                <div class="summary-value">${this.formatINR(amount)}</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Investment Horizon</div>
                <div class="summary-value">${horizonYears} Years</div>
            </div>
            <div class="summary-card">
                <div class="summary-label">Total Funds</div>
                <div class="summary-value">${funds.length}</div>
            </div>
        </div>

        <table class="fund-table">
            <thead>
                <tr>
                    <th style="width:40px;">#</th>
                    <th>Scheme Name</th>
                    <th style="min-width:200px;">Weight Allocation</th>
                    <th style="width:140px;">${proposalType === 'SIP' ? 'Monthly SIP' : 'Amount'}</th>
                </tr>
            </thead>
            <tbody>
                ${fundRows}
            </tbody>
            <tfoot>
                <tr style="background:#f9fafb;">
                    <td colspan="2" style="padding:14px 16px;font-weight:700;color:#374151;border-top:2px solid #e5e7eb;">Total</td>
                    <td style="padding:14px 16px;font-weight:700;color:${pc};text-align:center;border-top:2px solid #e5e7eb;">100%</td>
                    <td style="padding:14px 16px;font-weight:700;color:#1f2937;text-align:right;border-top:2px solid #e5e7eb;">${this.formatINR(amount)}</td>
                </tr>
            </tfoot>
        </table>

        <div class="assumptions-box">
            <div class="assumptions-title">⚠️ Assumptions & Methodology</div>
            <div class="assumptions-text">
                Projections are based on an assumed CAGR of <strong>${assumedCagr}%</strong> per annum, compounded ${proposalType === 'SIP' ? 'monthly' : 'annually'}.
                Actual returns may vary based on market conditions, fund selection, and timing. Tax implications like LTCG, STCG, and exit loads have not been factored.
            </div>
        </div>
    </div>

    <!-- PAGE 3: Growth Projection -->
    <div class="page">
        <div class="section-header">Wealth Growth Projection</div>
        <div class="section-subtext">Projected growth of your ${proposalType === 'SIP' ? 'SIP' : 'lumpsum'} investment over ${horizonYears} years at ${assumedCagr}% assumed CAGR.</div>

        <div class="chart-legend">
            <div class="legend-item"><div class="legend-dot" style="background:${pc};"></div> Projected Value</div>
            <div class="legend-item"><div class="legend-dot" style="background:#94a3b8;"></div> Total Invested</div>
        </div>

        <div class="chart-container">
            <canvas id="projectionChart"></canvas>
        </div>

        <div class="proj-grid">
            <div class="proj-card">
                <div class="proj-label">Total Invested</div>
                <div class="proj-value">${this.formatINR(totalInvested)}</div>
            </div>
            <div class="proj-card highlight">
                <div class="proj-label">Projected Value</div>
                <div class="proj-value blue">${this.formatINR(finalValue)}</div>
            </div>
            <div class="proj-card">
                <div class="proj-label">Estimated Wealth Gain</div>
                <div class="proj-value green">+${this.formatINR(wealthGain)}</div>
                <div style="font-size:10pt;color:#10b981;font-weight:600;margin-top:4px;">+${gainPercent}% growth</div>
            </div>
        </div>

        <!-- SEBI Disclaimers -->
        <div class="disclaimer-section">
            <div class="disclaimer-title">🛡️ Important Regulatory Disclaimers</div>
            <div class="disclaimer-text">
                <p><strong>SEBI Registration:</strong> Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.</p>
                <p><strong>No Guarantee:</strong> The projections shown are hypothetical and for illustrative purposes only. They do not guarantee any specific returns. Past performance of any scheme is not indicative of future performance.</p>
                <p><strong>Regulatory Compliance:</strong> This proposal is generated in compliance with SEBI (Investment Advisers) Regulations, 2013. The advisor is registered with SEBI/AMFI.</p>
                <p><strong>Risk Disclosure:</strong> The value of investments and the income from them can go down as well as up. You may not get back the amount originally invested. Sector-specific and thematic funds carry higher concentration risk.</p>
                <p><strong>Tax Disclaimer:</strong> Tax treatment depends on individual circumstances and may change in the future. Investors should consult their own tax advisors.</p>
                <p><strong>Advisory Note:</strong> This is advisory-only, read-only software. No trading, execution, or transaction functionality is provided. All investment decisions are at the investor's discretion.</p>
            </div>
            <div class="compliance-meta">
                <span>Report ID: ${reportId}</span>
                <span>Generated: ${new Date().toISOString()}</span>
                <span>${branding.companyName} · Advisory Services</span>
            </div>
        </div>
    </div>

    <script>
        window.__chartRendered = false;
        document.addEventListener('DOMContentLoaded', function() {
            try {
                const ctx = document.getElementById('projectionChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ${chartLabels},
                        datasets: [
                            {
                                label: 'Projected Value',
                                data: ${chartProjected},
                                borderColor: '${pc}',
                                backgroundColor: '${pc}18',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 4,
                                pointBackgroundColor: '${pc}',
                                pointBorderColor: '#fff',
                                pointBorderWidth: 2
                            },
                            {
                                label: 'Total Invested',
                                data: ${chartInvested},
                                borderColor: '#94a3b8',
                                backgroundColor: '#94a3b818',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.1,
                                borderDash: [6, 4],
                                pointRadius: 3,
                                pointBackgroundColor: '#94a3b8'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: '#f3f4f6' },
                                ticks: {
                                    font: { size: 10 },
                                    color: '#6b7280',
                                    callback: function(value) {
                                        if (value >= 10000000) return '₹' + (value/10000000).toFixed(1) + ' Cr';
                                        if (value >= 100000) return '₹' + (value/100000).toFixed(1) + ' L';
                                        return '₹' + value.toLocaleString('en-IN');
                                    }
                                }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { font: { size: 10 }, color: '#6b7280' }
                            }
                        }
                    }
                });
                window.__chartRendered = true;
            } catch(e) {
                window.__chartRendered = true;
            }
        });
    </script>

</body>
</html>`;
    }
}
