async function run() {
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yahooFinance = new YahooFinance();
    const quote: any = await yahooFinance.quoteSummary('POWERINDIA.NS', { modules: ['price'] });
    console.log("PRICE POWERINDIA.NS:", quote.price?.regularMarketPrice);
  } catch (err) {
    console.error("RUNTIME ERROR POWERINDIA:", err);
  }

  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yahooFinance = new YahooFinance();
    const quote: any = await yahooFinance.quoteSummary('HITACHI.NS', { modules: ['price'] });
    console.log("PRICE HITACHI.NS:", quote.price?.regularMarketPrice);
  } catch (err) {
    console.error("RUNTIME ERROR HITACHI:", err);
  }
}
run();
