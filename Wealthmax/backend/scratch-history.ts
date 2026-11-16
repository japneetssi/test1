async function run() {
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yahooFinance = new YahooFinance();
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    const queryOptions = { period1: oneYearAgo.toISOString().split('T')[0], interval: '1mo' as const };
    const historical: any = await yahooFinance.historical('POWERINDIA.NS', queryOptions);
    console.log("HISTORY LENGTH:", historical.length);
  } catch (err) {
    console.error("RUNTIME ERROR:", err);
  }
}
run();
