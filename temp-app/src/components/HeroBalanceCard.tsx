"use client";

import React, { useState } from "react";
import RippleWatermark from "./RippleWatermark";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check } from "lucide-react";

interface HeroBalanceCardProps {
  balance?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
}

export default function HeroBalanceCard({
  balance = 209891.21,
  onDeposit,
  onWithdraw,
  onTransfer,
}: HeroBalanceCardProps) {
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  const handleAction = (type: string, callback?: () => void) => {
    if (callback) {
      callback();
    } else {
      setModalNotice(`${type.toUpperCase()} action triggered successfully.`);
      setTimeout(() => setModalNotice(null), 3000);
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#121214] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800/80">
      {/* Ripple Watermark Pattern */}
      <RippleWatermark className="absolute right-0 bottom-0 pointer-events-none opacity-20" size={240} />

      {/* Balance Section */}
      <div className="relative z-10 text-center pt-2 pb-5">
        <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide">Your Balance</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 text-white">
          ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
      </div>

      {/* Action Tray */}
      <div className="relative z-10 bg-[#1c1c20]/90 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-around border border-slate-700/40">
        {/* Deposit */}
        <button
          onClick={() => handleAction("deposit", onDeposit)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-slate-300 hover:text-white transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-slate-700 transition">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Deposit</span>
        </button>

        {/* Withdraw */}
        <button
          onClick={() => handleAction("withdraw", onWithdraw)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-slate-300 hover:text-white transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-slate-700 transition">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium">Withdraw</span>
        </button>

        {/* Transfer (Neon Lime Highlight) */}
        <button
          onClick={() => handleAction("transfer", onTransfer)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-slate-100 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#ccff00] text-black flex items-center justify-center shadow-lg shadow-[#ccff00]/20 hover:scale-105 active:scale-95 transition">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-[#ccff00]">Transfer</span>
        </button>
      </div>

      {modalNotice && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-[#ccff00] text-black text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95">
          <Check className="w-3.5 h-3.5" /> {modalNotice}
        </div>
      )}
    </div>
  );
}
