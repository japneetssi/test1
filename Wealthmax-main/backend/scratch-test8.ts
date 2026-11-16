import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function run() {
    try {
        const queryOptions = {
            period1: '2023-01-01',
            type: 'quarterly',
            module: 'all' as any
        };
        const res = await yahooFinance.fundamentalsTimeSeries('POWERINDIA.NS', queryOptions);
        const types = res.map(r => r.TYPE);
        console.log([...new Set(types)]);
    } catch(e) {
        console.error(e);
    }
}
run();
