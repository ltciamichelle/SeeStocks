"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

const LOCAL_STORAGE_KEY = "seestocks_watchlist";
const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"];

export function getLocalWatchlist(): string[] {
  if (typeof window === "undefined") return DEFAULT_SYMBOLS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_SYMBOLS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SYMBOLS;
  } catch {
    return DEFAULT_SYMBOLS;
  }
}

export function saveLocalWatchlist(symbols: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(symbols));
  } catch {
    // Ignore storage errors
  }
}

export function useWatchlist() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasMergedRef = useRef<boolean>(false);

  // Sync / Load logic
  const loadWatchlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // If logged out or auth not loaded, use localStorage
    if (!isSignedIn) {
      const local = getLocalWatchlist();
      setSymbols(local);
      setIsLoading(false);
      return;
    }

    // User is logged in: Check for local list to merge into MongoDB
    try {
      const localList = getLocalWatchlist();

      if (!hasMergedRef.current && localList.length > 0) {
        // Merge local list into database list
        const mergeRes = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: localList }),
        });

        if (mergeRes.ok) {
          const data = await mergeRes.json();
          setSymbols(data.symbols || localList);
          hasMergedRef.current = true;
          // Clean/update local storage to match synced list
          saveLocalWatchlist(data.symbols || localList);
          setIsLoading(false);
          return;
        }
      }

      // Fetch saved list from database
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        const dbSymbols = Array.isArray(data.symbols) && data.symbols.length > 0 ? data.symbols : DEFAULT_SYMBOLS;
        setSymbols(dbSymbols);
        saveLocalWatchlist(dbSymbols);
      } else {
        // Fallback to local on API failure
        setSymbols(getLocalWatchlist());
      }
    } catch (err: unknown) {
      console.warn("Watchlist fetch error:", err);
      setSymbols(getLocalWatchlist());
      setError(err instanceof Error ? err.message : "Failed to sync watchlist.");
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isLoaded) {
      loadWatchlist();
    }
  }, [isLoaded, isSignedIn, userId, loadWatchlist]);

  // Add symbol to watchlist
  const addSymbol = useCallback(
    async (sym: string) => {
      const upper = sym.toUpperCase().trim();
      if (!upper) return;

      setSymbols((prev) => {
        if (prev.includes(upper)) return prev;
        const next = [...prev, upper];
        saveLocalWatchlist(next);
        return next;
      });

      if (isSignedIn) {
        try {
          const res = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbol: upper }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.symbols) {
              setSymbols(data.symbols);
              saveLocalWatchlist(data.symbols);
            }
          }
        } catch (err) {
          console.error("Failed to add symbol to server watchlist:", err);
        }
      }
    },
    [isSignedIn]
  );

  // Remove symbol from watchlist
  const removeSymbol = useCallback(
    async (sym: string) => {
      const upper = sym.toUpperCase().trim();
      if (!upper) return;

      setSymbols((prev) => {
        const next = prev.filter((s) => s !== upper);
        saveLocalWatchlist(next);
        return next;
      });

      if (isSignedIn) {
        try {
          const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(upper)}`, {
            method: "DELETE",
          });
          if (res.ok) {
            const data = await res.json();
            if (data.symbols) {
              setSymbols(data.symbols);
              saveLocalWatchlist(data.symbols);
            }
          }
        } catch (err) {
          console.error("Failed to delete symbol from server watchlist:", err);
        }
      }
    },
    [isSignedIn]
  );

  return {
    symbols,
    isLoading,
    isSignedIn: !!isSignedIn,
    error,
    addSymbol,
    removeSymbol,
    refreshWatchlist: loadWatchlist,
  };
}
