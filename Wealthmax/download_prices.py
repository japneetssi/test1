import yfinance as yf
import json
import sys

tickers = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "SBIN.NS", "INFY.NS", "LICI.NS", "ITC.NS", "HINDUNILVR.NS",
           "LT.NS", "BAJFINANCE.NS", "HCLTECH.NS", "MARUTI.NS", "SUNPHARMA.NS", "ADANIENT.NS", "KOTAKBANK.NS", "TITAN.NS", "ONGC.NS", "TATAMOTORS.NS",
           "BLUEDART.NS", "KALYANKJIL.NS", "BECTORSFOOD.NS", "APOLLOHOSP.NS", "ASIANPAINT.NS", "DMART.NS", "BALKRISIND.NS", "AUROPHARMA.NS"]

data = yf.download(tickers, period="1d", group_by="ticker", threads=True, progress=False)

results = []
for t in tickers:
    try:
        # yf.download with multiple tickers returns a MultiIndex DataFrame
        ticker_data = data[t] if len(tickers) > 1 else data
        if not ticker_data.empty:
            close = float(ticker_data['Close'].iloc[0])
            open_p = float(ticker_data['Open'].iloc[0])
            high = float(ticker_data['High'].iloc[0])
            low = float(ticker_data['Low'].iloc[0])
            vol = int(ticker_data['Volume'].iloc[0])
            results.append({
                "ticker": t,
                "ltp": close,
                "change_amount": close - open_p,
                "change_pct": ((close - open_p) / open_p) * 100,
                "volume": vol,
                "week_52_high": high,
                "week_52_low": low
            })
    except Exception as e:
        pass

print(json.dumps(results))
