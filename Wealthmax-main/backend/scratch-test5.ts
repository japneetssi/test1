import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
async function run() {
    try {
        const res = await yahooFinance.chart('POWERINDIA.NS', { period1: '2026-07-15', interval: '5m' });
        console.log(res.quotes.slice(0, 5));
    } catch(e) {
        console.error(e);
    }
}
run();
