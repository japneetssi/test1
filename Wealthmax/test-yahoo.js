const https = require('https');
const YAHOO_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://finance.yahoo.com',
};
const url = `https://query1.finance.yahoo.com/v8/finance/chart/AARTIIND.NS?interval=1d&range=1d`;
https.get(url, { headers: YAHOO_HEADERS, timeout: 8000 }, (res) => {
    console.log("Status:", res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
}).on('error', (e) => console.error(e));
