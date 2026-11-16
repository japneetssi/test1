import { YahooFinance } from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function run() {
  try {
    const quote = await yahooFinance.quote('POWERINDIA.NS');
    console.log(quote);
  } catch (err) {
    console.error('Yahoo Finance Error:', err);
    try {
        const { default: axios } = await import('axios');
        const res = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/POWERINDIA.NS');
        console.log(JSON.stringify(res.data?.chart?.result?.[0]?.meta, null, 2));
    } catch(e) {}
  }
}
run();
