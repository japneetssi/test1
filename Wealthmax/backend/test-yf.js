const yf = require('yahoo-finance2').default;
const yahooFinance = new yf();
async function run() {
    try {
        const tickers = ['RELIANCE.NS', 'A1B2C3D4E5F6.NS', 'TCS.NS'];
        const result = await yahooFinance.quote(tickers);
        console.log("Input:", tickers);
        console.log("Output:", result.map(r => r.symbol));
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
