"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import { useWatchlist } from "@/lib/useWatchlist";
import {
  type StockQuote,
  type SearchResult,
  formatCurrency,
  formatPercent,
  getFallbackQuote,
} from "@/lib/stocks";
import StockLogo from "@/components/StockLogo";
import Sparkline from "@/components/Sparkline";
import RippleWatermark from "@/components/RippleWatermark";
import {
  ArrowLeft,
  Star,
  Search,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  RefreshCw,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Bell,
  Lock,
} from "lucide-react";

export default function WatchlistPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { symbols, isLoading: isWatchlistLoading, removeSymbol, addSymbol } = useWatchlist();

  // Instant SWR state: Pre-seed quotes cache synchronously
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>(() => {
    const initial: Record<string, StockQuote> = {};
    for (const sym of ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA"]) {
      initial[sym] = getFallbackQuote(sym);
    }
    return initial;
  });

  const [loadingQuotes, setLoadingQuotes] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search/Add input state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Batch fetch quotes in the background to update latest numbers without blocking UI
  const loadQuotes = useCallback(async (syms: string[]) => {
    if (syms.length === 0) return;

    setLoadingQuotes(true);

    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(syms.join(","))}`);
      if (res.ok) {
        const data = await res.json();
        if (syms.length === 1 && data.symbol) {
          setQuotes((prev) => ({ ...prev, [data.symbol]: data }));
        } else if (typeof data === "object" && data !== null) {
          setQuotes((prev) => ({ ...prev, ...data }));
        }
      }
    } catch (err) {
      console.warn("Watchlist quote background refresh:", err);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  useEffect(() => {
    if (symbols.length > 0) {
      loadQuotes(symbols);
    }
  }, [symbols, loadQuotes]);

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.results)) {
          setSearchResults(data.results);
          setShowSearchDropdown(true);
        }
      } catch {
        // Silently ignore
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddSymbol = (sym: string) => {
    addSymbol(sym);
    setSearchQuery("");
    setShowSearchDropdown(false);
    showToast(`Added ${sym} to your watchlist`);
  };

  const handleRemove = (sym: string) => {
    removeSymbol(sym);
    showToast(`Removed ${sym} from your watchlist`);
  };

  // Performance calculations
  const stats = useMemo(() => {
    const list = symbols.map((s) => quotes[s] || getFallbackQuote(s)).filter(Boolean);
    if (list.length === 0) {
      return { topGainer: null, avgChange: 0, positiveCount: 0 };
    }

    let top: StockQuote | null = null;
    let sumChange = 0;
    let posCount = 0;

    for (const q of list) {
      sumChange += q.changePercent;
      if (q.changePercent > 0) posCount++;
      if (!top || q.changePercent > top.changePercent) {
        top = q;
      }
    }

    return {
      topGainer: top,
      avgChange: sumChange / list.length,
      positiveCount: posCount,
    };
  }, [symbols, quotes]);

  return (
    <div className="min-h-screen bg-[#f1f3f7] text-slate-900 flex flex-col font-sans selection:bg-[#ccff00] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#121214] text-[#ccff00] border border-white/10 px-4 py-2.5 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-[#ccff00]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOP NAVBAR (MATCHING DASHBOARD HEADER DESIGN)         */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Market Status */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-[#121214] text-[#ccff00] flex items-center justify-center font-black text-sm shadow-md group-hover:scale-105 transition">
                SS
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                  SeeStocks
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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

          {/* Search Bar (Pill with quick autocomplete) */}
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
                      onClick={() => handleAddSymbol(res.symbol)}
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
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1 hover:underline">
                        <Plus className="w-3 h-3" /> Add
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No matching stocks found.</div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Menu: Single Dashboard navigation link, Notification Bell, Clerk Auth */}
          <div className="flex items-center gap-3">
            {/* Single clean Return to Dashboard Button */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-full transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <button className="relative w-9 h-9 rounded-full bg-[#121214] text-white border border-slate-800 shadow-xs flex items-center justify-center hover:border-slate-600 transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ccff00] rounded-full animate-pulse" />
            </button>

            {isLoaded && isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button className="text-xs bg-[#121214] text-white font-bold px-4 py-2 rounded-full hover:bg-black transition shadow-xs">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN WATCHLIST CONTENT                                */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Unauthenticated Guest Mode Banner */}
        {isLoaded && !isSignedIn && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Guest Mode Active
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Sign in to save your personal watchlist to MongoDB Atlas and access it anywhere.
                </div>
              </div>
            </div>

            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-full bg-[#121214] hover:bg-black text-[#ccff00] text-xs font-bold transition shadow-2xs self-start sm:self-auto shrink-0">
                Sign In to Sync
              </button>
            </SignInButton>
          </div>
        )}

        {/* Hero Summary Card: Displays when user has tracked symbols */}
        {symbols.length > 0 ? (
          <div className="relative overflow-hidden rounded-3xl bg-[#121214] border border-slate-800 p-6 sm:p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />
            <RippleWatermark className="absolute right-4 bottom-4 pointer-events-none opacity-15" size={260} strokeColor="#ccff00" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 text-xs font-bold text-[#ccff00] uppercase tracking-wider mb-3">
                  <Star className="w-3.5 h-3.5 fill-[#ccff00]" />
                  Personal Watchlist
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Tracked Assets
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl font-medium">
                  Real-time market snapshots and performance trends for your watched equities.
                </p>
              </div>

              {/* Quick Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[#18181b] border border-white/5 rounded-2xl p-3.5 min-w-[130px]">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-[#ccff00]" /> Symbols
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {symbols.length}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    {stats.positiveCount} Up / {symbols.length - stats.positiveCount} Down
                  </div>
                </div>

                <div className="bg-[#18181b] border border-white/5 rounded-2xl p-3.5 min-w-[130px]">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-[#06b6d4]" /> Avg Change
                  </div>
                  <div
                    className={`text-2xl font-black mt-1 font-mono ${
                      stats.avgChange >= 0 ? "text-[#ccff00]" : "text-rose-400"
                    }`}
                  >
                    {stats.avgChange >= 0 ? `+${stats.avgChange.toFixed(2)}%` : `${stats.avgChange.toFixed(2)}%`}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    Average Return
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-[#18181b] border border-white/5 rounded-2xl p-3.5 min-w-[130px]">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-400" /> Top Performer
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats.topGainer?.symbol || "--"}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold font-mono mt-0.5">
                    {stats.topGainer ? `+${stats.topGainer.changePercent.toFixed(2)}%` : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Watchlist Content State */}
        {symbols.length === 0 ? (
          /* Empty / Unauthenticated Initial Watchlist Screen */
          <div className="p-12 sm:p-16 text-center rounded-3xl border border-slate-200/80 bg-white shadow-xs max-w-3xl mx-auto my-8">
            <div className="w-16 h-16 rounded-3xl bg-[#121214] text-[#ccff00] mx-auto flex items-center justify-center mb-5 shadow-sm">
              <Star className="w-8 h-8 fill-[#ccff00]" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {isSignedIn ? "Your Watchlist is Empty" : "Sign In to Access Your Watchlist"}
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 mb-6 font-medium leading-relaxed">
              {isSignedIn
                ? "You haven't added any stocks to your watchlist yet. Use the search bar above or choose from popular assets below."
                : "You are currently not signed in. Sign in to save and synchronize your favorite stock tickers, alerts, and trend charts with cloud persistence."}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              {!isSignedIn && (
                <SignInButton mode="modal">
                  <button className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#121214] hover:bg-black text-[#ccff00] font-black text-xs uppercase tracking-wider transition shadow-md">
                    Sign In to SeeStocks
                  </button>
                </SignInButton>
              )}

              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Browse Market Dashboard
              </Link>
            </div>

            {/* Quick addition options to test in guest mode */}
            <div className="pt-6 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                {isSignedIn ? "Add Popular Equities" : "Or try adding sample equities in guest mode"}
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {["AAPL", "NVDA", "MSFT", "TSLA", "AMZN"].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleAddSymbol(sym)}
                    className="px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                  >
                    <Plus className="w-3 h-3 text-slate-500" />
                    <span>{sym}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Cards Grid: Rendered when user has added symbols */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {symbols.map((sym) => {
              const q = quotes[sym] || getFallbackQuote(sym);
              const isPositive = (q?.change ?? 0) >= 0;

              return (
                <div
                  key={sym}
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all relative group flex flex-col justify-between"
                >
                  {/* Top Header: Logo, Symbol, Delayed Badge & Remove */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <StockLogo symbol={sym} size={44} />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/?symbol=${sym}`}
                              className="text-xl font-black text-slate-900 hover:text-black transition-colors"
                            >
                              {sym}
                            </Link>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md">
                              Delayed
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 font-medium mt-0.5">
                            {q?.name || sym}
                          </p>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(sym)}
                        title={`Remove ${sym} from watchlist`}
                        className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price, Change Pill, and Sparkline Wave */}
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                          {formatCurrency(q.price)}
                        </div>
                        <div className="mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 border border-rose-200/80"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{q.change >= 0 ? `+${q.change.toFixed(2)}` : q.change.toFixed(2)}</span>
                            <span>({formatPercent(q.changePercent)})</span>
                          </span>
                        </div>
                      </div>

                      {/* Mini Sparkline Chart Wave */}
                      <div className="pb-1">
                        <Sparkline
                          isPositive={isPositive}
                          width={85}
                          height={38}
                        />
                      </div>
                    </div>
                  </div>

                  {/* High/Low Stats & Direct Interactive Chart Link */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <div>
                      <span>
                        H: <span className="font-mono font-semibold text-slate-800">{formatCurrency(q.high)}</span>
                        {" • "}
                        L: <span className="font-mono font-semibold text-slate-800">{formatCurrency(q.low)}</span>
                      </span>
                    </div>

                    <Link
                      href={`/?symbol=${sym}`}
                      className="font-bold text-slate-900 hover:text-black flex items-center gap-1 transition-colors group-hover:translate-x-0.5 duration-200"
                    >
                      <span>Chart</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer (Matching Dashboard) */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2 font-medium">
        <ShieldCheck className="w-4 h-4 text-slate-400" />
        <span>SeeStocks Terminal • Educational analytics, not financial advice</span>
      </footer>
    </div>
  );
}
