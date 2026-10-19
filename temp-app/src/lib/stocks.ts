import fallbackDataset from "./fallback-stocks.json";

// ==========================================
// Types
// ==========================================

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose?: number;
  exchange?: string;
  industry?: string;
  marketCap?: string;
  week52High?: number;
  week52Low?: number;
  cached?: boolean;
  isDelayed: boolean;
  delayedNotice: string;
  fallback: boolean;
  notice: string | null;
}

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistory {
  symbol: string;
  range: "1W" | "1M" | "1Y";
  points: HistoryPoint[];
  isDelayed: boolean;
  delayedNotice: string;
  fallback: boolean;
  notice: string | null;
}

export interface SearchResult {
  symbol: string;
  description: string;
  type?: string;
  exchange?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  fallback: boolean;
  notice: string | null;
}

interface FallbackStockItem {
  symbol: string;
  name: string;
  exchange: string;
  quote: {
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    volume: number;
  };
  history: HistoryPoint[];
}

const FALLBACK_STOCKS: FallbackStockItem[] = fallbackDataset.stocks as unknown as FallbackStockItem[];
const DELAYED_LABEL = "Delayed data";
const FALLBACK_NOTICE = "Showing sample data.";

// In-memory 5-minute fallback cache to prevent hitting rate limits
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();
const FIVE_MINUTES_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { data, expiresAt: Date.now() + FIVE_MINUTES_MS });
}

// Fallback lookup helpers
function getFallbackQuote(symbol: string): StockQuote {
  const item = FALLBACK_STOCKS.find((s) => s.symbol === symbol) || FALLBACK_STOCKS[0];
  return {
    symbol: item.symbol === symbol ? item.symbol : symbol,
    name: item.symbol === symbol ? item.name : `${symbol} (Sample)`,
    price: item.quote.price,
    change: item.quote.change,
    changePercent: item.quote.changePercent,
    open: item.quote.open,
    high: item.quote.high,
    low: item.quote.low,
    volume: item.quote.volume,
    previousClose: item.quote.previousClose,
    isDelayed: true,
    delayedNotice: DELAYED_LABEL,
    fallback: true,
    notice: FALLBACK_NOTICE,
  };
}

function getFallbackHistory(symbol: string, range: "1W" | "1M" | "1Y"): StockHistory {
  const item = FALLBACK_STOCKS.find((s) => s.symbol === symbol) || FALLBACK_STOCKS[0];
  let points = [...item.history];
  if (range === "1W") points = points.slice(-5);
  else if (range === "1M") points = points.slice(-22);

  return {
    symbol: item.symbol === symbol ? item.symbol : symbol,
    range,
    points,
    isDelayed: true,
    delayedNotice: DELAYED_LABEL,
    fallback: true,
    notice: FALLBACK_NOTICE,
  };
}

function getFallbackSearch(query: string): SearchResponse {
  const q = query.toLowerCase().trim();
  let matched = FALLBACK_STOCKS.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
  if (matched.length === 0) {
    matched = FALLBACK_STOCKS;
  }
  return {
    query,
    results: matched.map((s) => ({
      symbol: s.symbol,
      description: s.name,
      type: "Common Stock",
      exchange: s.exchange,
    })),
    fallback: true,
    notice: FALLBACK_NOTICE,
  };
}

function getApiKey(): string {
  const key = process.env.STOCK_API_KEY?.trim();
  if (!key) {
    throw new Error("STOCK_API_KEY is missing in .env.local");
  }
  return key;
}

// ==========================================
// Twelve Data API Functions
// ==========================================

/**
 * Fetch a single stock quote using Twelve Data /quote
 * Cached for 5 minutes. Converts strings to numbers.
 * Falls back to lib/fallback-stocks.json on rate limit or error.
 */
export async function getQuote(symbol: string): Promise<StockQuote> {
  const cleanSymbol = symbol.toUpperCase().trim();
  if (!cleanSymbol) {
    throw new Error("Missing stock symbol");
  }

  const cacheKey = `quote:${cleanSymbol}`;
  const cached = getCached<StockQuote>(cacheKey);
  if (cached) return cached;

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch {
    const fb = getFallbackQuote(cleanSymbol);
    if (fb) return fb;
    throw new Error("STOCK_API_KEY is missing in .env.local");
  }

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(cleanSymbol)}&apikey=${apiKey}`;
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6500),
    });

    if (res.status === 429) {
      console.warn(`[Twelve Data 429 Rate Limit for ${cleanSymbol}]`);
      return getFallbackQuote(cleanSymbol);
    }

    if (!res.ok) {
      return getFallbackQuote(cleanSymbol);
    }

    const data = await res.json();

    if (data.status === "error" || !data.close) {
      return getFallbackQuote(cleanSymbol);
    }

    const quote: StockQuote = {
      symbol: data.symbol || cleanSymbol,
      name: data.name || cleanSymbol,
      price: parseFloat(data.close) || 0,
      change: parseFloat(data.change) || 0,
      changePercent: parseFloat(data.percent_change) || 0,
      open: parseFloat(data.open) || 0,
      high: parseFloat(data.high) || 0,
      low: parseFloat(data.low) || 0,
      volume: parseInt(data.volume, 10) || 0,
      previousClose: parseFloat(data.previous_close) || 0,
      isDelayed: true,
      delayedNotice: DELAYED_LABEL,
      fallback: false,
      notice: null,
    };

    setCached(cacheKey, quote);
    return quote;
  } catch {
    return getFallbackQuote(cleanSymbol);
  }
}

/**
 * Fetch historical daily price candles using Twelve Data /time_series
 * interval: 1day
 * outputsize: 5 for "1W", 22 for "1M", 252 for "1Y"
 * Cached for 5 minutes. Converts values to numbers.
 */
export async function getHistory(
  symbol: string,
  range: "1W" | "1M" | "1Y" = "1M"
): Promise<StockHistory> {
  const cleanSymbol = symbol.toUpperCase().trim();
  if (!cleanSymbol) {
    throw new Error("Missing stock symbol");
  }

  const cacheKey = `history:${cleanSymbol}:${range}`;
  const cached = getCached<StockHistory>(cacheKey);
  if (cached) return cached;

  let outputsize = 22;
  if (range === "1W") outputsize = 5;
  if (range === "1Y") outputsize = 252;

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch {
    const fb = getFallbackHistory(cleanSymbol, range);
    if (fb) return fb;
    throw new Error("STOCK_API_KEY is missing in .env.local");
  }

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
      cleanSymbol
    )}&interval=1day&outputsize=${outputsize}&apikey=${apiKey}`;

    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(7000),
    });

    if (res.status === 429) {
      console.warn(`[Twelve Data 429 Rate Limit for history ${cleanSymbol}]`);
      return getFallbackHistory(cleanSymbol, range);
    }

    if (!res.ok) {
      return getFallbackHistory(cleanSymbol, range);
    }

    const data = await res.json();

    if (data.status === "error" || !Array.isArray(data.values) || data.values.length === 0) {
      return getFallbackHistory(cleanSymbol, range);
    }

    const points: HistoryPoint[] = data.values
      .map(
        (v: {
          datetime: string;
          open: string;
          high: string;
          low: string;
          close: string;
          volume: string;
        }) => ({
          date: v.datetime,
          open: parseFloat(v.open) || 0,
          high: parseFloat(v.high) || 0,
          low: parseFloat(v.low) || 0,
          close: parseFloat(v.close) || 0,
          volume: parseInt(v.volume, 10) || 0,
        })
      )
      .reverse();

    const history: StockHistory = {
      symbol: cleanSymbol,
      range,
      points,
      isDelayed: true,
      delayedNotice: DELAYED_LABEL,
      fallback: false,
      notice: null,
    };

    setCached(cacheKey, history);
    return history;
  } catch {
    return getFallbackHistory(cleanSymbol, range);
  }
}

/**
 * Search ticker symbols and company names using Twelve Data /symbol_search
 * Cached for 5 minutes.
 */
export async function searchSymbols(query: string): Promise<SearchResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      query: "",
      results: FALLBACK_STOCKS.map((s) => ({
        symbol: s.symbol,
        description: s.name,
        type: "Common Stock",
        exchange: s.exchange,
      })),
      fallback: false,
      notice: null,
    };
  }

  const cacheKey = `search:${cleanQuery.toLowerCase()}`;
  const cached = getCached<SearchResponse>(cacheKey);
  if (cached) return cached;

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch {
    return getFallbackSearch(cleanQuery);
  }

  try {
    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(
      cleanQuery
    )}&apikey=${apiKey}`;

    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 429 || !res.ok) {
      return getFallbackSearch(cleanQuery);
    }

    const data = await res.json();
    if (data.status === "error" || !Array.isArray(data.data)) {
      return getFallbackSearch(cleanQuery);
    }

    const results: SearchResult[] = data.data.slice(0, 10).map(
      (item: {
        symbol: string;
        instrument_name: string;
        instrument_type?: string;
        exchange?: string;
      }) => ({
        symbol: item.symbol,
        description: item.instrument_name,
        type: item.instrument_type || "Common Stock",
        exchange: item.exchange,
      })
    );

    const response: SearchResponse = {
      query: cleanQuery,
      results,
      fallback: false,
      notice: null,
    };

    setCached(cacheKey, response);
    return response;
  } catch {
    return getFallbackSearch(cleanQuery);
  }
}

/**
 * Batch request quotes using Twelve Data comma-separated symbol support
 * Respects free rate limits by consolidating multiple stock lookups into 1 HTTP call.
 */
export async function getBatchQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
  const cleanSymbols = Array.from(
    new Set(symbols.map((s) => s.toUpperCase().trim()).filter(Boolean))
  );

  if (cleanSymbols.length === 0) return {};

  // Check cache first for individual symbols
  const result: Record<string, StockQuote> = {};
  const missing: string[] = [];

  for (const s of cleanSymbols) {
    const cached = getCached<StockQuote>(`quote:${s}`);
    if (cached) {
      result[s] = cached;
    } else {
      missing.push(s);
    }
  }

  if (missing.length === 0) return result;

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch {
    for (const s of missing) {
      result[s] = getFallbackQuote(s) || {
        symbol: s,
        name: s,
        price: 0,
        change: 0,
        changePercent: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0,
        isDelayed: true,
        delayedNotice: DELAYED_LABEL,
        fallback: true,
        notice: FALLBACK_NOTICE,
      };
    }
    return result;
  }

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(
      missing.join(",")
    )}&apikey=${apiKey}`;

    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 429 || !res.ok) {
      for (const s of missing) {
        result[s] = getFallbackQuote(s) || {
          symbol: s,
          name: s,
          price: 0,
          change: 0,
          changePercent: 0,
          open: 0,
          high: 0,
          low: 0,
          volume: 0,
          isDelayed: true,
          delayedNotice: DELAYED_LABEL,
          fallback: true,
          notice: FALLBACK_NOTICE,
        };
      }
      return result;
    }

    const data = await res.json();

    // If single symbol, response is single object. If multiple, keyed by symbol.
    for (const s of missing) {
      const item = missing.length === 1 ? data : data[s];
      if (item && item.close) {
        const quote: StockQuote = {
          symbol: item.symbol || s,
          name: item.name || s,
          price: parseFloat(item.close) || 0,
          change: parseFloat(item.change) || 0,
          changePercent: parseFloat(item.percent_change) || 0,
          open: parseFloat(item.open) || 0,
          high: parseFloat(item.high) || 0,
          low: parseFloat(item.low) || 0,
          volume: parseInt(item.volume, 10) || 0,
          previousClose: parseFloat(item.previous_close) || 0,
          isDelayed: true,
          delayedNotice: DELAYED_LABEL,
          fallback: false,
          notice: null,
        };
        setCached(`quote:${s}`, quote);
        result[s] = quote;
      } else {
        result[s] = getFallbackQuote(s) || {
          symbol: s,
          name: s,
          price: 0,
          change: 0,
          changePercent: 0,
          open: 0,
          high: 0,
          low: 0,
          volume: 0,
          isDelayed: true,
          delayedNotice: DELAYED_LABEL,
          fallback: true,
          notice: FALLBACK_NOTICE,
        };
      }
    }

    return result;
  } catch {
    for (const s of missing) {
      result[s] = getFallbackQuote(s) || {
        symbol: s,
        name: s,
        price: 0,
        change: 0,
        changePercent: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0,
        isDelayed: true,
        delayedNotice: DELAYED_LABEL,
        fallback: true,
        notice: FALLBACK_NOTICE,
      };
    }
    return result;
  }
}

// ==========================================
// Formatting Utilities
// ==========================================

export function formatCurrency(value?: number): string {
  if (typeof value !== "number" || isNaN(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value?: number): string {
  if (typeof value !== "number" || isNaN(value)) return "0.00%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

