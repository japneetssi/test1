import axios from 'axios';

async function run() {
  try {
    const res = await axios.get('https://www.google.com/finance/quote/POWERINDIA:NSE');
    const html = res.data;
    const match = html.match(/class="YMlKec fxKbKc">₹([^<]+)<\/div>/);
    if (match) {
        console.log("GOOGLE FINANCE PRICE:", match[1].replace(/,/g, ''));
    } else {
        console.log("NOT FOUND");
    }
  } catch (err: any) {
    console.error("AXIOS ERROR:", err.message);
  }
}
run();
