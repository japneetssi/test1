function generateMock(id: string, name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const baseNav = Math.abs(hash % 5000) + 100;
    const baseMCap = Math.abs(hash % 1000000) + 10000;
    return {
        nav: parseFloat(baseNav.toFixed(2)),
        marketCap: `₹${baseMCap.toLocaleString('en-IN')} Cr`,
        peRatio: parseFloat(((hash % 50) + 10).toFixed(2)),
        pbRatio: parseFloat(((hash % 15) + 1).toFixed(2)),
        industryPe: parseFloat(((hash % 60) + 15).toFixed(2)),
        debtToEquity: parseFloat(((hash % 30) / 10).toFixed(2)),
        roe: `${parseFloat(((hash % 25) + 10).toFixed(2))}%`,
        eps: parseFloat(((hash % 100) + 5).toFixed(2)),
        dividendYield: parseFloat(((hash % 5) + 0.5).toFixed(2))
    };
}
console.log(generateMock("iifl-123", "HITACHI ENERGY INDIA LTD"));
