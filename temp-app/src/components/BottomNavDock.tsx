"use client";

import React from "react";
import { LayoutGrid, TrendingUp, Wallet, Settings } from "lucide-react";

export type TabType = "summary" | "markets" | "portfolio" | "settings";

interface BottomNavDockProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function BottomNavDock({ activeTab, onChangeTab }: BottomNavDockProps) {
  const tabs = [
    { id: "summary" as TabType, label: "Summary", icon: LayoutGrid },
    { id: "markets" as TabType, label: "Markets", icon: TrendingUp },
    { id: "portfolio" as TabType, label: "Portfolio", icon: Wallet },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm">
      <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-full px-4 py-2.5 shadow-2xl flex items-center justify-between">
        {/* Left two tabs */}
        <button
          onClick={() => onChangeTab("summary")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "summary" ? "text-black scale-105 font-bold" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Summary</span>
        </button>

        <button
          onClick={() => onChangeTab("markets")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "markets" ? "text-black scale-105 font-bold" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Markets</span>
        </button>

        {/* Center elevated custom badge (as shown in reference mockup) */}
        <div className="relative -top-2 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#121214] text-[#ccff00] border-4 border-white shadow-lg flex items-center justify-center font-black text-xs tracking-tighter">
            <span>SS</span>
          </div>
        </div>

        {/* Right two tabs */}
        <button
          onClick={() => onChangeTab("portfolio")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "portfolio" ? "text-black scale-105 font-bold" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Portfolio</span>
        </button>

        <button
          onClick={() => onChangeTab("settings")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "settings" ? "text-black scale-105 font-bold" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Settings</span>
        </button>
      </div>
    </div>
  );
}
