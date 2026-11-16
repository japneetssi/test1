import yahooFinance from 'yahoo-finance2';

async function run() {
  try {
    const quote = await yahooFinance.quoteSummary('RELIANCE.NS', { modules: ['price'] });
    console.log("PRICE:", quote.price?.regularMarketPrice);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
