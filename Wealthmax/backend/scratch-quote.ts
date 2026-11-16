async function run() {
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yahooFinance = new YahooFinance();
    const quote: any = await yahooFinance.quote('POWERINDIA.NS');
    console.log("QUOTE:", quote.regularMarketPrice, quote.marketCap, quote.trailingPE);
  } catch (err) {
    console.error("RUNTIME ERROR:", err);
  }
}
run();
