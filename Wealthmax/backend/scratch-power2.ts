async function run() {
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yahooFinance = new YahooFinance();
    const quote: any = await yahooFinance.quoteSummary('POWERINDIA.NS', { modules: ['summaryDetail', 'defaultKeyStatistics', 'price'] });
    console.log("MARKET CAP:", quote.summaryDetail?.marketCap);
  } catch (err) {
    console.error("RUNTIME ERROR:", err);
  }
}
run();
