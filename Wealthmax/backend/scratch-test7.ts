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
            console.log(Object.keys(res[0]));
        } else {
            console.log('Empty timeseries');
        }
    } catch(e) {
        console.error(e);
    }
}
run();
