import yfinance as yf
import psycopg2

DATABASE_URL = "postgresql://postgres.hjljksufiquaoihgsmvq:WeathMax2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

# This is the exact list from the backend codebase (marketplace-discovery.service.ts)
top_stocks_trading_symbols = [
    'RELIANCE-EQ', 'TCS-EQ', 'HDFCBANK-EQ', 'ICICIBANK-EQ', 'BHARTIARTL-EQ',
    'SBIN-EQ', 'INFY-EQ', 'LICI-EQ', 'ITC-EQ', 'HINDUNILVR-EQ',
    'LT-EQ', 'BAJFINANCE-EQ', 'HCLTECH-EQ', 'MARUTI-EQ', 'SUNPHARMA-EQ',
    'ADANIENT-EQ', 'KOTAKBANK-EQ', 'TITAN-EQ', 'ONGC-EQ', 'TATAMOTORS-EQ',
    'NTPC-EQ', 'AXISBANK-EQ', 'DMART-EQ', 'ADANIGREEN-EQ', 'ADANIPORTS-EQ',
    'ULTRACEMCO-EQ', 'ASIANPAINT-EQ', 'COALINDIA-EQ', 'BAJAJFINSV-EQ',
    'BAJAJ-AUTO-EQ', 'POWERGRID-EQ', 'NESTLEIND-EQ', 'WIPRO-EQ', 'M&M-EQ',
    'IOC-EQ', 'JIOFIN-EQ', 'HAL-EQ', 'DLF-EQ', 'ADANIPOWER-EQ',
    'JSWSTEEL-EQ', 'TATASTEEL-EQ', 'SIEMENS-EQ', 'IRFC-EQ', 'VBL-EQ',
    'ZOMATO-EQ', 'PIDILITIND-EQ', 'GRASIM-EQ', 'SBILIFE-EQ', 'BEL-EQ',
    'LTIM-EQ', 'TRENT-EQ', 'HDFCLIFE-EQ', 'APOLLOHOSP-EQ', 'CIPLA-EQ',
    'DRREDDY-EQ', 'DIVISLAB-EQ', 'EICHERMOT-EQ', 'HINDALCO-EQ',
    'INDUSINDBK-EQ', 'SBICARD-EQ', 'SHREECEM-EQ', 'TATACONSUM-EQ',
    'TECHM-EQ', 'TORNTPHARM-EQ', 'HEROMOTOCO-EQ', 'BPCL-EQ',
    'GODREJCP-EQ', 'BRITANNIA-EQ', 'DABUR-EQ', 'MARICO-EQ',
    'NYKAA-EQ', 'PAYTM-EQ', 'ZYDUSLIFE-EQ', 'MUTHOOTFIN-EQ',
    'BLUEDART-EQ', 'KALYAN-EQ', 'MRSFOODSPEC-EQ', 'INDUSTOWER-EQ',
    'AUROPHARMA-EQ', 'BANKBARODA-EQ', 'CANBK-EQ', 'PNB-EQ',
    'IDFCFIRSTB-EQ', 'FEDERALBNK-EQ', 'JINDALSTEL-EQ', 'NMDC-EQ',
    'SAIL-EQ', 'GAIL-EQ', 'RECLTD-EQ', 'PFC-EQ', 'TATAPOWER-EQ',
    'CESC-EQ', 'TORNTPOWER-EQ', 'APOLLOTYRE-EQ', 'MOTHERSON-EQ',
    'BALKRISIND-EQ', 'MRF-EQ', 'TATACHEM-EQ', 'UPL-EQ', 'PIIND-EQ'
]

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# Get underlying symbols mapping
cursor.execute("SELECT trading_symbol, underlying_symbol FROM iifl_instruments WHERE trading_symbol = ANY(%s)", (top_stocks_trading_symbols,))
rows = cursor.fetchall()
trading_to_underlying = {row[0]: row[1] for row in rows}

print(f"Found {len(rows)} matching underlying symbols for {len(top_stocks_trading_symbols)} top stocks.")

# Fallbacks for specific edge cases where IIFL name != Yahoo name
manual_overrides = {
    'M&M': 'M&M',
    'BAJAJ-AUTO': 'BAJAJ-AUTO',
    'MRSFOODSPEC': 'BECTORSFOOD',
    'KALYAN': 'KALYANKJIL',
    'NYKAA': 'FSN', # FSN E-Commerce Ventures
    'PAYTM': 'PAYTM' # One 97 Communications
}

for ts in top_stocks_trading_symbols:
    underlying = trading_to_underlying.get(ts)
    if not underlying:
        # try to derive
        underlying = ts.replace('-EQ', '')
        
    if underlying in manual_overrides:
        underlying = manual_overrides[underlying]
        
    ticker = f"{underlying}.NS"
    
    try:
        t = yf.Ticker(ticker)
        
        # Get OHLCV
        hist = t.history(period="1d")
        if not hist.empty:
            close = float(hist['Close'].iloc[-1])
            open_p = float(hist['Open'].iloc[-1])
            high = float(hist['High'].iloc[-1])
            low = float(hist['Low'].iloc[-1])
            vol = int(hist['Volume'].iloc[-1])
            
            change_amt = close - open_p
            change_pct = (change_amt / open_p) * 100 if open_p > 0 else 0
        else:
            close, change_amt, change_pct, high, low, vol = 0, 0, 0, 0, 0, 0
            
        # Get Info
        info = t.info
        mc = info.get('marketCap', 0)
        pe = info.get('trailingPE', 0)
        pb = info.get('priceToBook', 0)
        dy = info.get('dividendYield', 0)
        eps = info.get('trailingEps', 0)
        
        if dy:
            dy = dy * 100 # convert to percentage
            
        if close > 0:
            cursor.execute("""
                INSERT INTO equity_prices 
                    (trading_symbol, ltp, change_amount, change_pct, market_cap, pe_ratio, pb_ratio, dividend_yield, week_52_high, week_52_low, volume, eps, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (trading_symbol) DO UPDATE SET
                    ltp = EXCLUDED.ltp,
                    change_amount = EXCLUDED.change_amount,
                    change_pct = EXCLUDED.change_pct,
                    market_cap = EXCLUDED.market_cap,
                    pe_ratio = EXCLUDED.pe_ratio,
                    pb_ratio = EXCLUDED.pb_ratio,
                    dividend_yield = EXCLUDED.dividend_yield,
                    week_52_high = EXCLUDED.week_52_high,
                    week_52_low = EXCLUDED.week_52_low,
                    volume = EXCLUDED.volume,
                    eps = EXCLUDED.eps,
                    updated_at = NOW()
            """, (ts, close, change_amt, change_pct, mc, pe, pb, dy, high, low, vol, eps))
            conn.commit()
            print(f"✅ Updated {ts} (Price: {close}, MC: {mc})")
        else:
            print(f"❌ No history found for {ticker} ({ts})")
            
    except Exception as e:
        print(f"⚠️ Failed {ts} ({ticker}): {e}")

conn.close()
print("Done!")
