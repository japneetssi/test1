import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function run() {
    try {
        let news: any[] = [];
        try {
            const search = await yahooFinance.search('RELIANCE.NS', { quotesCount: 0, newsCount: 5 });
            news = search.news;
        } catch(e: any) {
            if (e.result && e.result.news) {
                news = e.result.news;
            }
        }
        
        console.log(news.length, 'news articles found.');
        if (news.length > 0) {
            console.log(news[0]);
        }
        
        // Try to get profile
        const profile = await yahooFinance.quoteSummary('RELIANCE.NS', { modules: ['assetProfile'] as any });
        console.log('\n--- Profile Keys ---');
        console.log(Object.keys(profile));
        console.log(profile.assetProfile?.industry);
        
    } catch(e) {
        console.error('Outer error:', e);
    }
}
run();
