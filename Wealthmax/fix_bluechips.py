import yfinance as yf
import psycopg2

DATABASE_URL = "postgresql://postgres.hjljksufiquaoihgsmvq:WeathMax2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

top_stocks = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'BHARTIARTL',
    'SBIN', 'INFY', 'LICI', 'ITC', 'HINDUNILVR',
    'LT', 'BAJFINANCE', 'HCLTECH', 'MARUTI', 'SUNPHARMA',
    'ADANIENT', 'KOTAKBANK', 'TITAN', 'ONGC', 'TATAMOTORS',
    'BLUEDART', 'KALYANKJIL', 'BECTORSFOOD', 'APOLLOHOSP', 'ASIANPAINT', 'DMART', 'BALKRISIND', 'AUROPHARMA'
]

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

for base in top_stocks:
    ticker = f"{base}.NS"
    try:
        info = yf.Ticker(ticker).info
        mc = info.get('marketCap', 0)
        pe = info.get('trailingPE', 0)
        pb = info.get('priceToBook', 0)
        dy = info.get('dividendYield', 0)
        eps = info.get('trailingEps', 0)
        
        # update DB where underlying_symbol = base
        cursor.execute("""
            UPDATE equity_prices 
            SET market_cap = %s, pe_ratio = %s, pb_ratio = %s, dividend_yield = %s, eps = %s
            WHERE trading_symbol IN (
                SELECT trading_symbol FROM iifl_instruments WHERE underlying_symbol = %s
            )
        """, (mc, pe, pb, dy, eps, base))
        conn.commit()
        print(f"Updated metadata for {base}")
    except Exception as e:
        print(f"Failed {base}: {e}")

conn.close()
