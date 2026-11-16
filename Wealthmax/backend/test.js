const { execSync } = require('child_process');
async function test() {
    const res = await fetch('https://finapi.upvaly.com/api/mf/scheme-code/100868');
    const response = await res.json();
    const data = response.data;
    const aumStr = data.aum ? String(data.aum).replace(/,/g, '') : null;
    const aum = aumStr ? parseFloat(aumStr) : null;
    let cagr1y = data.cagr?.['1y'] ? parseFloat(data.cagr['1y'].toString()) : null;
    let cagr3y = data.cagr?.['3y'] ? parseFloat(data.cagr['3y'].toString()) : null;
    let cagr5y = data.cagr?.['5y'] ? parseFloat(data.cagr['5y'].toString()) : null;
    console.log({ aum, cagr1y, cagr3y, cagr5y });
}
test();
