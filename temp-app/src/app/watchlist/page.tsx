"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { useWatchlist } from "@/lib/useWatchlist";
import type { StockQuote, SearchResult } from "@/lib/stocks";
import { formatCurrency, formatPercent } from "@/lib/stocks";

const isClerkPlaceholder =
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_placeholder");

export default function WatchlistPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { symbols, isLoading: isWatchlistLoading, removeSymbol, addSymbol } = useWatchlist();

  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [loadingQuotes, setLoadingQuotes] = useState<boolean>(true);

  // Search/Add input state
  const [addInput, setAddInput] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Batch fetch quotes for all watchlist symbols in one single HTTP request
  const loadQuotes = useCallback(async (syms: string[]) => {
    if (syms.length === 0) {
      setQuotes({});
      setLoadingQuotes(false);
      return;
    }

    setLoadingQuotes(true);

    try {
      // 1 single batch call with comma-separated symbols to respect 8 calls/min limit
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(syms.join(","))}`);
      if (res.ok) {
        const data = await res.json();
        if (syms.length === 1 && data.symbol) {
          setQuotes({ [data.symbol]: data });
        } else if (typeof data === "object" && data !== null) {
          setQuotes(data);
        }
      }
    } catch (err) {
      console.warn("Failed to batch fetch watchlist quotes:", err);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes(symbols);
  }, [symbols, loadQuotes]);

  // Handle Search Input Debounced
  useEffect(() => {
    if (!addInput.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(addInput)}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data.results)) {
          setSearchResults(data.results);
          setShowDropdown(true);
        }
      } catch {
        // Silently ignore
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [addInput]);

  const handleAddSymbol = (sym: string) => {
    addSymbol(sym);
    setAddInput("");
    setShowDropdown(false);
  };

  const hasAnyFallback = Object.values(quotes).some((q) => q?.fallback);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  SeeStocks
                </span>
                <span className="text-[10px] text-cyan-400/80 font-mono block -mt-1 tracking-widest uppercase">
                  Watchlist
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/watchlist"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              >
                My Watchlist
              </Link>
            </nav>
          </div>

          {/* User Auth Buttons / Profile */}
          <div className="flex items-center gap-3">
            {isLoaded && !isClerkPlaceholder && (
              <>
                {isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      MongoDB Cloud Synced
                    </span>
                    <UserButton />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <SignInButton mode="modal">
                      <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 transition-all">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Placeholder Login Banner */}
        {isClerkPlaceholder && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-200">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold text-sm">Login is not set up yet</span>
          </div>
        )}

        {/* Fallback Sample Data Notice */}
        {hasAnyFallback && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-200/90 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-semibold text-amber-300 text-sm">Showing sample data.</span>
            </div>
          </div>
        )}

        {/* Header & Add Symbol */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Your Personal Watchlist
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {symbols.length} {symbols.length === 1 ? "Stock" : "Stocks"}
                </span>
              </h1>
              {loadingQuotes && (
                <div
                  className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"
                  title="Updating batch quotes..."
                />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Consolidated batch quotes (1 request per update) cached for 5 minutes.
            </p>
          </div>

          {/* Quick Add Symbol Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="relative">
              <input
                type="text"
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Add symbol (e.g. TSLA, NVDA)..."
                className="w-full bg-slate-950/90 text-sm rounded-xl pl-9 pr-9 py-2.5 border border-slate-700/80 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isSearching && (
                <div className="absolute right-3 top-3 w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleAddSymbol(item.symbol)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/50 last:border-b-0 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-cyan-400">{item.symbol}</span>
                      <span className="text-slate-300 text-xs ml-2 line-clamp-1">{item.description}</span>
                    </div>
                    <span className="text-xs text-cyan-400/80 font-bold hover:underline">
                      + Add
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Watchlist Table / Cards */}
        {isWatchlistLoading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading your watchlist...</span>
          </div>
        ) : symbols.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-slate-800/80 bg-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Your watchlist is currently empty</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Add ticker symbols to track quotes and daily trends.
            </p>
            <button
              onClick={() => handleAddSymbol("AAPL")}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all"
            >
              Add Sample Stock (AAPL)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {symbols.map((sym) => {
              const q = quotes[sym];
              const isPositive = (q?.change ?? 0) >= 0;

              return (
                <div
                  key={sym}
                  className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl shadow-xl hover:border-slate-700/80 transition-all relative group flex flex-col justify-between"
                >
                  {/* Card Header: Ticker, Name, Remove */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/?symbol=${sym}`}
                            className="text-2xl font-black text-white hover:text-cyan-400 transition-colors"
                          >
                            {sym}
                          </Link>
                          {/* Delayed data label */}
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold">
                            Delayed data
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {q?.name || "Loading..."}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeSymbol(sym)}
                        title={`Remove ${sym} from watchlist`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Price and Percentage */}
                    <div className="mt-4 flex items-baseline justify-between">
                      {q ? (
                        <>
                          <span className="text-2xl font-black text-white font-mono">
                            {formatCurrency(q.price)}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                              isPositive
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            <span>{q.change > 0 ? `+${q.change.toFixed(2)}` : q.change.toFixed(2)}</span>
                            <span>({formatPercent(q.changePercent)})</span>
                          </span>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between animate-pulse">
                          <div className="h-7 bg-slate-800 rounded w-24" />
                          <div className="h-6 bg-slate-800 rounded w-16" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day Stats & Action Link */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div>
                      {q ? (
                        <span>
                          High: <span className="font-mono text-slate-200">{formatCurrency(q.high)}</span> • Low:{" "}
                          <span className="font-mono text-slate-200">{formatCurrency(q.low)}</span>
                        </span>
                      ) : (
                        <span>Loading stats...</span>
                      )}
                    </div>

                    <Link
                      href={`/?symbol=${sym}`}
                      className="font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      View Chart →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>For learning only, not financial advice.</p>
      </footer>
    </div>
  );
}
