import fallbackDataset from "./fallback-stocks.json";

// ==========================================
// Types and Interfaces
// ==========================================

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: number;
  marketCap?: string;
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
  isDelayed: boolean;
  delayedNotice: string;
  isFallback: boolean;
  notice: string | null;
  cached?: boolean;
  cachedAt?: string;
}

export interface StockHistoryResponse {
  symbol: string;
  range: string;
  points: HistoryPoint[];
  isDelayed: boolean;
  delayedNotice: string;
  isFallback: boolean;
  notice: string | null;
  cached?: boolean;
  cachedAt?: string;
}

export interface StockSearchResult {
  symbol: string;
  description: string;
  type?: string;
  exchange?: string;
}

export interface StockSearchResponse {
  query: string;
  results: StockSearchResult[];
  isFallback: boolean;
  notice: string | null;
  cached?: boolean;
  cachedAt?: string;
}

export interface FallbackStock {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  sector: string;
  industry: string;
  marketCap: string;
  peRatio: number;
  week52High: number;
  week52Low: number;
  quote: {
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    volume: number;
    timestamp: number;
  };
  history: HistoryPoint[];
}

export const FALLBACK_STOCKS: FallbackStock[] = fallbackDataset.stocks as FallbackStock[];

// ==========================================
// 5-Minute In-Memory Server Cache
// ==========================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const globalForCache = globalThis as unknown as {
  __stockMemoryCache?: Map<string, CacheEntry<unknown>>;
};

const cache = globalForCache.__stockMemoryCache || new Map<string, CacheEntry<unknown>>();
if (process.env.NODE_ENV !== "production") {
  globalForCache.__stockMemoryCache = cache;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function getFromCache<T>(key: string): { data: T; cachedAt: string } | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return {
    data: entry.data,
    cachedAt: new Date(entry.timestamp).toISOString(),
  };
}

export function setInCache<T>(key: string, data: T, ttlMs = FIVE_MINUTES_MS): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  });
}

export function clearStockCache(): void {
  cache.clear();
}

// ==========================================
// Fallback Helper Functions
// ==========================================

export function getFallbackQuote(symbol: string): StockQuote | null {
  const upper = symbol.toUpperCase().trim();
  const stock = FALLBACK_STOCKS.find((s) => s.symbol === upper);
  if (!stock) return null;

  return {
    symbol: stock.symbol,
    name: stock.name,
    exchange: stock.exchange,
    currency: stock.currency,
    sector: stock.sector,
    industry: stock.industry,
    price: stock.quote.price,
    change: stock.quote.change,
    changePercent: stock.quote.changePercent,
    high: stock.quote.high,
    low: stock.quote.low,
    open: stock.quote.open,
    previousClose: stock.quote.previousClose,
    volume: stock.quote.volume,
    timestamp: stock.quote.timestamp,
    marketCap: stock.marketCap,
    peRatio: stock.peRatio,
    week52High: stock.week52High,
    week52Low: stock.week52Low,
    isDelayed: true,
    delayedNotice: "Delayed data",
    isFallback: true,
    notice: "Showing sample data.",
  };
}

export function getFallbackHistory(symbol: string, range = "1M"): StockHistoryResponse | null {
  const upper = symbol.toUpperCase().trim();
  const stock = FALLBACK_STOCKS.find((s) => s.symbol === upper);
  if (!stock) return null;

  let points = [...stock.history];
  if (range === "1W") {
    points = points.slice(-5);
  } else if (range === "1M") {
    points = points.slice(-20);
  }

  return {
    symbol: stock.symbol,
    range,
    points,
    isDelayed: true,
    delayedNotice: "Delayed data",
    isFallback: true,
    notice: "Showing sample data.",
  };
}

export function searchFallbackStocks(query: string): StockSearchResponse {
  const q = query.toLowerCase().trim();
  const matched = FALLBACK_STOCKS.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );

  return {
    query,
    results: matched.map((s) => ({
      symbol: s.symbol,
      description: s.name,
      type: "Common Stock",
      exchange: s.exchange,
    })),
    isFallback: true,
    notice: "Showing sample data.",
  };
}

// ==========================================
// Server-Side Stock API Handlers
// ==========================================

const DELAYED_LABEL = "Delayed data";

function resolveProvider(apiKey: string): "twelvedata" | "finnhub" | "alphavantage" {
  const configured = process.env.STOCK_API_PROVIDER?.toLowerCase().trim();
  if (configured === "twelvedata" || configured === "finnhub" || configured === "alphavantage") {
    return configured;
  }
  // Auto-detect: 32 hex chars is Twelve Data API key format
  if (/^[a-f0-9]{32}$/i.test(apiKey.trim())) {
    return "twelvedata";
  }
  return "finnhub";
}

/**
 * Server function to fetch a stock quote with 5-minute caching and sample fallback
 */
export async function getQuoteServer(symbol: string): Promise<StockQuote> {
  const cleanSymbol = symbol.toUpperCase().trim();
  if (!cleanSymbol) {
    throw new Error("Missing stock symbol");
  }

  const cacheKey = `quote:${cleanSymbol}`;
  const cached = getFromCache<StockQuote>(cacheKey);
  if (cached) {
    return {
      ...cached.data,
      cached: true,
      cachedAt: cached.cachedAt,
    };
  }

  const apiKey = process.env.STOCK_API_KEY?.trim();

  // If no API key is provided, gracefully serve the fallback stock
  if (!apiKey) {
    const fallback = getFallbackQuote(cleanSymbol);
    if (fallback) {
      setInCache(cacheKey, fallback);
      return fallback;
    }
    throw new Error(
      `STOCK_API_KEY environment variable is not configured, and "${cleanSymbol}" is not in the 5 sample fallback stocks (AAPL, MSFT, GOOGL, AMZN, NVDA).`
    );
  }

  const provider = resolveProvider(apiKey);

  try {
    let quote: StockQuote | null = null;

    if (provider === "twelvedata") {
      quote = await fetchTwelveDataQuote(cleanSymbol, apiKey);
    } else if (provider === "alphavantage") {
      quote = await fetchAlphaVantageQuote(cleanSymbol, apiKey);
    } else {
      quote = await fetchFinnhubQuote(cleanSymbol, apiKey);
    }

    if (quote) {
      setInCache(cacheKey, quote);
      return quote;
    }
  } catch (err: unknown) {
    console.warn(`[Stock API Error for ${cleanSymbol}]:`, err instanceof Error ? err.message : err);
  }

  // If API failed, rate limit hit, or returned empty, try fallback
  const fallback = getFallbackQuote(cleanSymbol);
  if (fallback) {
    setInCache(cacheKey, fallback);
    return fallback;
  }

  throw new Error(
    `Failed to fetch live quote for "${cleanSymbol}" from ${provider}. Please verify the symbol or try again.`
  );
}

/**
 * Server function to fetch historical price data with 5-minute caching
 */
export async function getHistoryServer(symbol: string, range = "1M"): Promise<StockHistoryResponse> {
  const cleanSymbol = symbol.toUpperCase().trim();
  if (!cleanSymbol) {
    throw new Error("Missing stock symbol");
  }

  const cacheKey = `history:${cleanSymbol}:${range}`;
  const cached = getFromCache<StockHistoryResponse>(cacheKey);
  if (cached) {
    return {
      ...cached.data,
      cached: true,
      cachedAt: cached.cachedAt,
    };
  }

  const apiKey = process.env.STOCK_API_KEY?.trim();

  if (!apiKey) {
    const fallback = getFallbackHistory(cleanSymbol, range);
    if (fallback) {
      setInCache(cacheKey, fallback);
      return fallback;
    }
    throw new Error(
      `STOCK_API_KEY is not configured and "${cleanSymbol}" is not in the sample stocks.`
    );
  }

  const provider = resolveProvider(apiKey);

  try {
    let history: StockHistoryResponse | null = null;

    if (provider === "twelvedata") {
      history = await fetchTwelveDataHistory(cleanSymbol, apiKey, range);
    } else if (provider === "alphavantage") {
      history = await fetchAlphaVantageHistory(cleanSymbol, apiKey, range);
    } else {
      history = await fetchFinnhubHistory(cleanSymbol, apiKey, range);
    }

    if (history && history.points.length > 0) {
      setInCache(cacheKey, history);
      return history;
    }
  } catch (err: unknown) {
    console.warn(`[Stock History API Error for ${cleanSymbol}]:`, err instanceof Error ? err.message : err);
  }

  const fallback = getFallbackHistory(cleanSymbol, range);
  if (fallback) {
    setInCache(cacheKey, fallback);
    return fallback;
  }

  throw new Error(
    `Failed to load history for "${cleanSymbol}". Please check connection or try again.`
  );
}

/**
 * Server function to search for stocks with 5-minute caching
 */
export async function searchStocksServer(query: string): Promise<StockSearchResponse> {
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
      isFallback: false,
      notice: null,
    };
  }

  const cacheKey = `search:${cleanQuery.toLowerCase()}`;
  const cached = getFromCache<StockSearchResponse>(cacheKey);
  if (cached) {
    return {
      ...cached.data,
      cached: true,
      cachedAt: cached.cachedAt,
    };
  }

  const apiKey = process.env.STOCK_API_KEY?.trim();

  if (!apiKey) {
    const fallback = searchFallbackStocks(cleanQuery);
    setInCache(cacheKey, fallback);
    return fallback;
  }

  const provider = resolveProvider(apiKey);

  try {
    let searchResp: StockSearchResponse | null = null;

    if (provider === "twelvedata") {
      searchResp = await fetchTwelveDataSearch(cleanQuery, apiKey);
    } else if (provider === "alphavantage") {
      searchResp = await fetchAlphaVantageSearch(cleanQuery, apiKey);
    } else {
      searchResp = await fetchFinnhubSearch(cleanQuery, apiKey);
    }

    if (searchResp && searchResp.results.length > 0) {
      setInCache(cacheKey, searchResp);
      return searchResp;
    }
  } catch (err: unknown) {
    console.warn(`[Stock Search API Error]:`, err instanceof Error ? err.message : err);
  }

  const fallback = searchFallbackStocks(cleanQuery);
  setInCache(cacheKey, fallback);
  return fallback;
}

// ==========================================
// Provider: Twelve Data
// ==========================================

async function fetchTwelveDataQuote(symbol: string, apiKey: string): Promise<StockQuote | null> {
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6500) });
  if (!res.ok) return null;

  const q = await res.json();
  if (q.status === "error" || !q.close) {
    if (q.message && q.message.includes("api key")) {
      console.warn("[Twelve Data] API key rejected:", q.message);
    }
    return null;
  }

  return {
    symbol: q.symbol || symbol,
    name: q.name || symbol,
    exchange: q.exchange || "US",
    currency: q.currency || "USD",
    price: parseFloat(q.close),
    change: parseFloat(q.change || "0"),
    changePercent: parseFloat(q.percent_change || "0"),
    high: parseFloat(q.high || "0"),
    low: parseFloat(q.low || "0"),
    open: parseFloat(q.open || "0"),
    previousClose: parseFloat(q.previous_close || "0"),
    volume: parseInt(q.volume, 10) || 0,
    timestamp: q.timestamp ? q.timestamp * 1000 : Date.now(),
    week52High: q.fifty_two_week?.high ? parseFloat(q.fifty_two_week.high) : undefined,
    week52Low: q.fifty_two_week?.low ? parseFloat(q.fifty_two_week.low) : undefined,
    isDelayed: true,
    delayedNotice: DELAYED_LABEL,
    isFallback: false,
    notice: null,
  };
}

async function fetchTwelveDataHistory(symbol: string, apiKey: string, range = "1M"): Promise<StockHistoryResponse | null> {
  let outputsize = 20;
  if (range === "1W") outputsize = 5;
  if (range === "3M") outputsize = 60;
  if (range === "1Y") outputsize = 250;

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${outputsize}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6500) });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status === "error" || !Array.isArray(data.values) || data.values.length === 0) {
    return null;
  }

  const points: HistoryPoint[] = data.values
    .map((v: { datetime: string; open: string; high: string; low: string; close: string; volume: string }) => ({
      date: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume, 10) || 0,
    }))
    .reverse();

  return {
    symbol,
    range,
    points,
    isDelayed: true,
    delayedNotice: DELAYED_LABEL,
    isFallback: false,
    notice: null,
  };
}

async function fetchTwelveDataSearch(query: string, apiKey: string): Promise<StockSearchResponse | null> {
  const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status === "error" || !Array.isArray(data.data)) return null;

  const results: StockSearchResult[] = data.data.slice(0, 10).map((item: { symbol: string; instrument_name: string; instrument_type: string; exchange: string }) => ({
    symbol: item.symbol,
    description: item.instrument_name,
    type: item.instrument_type || "Common Stock",
    exchange: item.exchange,
  }));

  return {
    query,
    results,
    isFallback: false,
    notice: null,
  };
}

// ==========================================
// Provider: Finnhub
// ==========================================

async function fetchFinnhubQuote(symbol: string, apiKey: string): Promise<StockQuote | null> {
  const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;

  const [quoteRes, profileRes] = await Promise.all([
    fetch(quoteUrl, { signal: AbortSignal.timeout(6000) }),
    fetch(profileUrl, { signal: AbortSignal.timeout(6000) }).catch(() => null),
  ]);

  if (quoteRes.status === 429) return null;
  if (!quoteRes.ok) return null;

  const q = await quoteRes.json();
  if (q.c === 0 && q.pc === 0 && q.d === null) return null;

  let profileData: { name?: string; exchange?: string; currency?: string; finnhubIndustry?: string } = {};
  if (profileRes && profileRes.ok) {
    try {
      profileData = await profileRes.json();
    } catch {
      // Ignore
    }
  }

  return {
    symbol,
    name: profileData.name || symbol,
    exchange: profileData.exchange || "US",
    currency: profileData.currency || "USD",
    industry: profileData.finnhubIndustry,
    price: Number(q.c) || 0,
    change: Number(q.d) || 0,
    changePercent: Number(q.dp) || 0,
    high: Number(q.h) || 0,
    low: Number(q.l) || 0,
    open: Number(q.o) || 0,
    previousClose: Number(q.pc) || 0,
    volume: 0,
    timestamp: q.t ? Number(q.t) * 1000 : Date.now(),
    isDelayed: true,
    delayedNotice: DELAYED_LABEL,
    isFallback: false,
    notice: null,
  };
}

async function fetchFinnhubHistory(symbol: string, apiKey: string, range = "1M"): Promise<StockHistoryResponse | null> {
  const to = Math.floor(Date.now() / 1000);
  let days = 30;
  if (range === "1W") days = 7;
  if (range === "3M") days = 90;
  if (range === "1Y") days = 365;

  const from = to - days * 24 * 60 * 60;
  const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;

  const res = await fetch(candleUrl, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.s !== "ok" || !Array.isArray(data.c) || data.c.length === 0) return null;

  const points: HistoryPoint[] = [];
  for (let i = 0; i < data.c.length; i++) {
    const timestamp = data.t[i] * 1000;
    const dateStr = new Date(timestamp).toISOString().split("T")[0];
    points.push({
      date: dateStr,
      open: Number(data.o[i]) || 0,
      high: Number(data.h[i]) || 0,
      low: Number(data.l[i]) || 0,
      close: Number(data.c[i]) || 0,
      volume: Number(data.v[i]) || 0,
    });
  }

  return {
    symbol,
    range,
    points,
    isDelayed: true,
    delayedNotice: DELAYED_LABEL,
    isFallback: false,
    notice: null,
  };
}

async function fetchFinnhubSearch(query: string, apiKey: string): Promise<StockSearchResponse | null> {
  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (res.status === 429 || !res.ok) return null;

  const data = await res.json();
  if (!data.result || !Array.isArray(data.result)) return null;

  const results: StockSearchResult[] = data.result
    .filter((item: { symbol?: string }) => item.symbol && !item.symbol.includes("."))
    .slice(0, 10)
    .map((item: { symbol: string; description: string; type?: string }) => ({
      symbol: item.symbol,
      description: item.description,
      type: item.type || "Common Stock",
    }));

  return {
    query,
    results,
    isFallback: false,
    notice: null,
  };
}

// ==========================================
// Provider: Alpha Vantage
// ==========================================

async function fetchAlphaVantageQuote(symbol: string, apiKey: string): Promise<StockQuote | null> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) return null;

  const data = await res.json();
  const gq = data["Global Quote"];
  if (!gq || !gq["05. price"]) return null;

  return {
    symbol,
    name: symbol,
    price: parseFloat(gq["05. price"]),
    change: parseFloat(gq["09. change"]),
    changePercent: parseFloat((gq["10. change percent"] || "0").replace("%", "")),
    high: parseFloat(gq["03. high"]),
    low: parseFloat(gq["04. low"]),
    open: parseFloat(gq["02. open"]),
    previousClose: parseFloat(gq["08. previous close"]),
    volume: parseInt(gq["06. volume"], 10) || 0,
    timestamp: Date.now(),
    isDelayed: true,
    delayedNotice: DELAYED_LABEL,
    isFallback: false,
    notice: null,
  };
}

async function fetchAlphaVantageHistory(symbol: string, apiKey: string, range = "1M"): Promise<StockHistoryResponse | null> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!res.ok) return null;

  const data = await res.json();
  const timeSeries = data["Time Series (Daily)"];
  if (!timeSeries) return null;

  const dates = Object.keys(timeSeries).sort();
  let maxPoints = 20;
  if (range === "1W") maxPoints = 5;
  if (range === "3M") maxPoints = 60;
  if (range === "1Y") maxPoints = 250;

  const selectedDates = dates.slice(-maxPoints);
  const points: HistoryPoint[] = selectedDates.map((date) => {
    const item = timeSeries[date];
    return {
      date,
      open: parseFloat(item["1. open"]),
      high: parseFloat(item["2. high"]),
      low: parseFloat(item["3. low"]),
      close: parseFloat(item["4. close"]),
      volume: parseInt(item["5. volume"], 10) || 0,
    };
  });

  return {
    symbol,
    range,
    points,
    isDelayed: true,
    delayedNotice: DELAYED_LABEL,
    isFallback: false,
    notice: null,
  };
}

async function fetchAlphaVantageSearch(query: string, apiKey: string): Promise<StockSearchResponse | null> {
  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return null;

  const data = await res.json();
  const matches = data["bestMatches"];
  if (!Array.isArray(matches)) return null;

  const results: StockSearchResult[] = matches.slice(0, 10).map((m) => ({
    symbol: m["1. symbol"],
    description: m["2. name"],
    type: m["3. type"],
    exchange: m["4. region"],
  }));

  return {
    query,
    results,
    isFallback: false,
    notice: null,
  };
}

// ==========================================
// Client-Side Fetchers
// ==========================================

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || `Failed to fetch quote for ${symbol}`);
  }
  return data;
}

export async function fetchStockHistory(symbol: string, range = "1M"): Promise<StockHistoryResponse> {
  const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || `Failed to fetch history for ${symbol}`);
  }
  return data;
}

export async function fetchStockSearch(query: string): Promise<StockSearchResponse> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Failed to search stocks");
  }
  return data;
}

// Format utilities
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
