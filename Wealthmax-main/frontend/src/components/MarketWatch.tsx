import { TrendingUp, TrendingDown } from "lucide-react";

const stocks = [
  { name: "RELIANCE", ltp: 2487.35, change: 1.24 },
  { name: "TCS", ltp: 3654.20, change: -0.87 },
  { name: "HDFCBANK", ltp: 1678.90, change: 0.52 },
  { name: "INFY", ltp: 1432.15, change: -1.35 },
  { name: "ICICIBANK", ltp: 1245.60, change: 2.10 },
  { name: "SBIN", ltp: 834.75, change: -0.44 },
];

const MarketWatch = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
        <h3 className="font-bold text-slate-800 text-base">Market Watch</h3>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">NIFTY 50</span>
      </div>
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="grid grid-cols-3 px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100 bg-slate-50">
          <span>Scrip</span>
          <span className="text-right">LTP</span>
          <span className="text-right">Chg%</span>
        </div>
        
        {/* Rows */}
        <div className="flex flex-col">
          {stocks.map((stock, index) => {
            const isGain = stock.change >= 0;
            return (
              <div
                key={stock.name}
                className={`grid grid-cols-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors cursor-pointer ${
                  index !== stocks.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <span className="font-semibold text-slate-700">{stock.name}</span>
                <span className="text-right font-medium text-slate-900">{stock.ltp.toFixed(2)}</span>
                <span className={`text-right font-bold flex items-center justify-end gap-1 ${isGain ? "text-green-600" : "text-red-500"}`}>
                  {isGain ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {isGain ? "+" : ""}{stock.change.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketWatch;
