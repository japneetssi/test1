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
        if (res.length > 0) {
            const allKeys = new Set();
            res.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
            console.log(Array.from(allKeys));
        } else {
            console.log('Empty timeseries');
        }
    } catch(e) {
        console.error(e);
    }
}
run();
