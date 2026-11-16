import api from '@/lib/api';

// ── Types (kept identical for component compatibility) ────────────────────────

export interface GapItem {
  label: string;
  ideal: number;
  actual: number;
}

export interface ActionItem {
  priority: number;
  title: string;
  description: string;
  status: 'critical' | 'high' | 'medium' | 'low';
}

export interface ScoreBreakdown {
  savings: number;
  debt: number;
  liquidity: number;
  diversification: number;
  insurance: number;
  goalProgress: number;
}

export interface ReportPayload {
  userName: string;
  clientId: string;
  healthScore: number;
  grade: string;
  riskClass: string;
  persona: string;
  gapAnalysis: GapItem[];
  actionItems: ActionItem[];
  scoreBreakdown: ScoreBreakdown;
}

export interface ReportResult {
  html: string;
  generatedAt: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Downloads the advisory HTML report from the Express backend.
 * Returns the raw HTML string.
 */
export async function downloadAdvisoryReportHTML(): Promise<string> {
  const response = await api.get('/portfolio/report/pdf', {
    responseType: 'text',
  });
  return response.data as string;
}

/**
 * Generates report and returns HTML string.
 * Compatible with the existing call-site in Reports.tsx.
 */
export async function generateAdvisoryReport(
  _payload: ReportPayload
): Promise<ReportResult> {
  // Backend derives all report data from stored profile + holdings.
  // The payload is ignored in favour of server-side data (real-data mode).
  const htmlString = await downloadAdvisoryReportHTML();

  return {
    html: htmlString,          // used by printReportAsPDF below
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Converts the raw HTML string into a PDF using html2pdf.js and triggers download.
 */
export function printReportAsPDF(htmlString: string) {
  const element = document.createElement('div');
  element.innerHTML = htmlString;
  
  const opt = {
    margin:       0,
    filename:     'Financial_Advisory_Report.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  // Dynamically import html2pdf.js to keep bundle size small
  import('html2pdf.js').then((html2pdfModule) => {
      const html2pdf = html2pdfModule.default || html2pdfModule;
      html2pdf().set(opt).from(element).save();
  }).catch(err => {
      console.error('Failed to load html2pdf.js, using fallback', err);
      // Fallback: treat as raw HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups to download the report.');
      }
      printWindow.document.write(htmlString);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
  });
}
