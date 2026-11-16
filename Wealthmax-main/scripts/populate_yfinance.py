import yfinance as yf
import psycopg2
import json
import time

DATABASE_URL = "postgresql://postgres.hjljksufiquaoihgsmvq:WeathMax2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

def main():
    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Get all NSE EQ stocks from DB
    cursor.execute("""
        SELECT trading_symbol, underlying_symbol 
        FROM iifl_instruments 
        WHERE exchange = 'NSEEQ' 
          AND instrument_type = '0' 
          AND series IN ('EQ', 'BE', 'BZ', 'SM')
        ORDER BY formatted_name ASC
        LIMIT 500
    """)
    stocks = cursor.fetchall()
    print(f"Found {len(stocks)} stocks.")
    
    # Batch download in chunks of 50
    chunk_size = 50
    for i in range(0, len(stocks), chunk_size):
        chunk = stocks[i:i+chunk_size]
        tickers = [f"{s[1]}.NS" for s in chunk]
        trading_symbols = {f"{s[1]}.NS": s[0] for s in chunk}
        
        print(f"Downloading batch {i//chunk_size + 1}/{len(stocks)//chunk_size + 1}...")
        try:
            data = yf.download(tickers, period="1d", group_by="ticker", threads=True, progress=False)
            
            for ticker in tickers:
                try:
                    ticker_data = data[ticker] if len(tickers) > 1 else data
                    if not ticker_data.empty:
                        close = float(ticker_data['Close'].iloc[0])
                        open_p = float(ticker_data['Open'].iloc[0])
                        high = float(ticker_data['High'].iloc[0])
                        low = float(ticker_data['Low'].iloc[0])
                        vol = int(ticker_data['Volume'].iloc[0])
                        
                        trading_symbol = trading_symbols[ticker]
                        
                        cursor.execute("""
                            INSERT INTO equity_prices 
                                (trading_symbol, ltp, change_amount, change_pct, week_52_high, week_52_low, volume, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                            ON CONFLICT (trading_symbol) DO UPDATE SET
                                ltp = EXCLUDED.ltp,
                                change_amount = EXCLUDED.change_amount,
                                change_pct = EXCLUDED.change_pct,
                                week_52_high = EXCLUDED.week_52_high,
                                week_52_low = EXCLUDED.week_52_low,
                                volume = EXCLUDED.volume,
                                updated_at = NOW()
                        """, (
                            trading_symbol, close, close - open_p, 
                            ((close - open_p) / open_p) * 100 if open_p > 0 else 0,
                            high, low, vol
                        ))
                except Exception as e:
                    pass
            conn.commit()
            print(f"Committed batch {i//chunk_size + 1}")
        except Exception as e:
            print(f"Error in batch: {e}")
            
    cursor.close()
    conn.close()
    print("Done!")

if __name__ == "__main__":
    main()
