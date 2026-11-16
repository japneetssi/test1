import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function run() {
    try {
        const modules = ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'price', 'majorHoldersBreakdown', 'institutionOwnership', 'fundOwnership', 'insiderHolders', 'calendarEvents', 'earnings', 'incomeStatementHistory', 'balanceSheetHistory', 'cashflowStatementHistory'];
        const res = await yahooFinance.quoteSummary('POWERINDIA.NS', { modules: modules as any });
        console.log(JSON.stringify(Object.keys(res), null, 2));
        if (res.financialData) console.log('financialData:', Object.keys(res.financialData));
        if (res.defaultKeyStatistics) console.log('defaultKeyStatistics:', Object.keys(res.defaultKeyStatistics));
        if (res.summaryDetail) console.log('summaryDetail:', Object.keys(res.summaryDetail));
        if (res.majorHoldersBreakdown) console.log('majorHoldersBreakdown:', res.majorHoldersBreakdown);
    } catch(e) {
        console.error(e);
    }
}
run();
