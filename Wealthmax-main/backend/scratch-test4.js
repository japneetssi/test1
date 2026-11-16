const yahooFinance = require('yahoo-finance2').default;

async function run() {
  try {
    const quote = await yahooFinance.quote('POWERINDIA.NS');
    console.log(quote);
  } catch (err) {
    console.error('Yahoo Finance Error:', err);
    try {
        const axios = require('axios').default;
        const res = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/POWERINDIA.NS');
        console.log(JSON.stringify(res.data?.chart?.result?.[0]?.meta, null, 2));
    } catch(e) {}
  }
}
run();
