import axios from 'axios';

async function run() {
  try {
    const res = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/POWERINDIA.NS');
    const result = res.data.chart.result[0];
    const price = result.meta.regularMarketPrice;
    console.log("AXIOS PRICE:", price);
  } catch (err: any) {
    console.error("AXIOS ERROR:", err.message);
  }
}
run();
