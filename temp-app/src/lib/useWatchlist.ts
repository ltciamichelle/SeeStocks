"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

const LOCAL_STORAGE_KEY = "seestocks_watchlist";
const DEFAULT_SYMBOLS: string[] = [];

export interface WatchlistStatusNotice {
  message: string;
  type: "success" | "warning";
  timestamp: number;
}

export function getLocalWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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

export function clearLocalWatchlist(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
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

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<WatchlistStatusNotice | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMergedRef = useRef<boolean>(false);

  const showNotice = useCallback((message: string, type: "success" | "warning") => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setStatusNotice({ message, type, timestamp: Date.now() });
    noticeTimerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 4000);
  }, []);

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
          signal: AbortSignal.timeout(6000),
        });

        if (mergeRes.ok) {
          const data = await mergeRes.json();
          if (Array.isArray(data.symbols)) {
            setSymbols(data.symbols);
          }
          // Clear the local copy after successfully merging into MongoDB
          clearLocalWatchlist();
          hasMergedRef.current = true;
          showNotice("Saved to your account.", "success");
          return;
        } else {
          showNotice("Saved on this device only (database error)", "warning");
        }
      }

      // Fetch saved list from database with fast timeout
      const res = await fetch("/api/watchlist", {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        const dbSymbols = Array.isArray(data.symbols) ? data.symbols : [];
        setSymbols(dbSymbols);
        // User is logged in: MongoDB is source of truth, clear local copy
        clearLocalWatchlist();
      } else {
        const local = getLocalWatchlist();
        setSymbols(local);
      }
    } catch (err: unknown) {
      console.warn("Watchlist background sync notice:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, showNotice]);

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

      // Optimistically update symbols in React state
      setSymbols((prev) => {
        if (prev.includes(upper)) return prev;
        return [...prev, upper];
      });

      // If not signed in: save to device only
      if (!isSignedIn) {
        setSymbols((prev) => {
          saveLocalWatchlist(prev);
          return prev;
        });
        showNotice("Saved on this device only (not logged in)", "warning");
        return;
      }

      // User is signed in: call POST /api/watchlist
      try {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: upper }),
        });

        if (!res.ok) {
          let reason = "database error";
          try {
            const errData = await res.json();
            if (res.status === 401) {
              reason = "not logged in";
            } else if (errData?.message) {
              reason = errData.message;
            }
          } catch {
            // fallback
          }
          // Save to device fallback
          setSymbols((prev) => {
            saveLocalWatchlist(prev);
            return prev;
          });
          showNotice(`Saved on this device only (${reason})`, "warning");
          return;
        }

        const data = await res.json();
        if (Array.isArray(data.symbols)) {
          setSymbols(data.symbols);
        }
        // Successfully saved to MongoDB -> clear local copy
        clearLocalWatchlist();
        showNotice("Saved to your account.", "success");
      } catch (err: unknown) {
        console.error("Failed to add symbol to server watchlist:", err);
        setSymbols((prev) => {
          saveLocalWatchlist(prev);
          return prev;
        });
        const reason = err instanceof Error ? err.message : "database error";
        showNotice(`Saved on this device only (${reason})`, "warning");
      }
    },
    [isSignedIn, showNotice]
  );

  // Remove symbol from watchlist
  const removeSymbol = useCallback(
    async (sym: string) => {
      const upper = sym.toUpperCase().trim();
      if (!upper) return;

      // Optimistically remove from React state
      setSymbols((prev) => prev.filter((s) => s !== upper));

      // If not signed in: update device only
      if (!isSignedIn) {
        setSymbols((prev) => {
          saveLocalWatchlist(prev);
          return prev;
        });
        showNotice("Saved on this device only (not logged in)", "warning");
        return;
      }

      // User is signed in: call DELETE /api/watchlist
      try {
        const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(upper)}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          let reason = "database error";
          try {
            const errData = await res.json();
            if (res.status === 401) {
              reason = "not logged in";
            } else if (errData?.message) {
              reason = errData.message;
            }
          } catch {
            // fallback
          }
          setSymbols((prev) => {
            saveLocalWatchlist(prev);
            return prev;
          });
          showNotice(`Saved on this device only (${reason})`, "warning");
          return;
        }

        const data = await res.json();
        if (Array.isArray(data.symbols)) {
          setSymbols(data.symbols);
        }
        clearLocalWatchlist();
        showNotice("Saved to your account.", "success");
      } catch (err: unknown) {
        console.error("Failed to delete symbol from server watchlist:", err);
        setSymbols((prev) => {
          saveLocalWatchlist(prev);
          return prev;
        });
        const reason = err instanceof Error ? err.message : "database error";
        showNotice(`Saved on this device only (${reason})`, "warning");
      }
    },
    [isSignedIn, showNotice]
  );

  return {
    symbols,
    isLoading,
    isSignedIn: !!isSignedIn,
    error,
    statusNotice,
    dismissStatusNotice: () => setStatusNotice(null),
    addSymbol,
    removeSymbol,
    refreshWatchlist: loadWatchlist,
  };
}
