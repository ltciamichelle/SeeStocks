import React from "react";

export default function MarketIndicators() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
      {/* Market Direction */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
        <div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 tracking-tight">Market Direction</span>
          <h3 className="text-base sm:text-xl font-bold text-slate-900 mt-0.5 sm:mt-1">Bearish</h3>
        </div>
        <p className="text-[11px] sm:text-xs font-semibold text-[#f43f5e] mt-3 sm:mt-4 flex items-center gap-1">
          <span>-1.321%</span>
          <span className="text-slate-400 font-normal">last 7 day</span>
        </p>
      </div>

      {/* Market Momentum */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
        <div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 tracking-tight">Market Momentum</span>
          <h3 className="text-base sm:text-xl font-bold text-slate-900 mt-0.5 sm:mt-1">Bullish</h3>
        </div>
        <p className="text-[11px] sm:text-xs font-semibold text-[#10b981] mt-3 sm:mt-4 flex items-center gap-1">
          <span>+0.1673</span>
          <span className="text-slate-400 font-normal">last 7 day</span>
        </p>
      </div>
    </div>
  );
}
