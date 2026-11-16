import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function run() {
    try {
        console.log('--- Company Profile ---');
        const profile = await yahooFinance.quoteSummary('RELIANCE.NS', { modules: ['assetProfile'] as any });
        console.log(Object.keys(profile.assetProfile || {}));
        if (profile.assetProfile) {
             console.log('Sector:', profile.assetProfile.sector);
             console.log('Industry:', profile.assetProfile.industry);
             console.log('Website:', profile.assetProfile.website);
             console.log('Employees:', profile.assetProfile.fullTimeEmployees);
        }

        console.log('\n--- News ---');
        const search = await yahooFinance.search('RELIANCE.NS');
        if (search.news && search.news.length > 0) {
            console.log(search.news.length, 'news articles found.');
            console.log(search.news[0]);
        } else {
            console.log('No news found in search.');
        }
        
    } catch(e) {
        console.error(e);
    }
}
run();
