import React from "react";

export default function MarketIndicators() {
  return (
    <div className="grid grid-cols-2 gap-3.5">
      {/* Market Direction */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 tracking-tight">Market Direction</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">Bearish</h3>
        </div>
        <p className="text-xs font-semibold text-[#f43f5e] mt-4 flex items-center gap-1">
          <span>-1.321%</span>
          <span className="text-slate-400 font-normal">last 7 day</span>
        </p>
      </div>

      {/* Market Momentum */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 tracking-tight">Market Momentum</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">Bullish</h3>
        </div>
        <p className="text-xs font-semibold text-[#10b981] mt-4 flex items-center gap-1">
          <span>+0.1673</span>
          <span className="text-slate-400 font-normal">last 7 day</span>
        </p>
      </div>
    </div>
  );
}
