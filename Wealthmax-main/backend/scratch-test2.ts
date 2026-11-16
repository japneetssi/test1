import { MarketplaceDiscoveryService } from './src/services/marketplace-discovery.service';
import { db } from './src/db';

async function run() {
  try {
    const res = await db.query("SELECT instrument_id FROM iifl_instruments WHERE trading_symbol LIKE '%POWERINDIA%'");
    if (res.rows.length > 0) {
        const id = "iifl-" + res.rows[0].instrument_id;
        const prod = await MarketplaceDiscoveryService.getProductById(id);
        console.log("PROD:", prod.nav, prod.marketCap, prod.peRatio);
        const hist = await MarketplaceDiscoveryService.getHistory(id);
        console.log("HIST:", hist.length > 0 ? hist[0] : "empty");
    }
  } catch (err) {
    console.error("RUNTIME ERROR:", err);
  }
}
run();
