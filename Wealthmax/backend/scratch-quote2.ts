async function run() {
  try {
    const YahooFinance = (await import('yahoo-finance2')).default;
    const yahooFinance = new YahooFinance();
    const quote: any = await yahooFinance.quote('POWERINDIA.NS');
    console.log(Object.keys(quote));
  } catch (err) {
    console.error("RUNTIME ERROR:", err);
  }
}
run();
