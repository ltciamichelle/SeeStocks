"use client";

import React from "react";
import { LayoutGrid, TrendingUp, Wallet, Settings } from "lucide-react";

import BrandLogo from "./BrandLogo";

export type TabType = "summary" | "markets" | "portfolio" | "settings";

interface BottomNavDockProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function BottomNavDock({ activeTab, onChangeTab }: BottomNavDockProps) {
  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
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

        {/* Center elevated custom badge with official SeeStock Logo */}
        <button
          onClick={() => onChangeTab("markets")}
          className="relative -top-2 flex flex-col items-center group focus:outline-hidden"
          title="SeeStocks Quick Terminal"
        >
          <div className="w-12 h-12 rounded-full bg-[#121214] border-4 border-white shadow-xl flex items-center justify-center overflow-hidden group-hover:scale-105 active:scale-95 transition-transform">
            <BrandLogo size={40} className="rounded-full" />
          </div>
        </button>

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
