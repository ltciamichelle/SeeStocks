"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserButton, SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { useWatchlist } from "@/lib/useWatchlist";
import type { StockQuote, StockHistory, SearchResult } from "@/lib/stocks";

// Custom UI Components matching reference style
import RippleWatermark from "@/components/RippleWatermark";
import StockLogo from "@/components/StockLogo";
import Sparkline from "@/components/Sparkline";
import InteractiveChart from "@/components/InteractiveChart";
import HeroBalanceCard from "@/components/HeroBalanceCard";
import SplitPortfolioCard from "@/components/SplitPortfolioCard";
import MarketIndicators from "@/components/MarketIndicators";
import MarketNewsCard from "@/components/MarketNewsCard";
import BrandLogo from "@/components/BrandLogo";
import SplashScreen from "@/components/SplashScreen";
import BottomNavDock, { type TabType } from "@/components/BottomNavDock";

import {
  Star,
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  AlertCircle,
} from "lucide-react";

const TIMEFRAMES = ["1D", "5D", "1W", "1M", "3M", "1Y"];

// Pre-populated market stocks for activities feed
const DEFAULT_ACTIVITIES = [
  { symbol: "MSFT", name: "Microsoft Co.", price: 234.53, changePercent: 10.21, isPositive: true, spark: [18, 22, 20, 26, 24, 30, 32] },
  { symbol: "NVDA", name: "NVIDIA Co.", price: 140.36, changePercent: -0.60, isPositive: false, spark: [30, 28, 25, 27, 22, 19, 18] },
  { symbol: "AAPL", name: "Apple Inc.", price: 182.53, changePercent: 1.25, isPositive: true, spark: [15, 18, 16, 20, 22, 21, 25] },
  { symbol: "TSLA", name: "Tesla Inc.", price: 218.40, changePercent: 4.82, isPositive: true, spark: [12, 16, 14, 22, 25, 24, 28] },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.15, changePercent: -1.15, isPositive: false, spark: [28, 26, 24, 22, 25, 21, 20] },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 168.90, changePercent: 2.10, isPositive: true, spark: [14, 17, 19, 18, 22, 25, 27] },
];

export default function StockDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { symbols: watchlistSymbols, addSymbol, removeSymbol, statusNotice } = useWatchlist();

  // Selected Stock & Range
  const [selectedSymbol, setSelectedSymbol] = useState<string>("MSFT");
  const [selectedRange, setSelectedRange] = useState<string>("1M");

  // Stock Data State
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(true);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [showMobileSearch, setShowMobileSearch] = useState<boolean>(false);

  // Mobile Bottom Dock Tab State
  const [activeTab, setActiveTab] = useState<TabType>("summary");

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "summary") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tab === "markets") {
      const el = document.getElementById("terminal-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "portfolio") {
      const el = document.getElementById("portfolio-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "settings") {
      window.location.href = "/watchlist";
    }
  };

  // Activity filter state
  const [activityFilter, setActivityFilter] = useState<string>("This month");
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  // Trade Modal State
  const [tradeModal, setTradeModal] = useState<{ open: boolean; type: "buy" | "sell" }>({ open: false, type: "buy" });
  const [tradeShares, setTradeShares] = useState<number>(1);
  const [tradeNotice, setTradeNotice] = useState<string | null>(null);

  // Balance & Portfolio State (Simulated reactive balance)
  const [userBalance, setUserBalance] = useState<number>(209891.21);
  const [portfolioTotal, setPortfolioTotal] = useState<number>(4389.80);

  const isInWatchlist = watchlistSymbols.includes(selectedSymbol);

  // Read URL params if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const symParam = urlParams.get("symbol");
      if (symParam) {
        setSelectedSymbol(symParam.toUpperCase());
      }
      const tabParam = urlParams.get("tab") as TabType | null;
      if (tabParam) {
        handleTabChange(tabParam);
      }
    }
  }, []);

  // Fetch Quote
  const loadQuote = useCallback(async (symbol: string) => {
    setLoadingQuote(true);
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
      const data = await res.json();
      if (res.ok) {
        setQuote(data);
      }
    } catch {
      // fallback handled gracefully
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  // Fetch History
  const loadHistory = useCallback(async (symbol: string, range: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `/api/history?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`
      );
      const data = await res.json();
      if (res.ok) {
        setHistory(data);
      }
    } catch {
      // fallback handled gracefully
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Load quote & history when selection changes
  useEffect(() => {
    loadQuote(selectedSymbol);
    loadHistory(selectedSymbol, selectedRange);
  }, [selectedSymbol, selectedRange, loadQuote, loadHistory]);

  // Live search handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data && data.results) {
          setSearchResults(data.results.slice(0, 6));
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle stock click
  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setShowSearchDropdown(false);
    setSearchQuery("");
  };

  // Handle trade execution
  const executeTrade = () => {
    const price = quote?.price || 234.53;
    const totalCost = price * tradeShares;

    if (tradeModal.type === "buy") {
      setUserBalance((prev) => Math.max(0, prev - totalCost));
      setPortfolioTotal((prev) => prev + totalCost);
      setTradeNotice(`Successfully purchased ${tradeShares} shares of ${selectedSymbol}!`);
    } else {
      setUserBalance((prev) => prev + totalCost);
      setPortfolioTotal((prev) => Math.max(0, prev - totalCost));
      setTradeNotice(`Successfully sold ${tradeShares} shares of ${selectedSymbol}!`);
    }

    setTradeModal({ open: false, type: "buy" });
    setTimeout(() => setTradeNotice(null), 4000);
  };

  const userName = user?.firstName || "Jonathan";
  const currentPrice = quote?.price || 234.53;
  const currentChange = quote?.changePercent || 10.21;
  const isPositive = currentChange >= 0;
  const companyName = quote?.name || (selectedSymbol === "MSFT" ? "Microsoft Corporation" : selectedSymbol);
  const marketCapStr = quote?.marketCap ? `$${quote.marketCap}` : "$1780.09B";

  return (
    <div className="min-h-screen bg-[#f1f3f7] text-slate-900 flex flex-col font-sans">
      {/* Minimalist High-Contrast Splash Screen */}
      <SplashScreen />

      {/* ======================================================== */}
      {/* 1. TOP GLOBAL NAVIGATION BAR                              */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand & Market Status */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
              <BrandLogo size={38} className="shadow-md group-hover:scale-105 transition-transform" />
              <div>
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 block leading-none">
                  SeeStocks
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden xs:block">
                  Analytics & Trading
                </span>
              </div>
            </Link>

            {/* Live Market Status Pill */}
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Markets Open</span>
            </div>
          </div>

          {/* Desktop Search Bar (Pill with quick autocomplete) */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <div className="flex items-center bg-[#f4f5f8] rounded-full px-4 py-2 border border-slate-200 focus-within:border-black focus-within:bg-white transition">
              <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder='Search stocks e.g. "amazon", "NVDA"...'
                className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded-md">
                /
              </span>
            </div>

            {/* Autocomplete Dropdown */}
            {showSearchDropdown && (searchQuery.trim().length > 0 || searchResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden p-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                  Market Search Results
                </div>
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-500">Searching market symbols...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((res) => (
                    <button
                      key={res.symbol}
                      onClick={() => handleSelectStock(res.symbol)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-slate-100 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <StockLogo symbol={res.symbol} size={30} />
                        <div>
                          <div className="font-bold text-xs text-slate-900">{res.symbol}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {res.description}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {res.type || "STOCK"}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No matching stocks found.</div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Menu: Mobile Search Button, Watchlist link, Clerk User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="sm:hidden w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
              aria-label="Toggle stock search"
            >
              <Search className="w-4 h-4" />
            </button>

            <Link
              href="/watchlist"
              className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-white bg-[#121214] hover:bg-black border border-slate-800 hover:border-[#ccff00]/60 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all shadow-md group"
            >
              <Star className="w-3.5 h-3.5 text-[#ccff00] fill-[#ccff00] group-hover:scale-110 transition-transform" />
              <span className="hidden xs:inline">Watchlist</span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-[#ccff00] text-black text-[10px] font-black">
                {watchlistSymbols.length}
              </span>
            </Link>

            {isLoaded && isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="text-xs bg-[#121214] text-white font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-black transition shadow-xs">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Drawer */}
        {showMobileSearch && (
          <div className="sm:hidden mt-2.5 pt-2.5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="relative">
              <div className="flex items-center bg-[#f4f5f8] rounded-full px-3.5 py-2 border border-slate-200 focus-within:border-black focus-within:bg-white transition">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder='Search stocks e.g. "amazon", "NVDA"...'
                  className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-slate-400 text-xs px-1">
                    ✕
                  </button>
                )}
              </div>

              {/* Mobile Autocomplete Dropdown */}
              {showSearchDropdown && (searchQuery.trim().length > 0 || searchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden p-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Market Search Results
                  </div>
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-500">Searching market symbols...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((res) => (
                      <button
                        key={res.symbol}
                        onClick={() => {
                          handleSelectStock(res.symbol);
                          setShowMobileSearch(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-slate-100 transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          <StockLogo symbol={res.symbol} size={30} />
                          <div>
                            <div className="font-bold text-xs text-slate-900">{res.symbol}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {res.description}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {res.type || "STOCK"}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">No matching stocks found.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Trade Notification Toast */}
      {tradeNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#121214] text-[#ccff00] font-bold text-xs px-5 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in zoom-in-95">
          <Check className="w-4 h-4 text-[#ccff00]" />
          <span>{tradeNotice}</span>
        </div>
      )}

      {/* Watchlist Status Notification Toast */}
      {statusNotice && (
        <div
          role="status"
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 font-bold text-xs px-5 py-2.5 rounded-full shadow-2xl border flex items-center gap-2 animate-in fade-in zoom-in-95 transition-all ${
            statusNotice.type === "success"
              ? "bg-[#121214] text-[#ccff00] border-slate-700"
              : "bg-amber-950 text-amber-200 border-amber-600/60"
          }`}
        >
          {statusNotice.type === "success" ? (
            <Check className="w-4 h-4 text-[#ccff00]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN WEBSITE CONTENT CONTAINER (RESPONSIVE GRID)      */}
      {/* ======================================================== */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 flex-1">
        {/* Welcome Banner Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Hello, {userName}!
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Welcome back to your real-time portfolio and market terminal.
            </p>
          </div>

          {/* Quick symbol picker chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Trending:</span>
            {["MSFT", "NVDA", "AAPL", "TSLA", "AMZN"].map((sym) => (
              <button
                key={sym}
                onClick={() => handleSelectStock(sym)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 ${
                  selectedSymbol === sym
                    ? "bg-[#121214] text-[#ccff00] shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Web Layout Grid: 2 Columns (Main Analytics 65% + Side Feed 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT / CENTER COLUMN (Col span 8 on desktop)             */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top Cards Row: Balance Card + Split Portfolio Card */}
            <div id="portfolio-section" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 scroll-mt-20">
              {/* Screen 1 Component: Hero Balance Card */}
              <HeroBalanceCard balance={userBalance} />

              {/* Screen 2 Component: Split Portfolio Card */}
              <SplitPortfolioCard
                totalInvest={portfolioTotal}
                gainPercent={14.31}
              />
            </div>

            {/* Market Indicators Row (Direction & Momentum) */}
            <MarketIndicators />

            {/* Screen 3 Component: Full Interactive Stock Terminal Card */}
            <div id="terminal-section" className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm border border-slate-100 space-y-4 sm:space-y-5 scroll-mt-20">
              {/* Terminal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 sm:gap-3.5">
                  <StockLogo symbol={selectedSymbol} size={42} className="sm:w-12 sm:h-12" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {selectedSymbol}
                      </h2>
                      <span className="text-[10px] sm:text-xs bg-slate-100 font-bold px-2 py-0.5 rounded-md text-slate-600">
                        NASDAQ
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium truncate max-w-[180px] sm:max-w-none">{companyName}</p>
                  </div>
                </div>

                {/* Right: Price & Watchlist Star */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="text-left sm:text-right">
                    {loadingQuote ? (
                      <div className="w-24 h-7 bg-slate-100 animate-pulse rounded-lg sm:ml-auto mb-1" />
                    ) : (
                      <div className="text-xl sm:text-2xl font-black text-slate-900">
                        ${currentPrice.toFixed(2)}
                      </div>
                    )}
                    <div
                      className={`text-xs font-bold flex items-center sm:justify-end gap-1 ${
                        isPositive ? "text-[#10b981]" : "text-[#f43f5e]"
                      }`}
                    >
                      <span>{isPositive ? "▲" : "▼"}</span>
                      <span>
                        {isPositive ? `+${currentChange.toFixed(2)}%` : `${currentChange.toFixed(2)}%`}
                      </span>
                      <span className="text-slate-400 font-normal">today</span>
                    </div>
                  </div>

                  {/* Watchlist Toggle */}
                  <button
                    onClick={() => (isInWatchlist ? removeSymbol(selectedSymbol) : addSymbol(selectedSymbol))}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center transition shadow-2xs ${
                      isInWatchlist
                        ? "bg-[#ccff00] border-[#ccff00] text-black"
                        : "bg-white border-slate-200 text-slate-400 hover:text-slate-900"
                    }`}
                    title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWatchlist ? "fill-black" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Market Capitalization & Period Controls Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                {/* Dark Market Cap Banner (matching Screen 3 reference) */}
                <div className="relative overflow-hidden bg-[#121214] text-white rounded-2xl px-4 sm:px-5 py-3 shadow-md border border-slate-800 flex items-center justify-between gap-4 sm:gap-6 w-full sm:w-auto shrink-0">
                  <RippleWatermark className="absolute right-0 bottom-0 pointer-events-none opacity-20" size={140} />
                  <div className="relative z-10">
                    <div className="text-base sm:text-lg font-black text-white">{marketCapStr}</div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Market capitalization</div>
                  </div>
                  <div className="relative z-10 bg-[#1c1c20] text-[#ccff00] text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border border-[#ccff00]/30 shrink-0">
                    ▲ +10.21%
                  </div>
                </div>

                {/* Timeframe selector pills */}
                <div className="flex items-center justify-between sm:justify-start bg-[#f4f5f8] rounded-full p-1 border border-slate-200 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedRange(tf)}
                      className={`flex-1 sm:flex-none text-center px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-full transition shrink-0 ${
                        selectedRange === tf
                          ? "bg-[#121214] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Curved Chart */}
              <div className={loadingHistory ? "opacity-75 transition-opacity duration-200" : "transition-opacity duration-200"}>
                <InteractiveChart
                  points={history?.points || []}
                  symbol={selectedSymbol}
                  isDelayed={history?.isDelayed}
                />
              </div>

              {/* Trade Action Tray (Sell & Buy) */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => setTradeModal({ open: true, type: "sell" })}
                  className="flex-1 bg-[#121214] text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 hover:bg-black active:scale-98 transition"
                >
                  <span>Sell {selectedSymbol}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </button>

                <button
                  onClick={() => setTradeModal({ open: true, type: "buy" })}
                  className="flex-1 bg-[#ccff00] text-black py-3.5 rounded-2xl font-extrabold text-sm shadow-md shadow-[#ccff00]/25 flex items-center justify-center gap-2 hover:bg-[#b8e600] active:scale-98 transition"
                >
                  <span>Buy {selectedSymbol}</span>
                  <ArrowDownLeft className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDEBAR COLUMN (Col span 4 on desktop)             */}
          {/* ======================================================== */}
          <div id="activities-section" className="lg:col-span-4 space-y-6 scroll-mt-20">
            {/* Section 1: Stock Activities Feed */}
            <div className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Stock Activities</h3>

                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-full border border-slate-200/80"
                  >
                    <span>{activityFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-30 min-w-[120px]">
                      {["Today", "This week", "This month"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => {
                            setActivityFilter(opt);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-xl font-medium ${
                            activityFilter === opt ? "bg-[#ccff00] text-black font-bold" : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Items List */}
              <div className="space-y-2.5 sm:space-y-3">
                {DEFAULT_ACTIVITIES.map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => handleSelectStock(stock.symbol)}
                    className={`p-3 sm:p-3.5 rounded-2xl transition cursor-pointer flex items-center justify-between gap-2 border ${
                      selectedSymbol === stock.symbol
                        ? "bg-slate-50 border-black/10 shadow-2xs"
                        : "hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <StockLogo symbol={stock.symbol} size={36} />
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900">{stock.symbol}</div>
                        <div className="text-[11px] text-slate-400 font-medium truncate max-w-[85px] xs:max-w-[110px] sm:max-w-[130px]">
                          {stock.name}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 hidden xs:block">
                      <Sparkline data={stock.spark} isPositive={stock.isPositive} width={48} height={22} />
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-xs text-slate-900">
                        ${stock.price.toFixed(2)}
                      </div>
                      <div
                        className={`text-[10px] font-bold mt-0.5 ${
                          stock.isPositive ? "text-[#10b981]" : "text-[#f43f5e]"
                        }`}
                      >
                        {stock.isPositive ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Recent Market News */}
            <div className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Market News</h3>
                <span className="text-xs font-semibold text-slate-400">Financial Wire</span>
              </div>

              <MarketNewsCard />
            </div>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 3. TRADE CONFIRMATION MODAL                               */}
      {/* ======================================================== */}
      {tradeModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {tradeModal.type === "buy" ? "Buy Shares" : "Sell Shares"} — {selectedSymbol}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Market Price: <span className="font-bold text-slate-900">${currentPrice.toFixed(2)}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Number of Shares</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTradeShares((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-base"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={tradeShares}
                    onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center font-black text-lg py-2 rounded-xl border border-slate-200 focus:outline-hidden"
                  />
                  <button
                    onClick={() => setTradeShares((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-base"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Total</span>
                  <span className="font-bold text-slate-900">
                    ${(currentPrice * tradeShares).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Your Available Balance</span>
                  <span className="font-bold text-slate-900">${userBalance.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setTradeModal({ open: false, type: "buy" })}
                  className="flex-1 py-3 rounded-2xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={executeTrade}
                  className={`flex-1 py-3 rounded-2xl font-extrabold text-xs shadow-md transition ${
                    tradeModal.type === "buy"
                      ? "bg-[#ccff00] text-black hover:bg-[#b8e600]"
                      : "bg-[#121214] text-white hover:bg-black"
                  }`}
                >
                  Confirm {tradeModal.type.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Website Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={22} className="rounded-md" />
            <span className="font-semibold text-slate-700">SeeStocks Neo-Fintech Terminal</span>
          </div>
          <div>Delayed market data provided for evaluation and portfolio analytics.</div>
        </div>
      </footer>

      {/* Mobile Floating Bottom Navigation Dock */}
      <BottomNavDock activeTab={activeTab} onChangeTab={handleTabChange} />
    </div>
  );
}
