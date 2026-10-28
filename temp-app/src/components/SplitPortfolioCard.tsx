"use client";

import React, { useState, useEffect } from "react";
import RippleWatermark from "./RippleWatermark";
import BrandLogo from "./BrandLogo";
import { Calendar } from "lucide-react";

interface SplitPortfolioCardProps {
  totalInvest?: number;
  gainPercent?: number;
  dateStr?: string;
}

export default function SplitPortfolioCard({
  totalInvest = 4389.8,
  gainPercent = 14.31,
  dateStr,
}: SplitPortfolioCardProps) {
  const [displayDate, setDisplayDate] = useState<string>(() => {
    if (dateStr) return dateStr;
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  });

  useEffect(() => {
    if (!dateStr) {
      const now = new Date();
      setDisplayDate(
        now.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    } else {
      setDisplayDate(dateStr);
    }
  }, [dateStr]);

  return (
    <div className="h-full flex flex-col bg-[#121214] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-800/80">
      {/* Top Banner: Electric Lime */}
      <div className="relative bg-[#ccff00] text-black px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between font-semibold shrink-0">
        <div className="flex items-center gap-2">
          <BrandLogo size={22} className="rounded-md" />
          <span className="text-sm sm:text-base tracking-tight font-bold">Your Portfolio</span>
        </div>
        <span
          suppressHydrationWarning
          className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs bg-black/10 px-2.5 sm:px-3 py-1 rounded-full font-semibold"
        >
          <Calendar className="w-3 h-3 text-black/70 shrink-0" />
          <span>{displayDate}</span>
        </span>
      </div>

      {/* Bottom Half: Charcoal Dark with Ripple Watermark */}
      <div className="relative flex-1 overflow-hidden bg-[#121214] text-white p-5 sm:p-6 flex flex-col justify-between">
        <RippleWatermark className="absolute right-0 bottom-0 pointer-events-none opacity-25" size={200} />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">Total Invest</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              ${totalInvest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1e1e24] border border-[#ccff00]/30 text-[#ccff00] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
            <span>▲</span>
            <span>{gainPercent > 0 ? `+${gainPercent.toFixed(2)}%` : `${gainPercent.toFixed(2)}%`}</span>
          </div>
        </div>

        {/* Portfolio Status Tray */}
        <div className="relative z-10 mt-4 bg-[#1c1c20]/90 backdrop-blur-md rounded-2xl p-2.5 px-3.5 sm:px-4 flex items-center justify-between border border-slate-700/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
            <span className="text-slate-400 text-xs font-medium">Portfolio Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Active</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/20 px-2 py-0.5 rounded-full">
              Optimal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

