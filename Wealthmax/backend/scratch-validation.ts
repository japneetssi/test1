async function run() {
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    // can we pass { validateResult: false }? Let's see
    const yahooFinance = new YahooFinance({ validateResult: false });
    const quote: any = await yahooFinance.quoteSummary('3MINDIA.NS', { modules: ['summaryDetail', 'defaultKeyStatistics', 'price'] });
    console.log("PRICE:", quote.price?.regularMarketPrice);
  } catch (err) {
    console.error("RUNTIME ERROR:", err);
  }
}
run();
