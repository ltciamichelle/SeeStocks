"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useWatchlist } from "@/lib/useWatchlist";
import type { StockQuote, StockHistory, SearchResult, HistoryPoint } from "@/lib/stocks";
import { formatCurrency, formatPercent } from "@/lib/stocks";

const isClerkPlaceholder =
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_placeholder");

const SAMPLE_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"];
const TIMEFRAMES = ["1W", "1M", "3M", "1Y"];

export default function StockDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { symbols: watchlistSymbols, addSymbol, removeSymbol } = useWatchlist();

  const [selectedSymbol, setSelectedSymbol] = useState<string>("AAPL");
  const [selectedRange, setSelectedRange] = useState<string>("1M");

  // Read ?symbol= query parameter on mount if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const symParam = urlParams.get("symbol");
      if (symParam) {
        setSelectedSymbol(symParam.toUpperCase());
      }
    }
  }, []);

  // State
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(true);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Active chart hover point
  const [hoveredPoint, setHoveredPoint] = useState<HistoryPoint | null>(null);

  const isInWatchlist = watchlistSymbols.includes(selectedSymbol);

  // Fetch Quote
  const loadQuote = useCallback(async (symbol: string) => {
    setLoadingQuote(true);
    setQuoteError(null);
    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `Unable to fetch quote for ${symbol}`);
      }
      setQuote(data);
    } catch (err: unknown) {
      setQuoteError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  // Fetch History
  const loadHistory = useCallback(async (symbol: string, range: string) => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch(
        `/api/history?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `Unable to load historical data for ${symbol}`);
      }
      setHistory(data);
      if (data.points && data.points.length > 0) {
        setHoveredPoint(data.points[data.points.length - 1]);
      }
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : "Failed to load historical data.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Reload current stock
  const handleReload = () => {
    loadQuote(selectedSymbol);
    loadHistory(selectedSymbol, selectedRange);
  };

  useEffect(() => {
    loadQuote(selectedSymbol);
    loadHistory(selectedSymbol, selectedRange);
  }, [selectedSymbol, selectedRange, loadQuote, loadHistory]);

  // Handle Search Input Debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.results)) {
          setSearchResults(data.results);
          setShowDropdown(true);
        }
      } catch {
        // Silently fail on search error
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select stock from search or pills
  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleToggleWatchlist = () => {
    if (isInWatchlist) {
      removeSymbol(selectedSymbol);
    } else {
      addSymbol(selectedSymbol);
    }
  };

  // SVG Chart Calculations
  const chartData = useMemo(() => {
    if (!history?.points || history.points.length < 2) return null;

    const points = history.points;
    const closes = points.map((p) => p.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;

    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 30 };

    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;

    const coordinates = points.map((p, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * usableWidth;
      const y = padding.top + usableHeight - ((p.close - minPrice) / priceRange) * usableHeight;
      return { x, y, point: p };
    });

    const pathD = coordinates.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, "");

    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const areaD = `${pathD} L ${last.x} ${height - padding.bottom} L ${first.x} ${height - padding.bottom} Z`;

    const isPositive = last.point.close >= first.point.close;

    return {
      coordinates,
      pathD,
      areaD,
      minPrice,
      maxPrice,
      isPositive,
      width,
      height,
      padding,
    };
  }, [history]);

  const isPositiveChange = (quote?.change ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  SeeStocks
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono block -mt-1 tracking-widest uppercase">
                  Market Analytics
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              >
                Dashboard
              </Link>
              <Link
                href="/watchlist"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
              >
                Watchlist
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                  {watchlistSymbols.length}
                </span>
              </Link>
            </nav>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="relative flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search symbol (e.g. AAPL, NVDA, TSLA)..."
                className="w-full bg-slate-900/90 text-sm rounded-xl pl-10 pr-10 py-2.5 border border-slate-700/80 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              {isSearching && (
                <div className="absolute right-3.5 top-3 w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto">
                <div className="p-2 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800">
                  Search Results
                </div>
                {searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleSelectSymbol(item.symbol)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 flex items-center justify-between border-b border-slate-800/50 last:border-b-0 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-cyan-400">{item.symbol}</span>
                      <span className="text-slate-300 text-xs ml-2 line-clamp-1">{item.description}</span>
                    </div>
                    {item.type && (
                      <span className="text-[10px] text-slate-500 uppercase bg-slate-800 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info & Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/watchlist"
              className="md:hidden p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300"
              title="Go to Watchlist"
            >
              ⭐
            </Link>

            <button
              onClick={handleReload}
              disabled={loadingQuote || loadingHistory}
              title="Refresh stock quote"
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700/70 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${loadingQuote || loadingHistory ? "animate-spin text-cyan-400" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Clerk Authentication */}
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <UserButton />
                ) : (
                  <div className="flex items-center gap-2">
                    <SignInButton mode="modal">
                      <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="hidden sm:block px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 transition-all">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Watchlist Quick Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mr-1">
            Featured:
          </span>
          {SAMPLE_SYMBOLS.map((sym) => {
            const isActive = selectedSymbol === sym;
            return (
              <button
                key={sym}
                onClick={() => handleSelectSymbol(sym)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {sym}
              </button>
            );
          })}
        </div>

        {/* Notice & Status Banners */}
        {isClerkPlaceholder && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-200">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold text-sm">Login is not set up yet</span>
          </div>
        )}

        {(quote?.fallback || (quote as unknown as { isFallback?: boolean })?.isFallback) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-200/90 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-amber-300 text-sm">
                  Showing sample data.
                </span>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Displaying verified sample stock data from lib/fallback-stocks.json.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-amber-500/20 px-2.5 py-1 rounded-md text-amber-300 shrink-0">
              SAMPLE DATASET
            </span>
          </div>
        )}

        {/* Global Error Banner with Retry */}
        {(quoteError || historyError) && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-200 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-rose-300 text-sm">Failed to Load Market Data</h4>
                <p className="text-xs text-rose-200/80 mt-1">{quoteError || historyError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleReload}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </button>
              <button
                onClick={() => handleSelectSymbol("AAPL")}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
              >
                Back to AAPL
              </button>
            </div>
          </div>
        )}

        {/* Hero Stock Overview Card */}
        {quote && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Top Bar: Name, Ticker, Badges, Add to Watchlist */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {quote.symbol}
                  </h1>
                  <span className="text-slate-400 font-medium text-lg">
                    {quote.name}
                  </span>
                  {quote.exchange && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                      {quote.exchange}
                    </span>
                  )}
                </div>
                {quote.industry && (
                  <p className="text-xs text-slate-500 mt-1">{quote.industry}</p>
                )}
              </div>

              {/* Status Badges & Watchlist Action */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Watchlist Button */}
                <button
                  onClick={handleToggleWatchlist}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isInWatchlist
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                      : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill={isInWatchlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
                </button>

                {/* Delayed Label */}
                {quote.isDelayed && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30"
                    title="Market quotes are delayed by ~15 minutes per provider policy."
                  >
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Delayed data
                  </span>
                )}

                {quote.cached && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    title="Cached for 5 minutes to prevent hitting rate limits."
                  >
                    ⚡ Cached (5m)
                  </span>
                )}
              </div>
            </div>

            {/* Price & Change Row */}
            <div className="mt-6 flex flex-wrap items-baseline gap-4">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                {formatCurrency(quote.price)}
              </span>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm sm:text-base font-mono ${
                  isPositiveChange
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                <svg
                  className={`w-4 h-4 ${isPositiveChange ? "" : "rotate-180"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>{quote.change > 0 ? `+${quote.change.toFixed(2)}` : quote.change.toFixed(2)}</span>
                <span>({formatPercent(quote.changePercent)})</span>
              </div>
            </div>

            {/* Key Statistics Grid */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Open</span>
                <span className="text-sm font-semibold text-slate-200 font-mono mt-0.5 block">
                  {formatCurrency(quote.open)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Prev Close</span>
                <span className="text-sm font-semibold text-slate-200 font-mono mt-0.5 block">
                  {formatCurrency(quote.previousClose)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Day High</span>
                <span className="text-sm font-semibold text-slate-200 font-mono mt-0.5 block">
                  {formatCurrency(quote.high)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Day Low</span>
                <span className="text-sm font-semibold text-slate-200 font-mono mt-0.5 block">
                  {formatCurrency(quote.low)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Market Cap</span>
                <span className="text-sm font-semibold text-slate-200 font-mono mt-0.5 block">
                  {quote.marketCap || "N/A"}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">52W Range</span>
                <span className="text-xs font-semibold text-slate-200 font-mono mt-1 block">
                  {quote.week52Low ? `${formatCurrency(quote.week52Low)} - ${formatCurrency(quote.week52High || 0)}` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Historical Interactive Chart Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Price Movement & Trend
                {history?.isDelayed && (
                  <span className="text-[10px] font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Delayed
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {hoveredPoint ? (
                  <span className="font-mono text-cyan-300">
                    {hoveredPoint.date} — Close: {formatCurrency(hoveredPoint.close)} (Vol:{" "}
                    {(hoveredPoint.volume / 1000000).toFixed(2)}M)
                  </span>
                ) : (
                  "Hover over data points to inspect historical prices"
                )}
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="inline-flex rounded-xl p-1 bg-slate-800/80 border border-slate-700/60 self-start sm:self-auto">
              {TIMEFRAMES.map((range) => {
                const isActive = selectedRange === range;
                return (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SVG Chart Graphic */}
          <div className="relative w-full h-[320px] bg-slate-950/60 rounded-2xl p-4 border border-slate-800/60 flex items-center justify-center">
            {loadingHistory ? (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading chart data...</span>
              </div>
            ) : chartData ? (
              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradientPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="chartGradientNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line
                  x1={chartData.padding.left}
                  y1={chartData.padding.top}
                  x2={chartData.width - chartData.padding.right}
                  y2={chartData.padding.top}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <line
                  x1={chartData.padding.left}
                  y1={chartData.height / 2}
                  x2={chartData.width - chartData.padding.right}
                  y2={chartData.height / 2}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <line
                  x1={chartData.padding.left}
                  y1={chartData.height - chartData.padding.bottom}
                  x2={chartData.width - chartData.padding.right}
                  y2={chartData.height - chartData.padding.bottom}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />

                {/* Min/Max Labels */}
                <text
                  x={chartData.padding.left}
                  y={chartData.padding.top - 6}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  High: {formatCurrency(chartData.maxPrice)}
                </text>
                <text
                  x={chartData.padding.left}
                  y={chartData.height - chartData.padding.bottom + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  Low: {formatCurrency(chartData.minPrice)}
                </text>

                {/* Area under curve */}
                <path
                  d={chartData.areaD}
                  fill={chartData.isPositive ? "url(#chartGradientPositive)" : "url(#chartGradientNegative)"}
                />

                {/* Price Line */}
                <path
                  d={chartData.pathD}
                  fill="none"
                  stroke={chartData.isPositive ? "#10b981" : "#f43f5e"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {chartData.coordinates.map((c, i) => (
                  <g key={i} className="cursor-pointer">
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="4"
                      className="fill-slate-900 stroke-cyan-400 stroke-2 hover:r-6 hover:fill-cyan-400 transition-all"
                      onMouseEnter={() => setHoveredPoint(c.point)}
                    />
                  </g>
                ))}
              </svg>
            ) : (
              <div className="text-center text-slate-500 text-sm">
                No historical chart data available.
              </div>
            )}
          </div>
        </div>

        {/* API Architecture & Features Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-200 text-sm">Clerk User Authentication</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with Clerk to protect your personal watchlist. User IDs are verified securely on server sessions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-200 text-sm">MongoDB Atlas Persistence</h3>
            <p className="text-xs text-slate-400 mt-1">
              Mongoose reuses connection pools to store watchlists and weekly summaries reliably in the cloud.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-200 text-sm">LocalStorage & Cloud Merge</h3>
            <p className="text-xs text-slate-400 mt-1">
              Logged out users track stocks locally. Logging in instantly merges the local list into MongoDB.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <p>For learning only, not financial advice.</p>
      </footer>
    </div>
  );
}
