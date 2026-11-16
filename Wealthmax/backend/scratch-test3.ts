import yahooFinance from 'yahoo-finance2';

async function run() {
  try {
    const quote = await yahooFinance.quote('POWERINDIA.NS');
    console.log(quote);
  } catch (err) {
    console.error('Yahoo Finance Error:', err);
  }
}
run();
