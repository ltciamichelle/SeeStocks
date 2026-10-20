import React from "react";
import RippleWatermark from "./RippleWatermark";

interface SplitPortfolioCardProps {
  totalInvest?: number;
  gainPercent?: number;
  dateStr?: string;
}

export default function SplitPortfolioCard({
  totalInvest = 4389.8,
  gainPercent = 14.31,
  dateStr = "December 21, 2026",
}: SplitPortfolioCardProps) {
  return (
    <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-800/20">
      {/* Top Banner: Electric Lime */}
      <div className="relative bg-[#ccff00] text-black px-6 py-4 flex items-center justify-between font-semibold">
        <span className="text-base tracking-tight font-bold">Your Portfolio</span>
        <span className="text-xs bg-black/10 px-3 py-1 rounded-full font-medium">
          {dateStr}
        </span>
      </div>

      {/* Bottom Half: Charcoal Dark with Ripple Watermark */}
      <div className="relative overflow-hidden bg-[#121214] text-white px-6 py-6">
        <RippleWatermark className="absolute right-0 bottom-0 pointer-events-none opacity-25" size={180} />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Total Invest</p>
            <h2 className="text-3xl font-extrabold text-white mt-1">
              ${totalInvest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1e1e24] border border-[#ccff00]/30 text-[#ccff00] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
            <span>▲</span>
            <span>{gainPercent > 0 ? `+${gainPercent.toFixed(2)}%` : `${gainPercent.toFixed(2)}%`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
