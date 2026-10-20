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
  // Initialize synchronously with localStorage so there is ZERO delay / no blank screen
  const [symbols, setSymbols] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      return getLocalWatchlist();
    }
    return DEFAULT_SYMBOLS;
  });
  // Never block the screen with a spinner if local symbols exist
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasMergedRef = useRef<boolean>(false);

  // Sync / Load logic
  const loadWatchlist = useCallback(async () => {
    setError(null);

    // If logged out or auth not loaded, sync with localStorage
    if (!isSignedIn) {
      const local = getLocalWatchlist();
      setSymbols(local);
      setIsLoading(false);
      return;
    }

    // User is logged in: Non-blocking background sync with MongoDB Atlas
    try {
      const localList = getLocalWatchlist();

      if (!hasMergedRef.current && localList.length > 0) {
        // Merge local list into database list
        const mergeRes = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: localList }),
          signal: AbortSignal.timeout(3000),
        });

        if (mergeRes.ok) {
          const data = await mergeRes.json();
          if (Array.isArray(data.symbols) && data.symbols.length > 0) {
            setSymbols(data.symbols);
            saveLocalWatchlist(data.symbols);
          }
          hasMergedRef.current = true;
          return;
        }
      }

      // Fetch saved list from database with fast timeout
      const res = await fetch("/api/watchlist", {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const dbSymbols = Array.isArray(data.symbols) && data.symbols.length > 0 ? data.symbols : DEFAULT_SYMBOLS;
        setSymbols(dbSymbols);
        saveLocalWatchlist(dbSymbols);
      }
    } catch (err: unknown) {
      console.warn("Watchlist background sync notice:", err);
      // Retain local list smoothly
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
