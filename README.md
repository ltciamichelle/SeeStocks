# SeeStocks 📈

SeeStocks is a modern, high-performance stock analytics web application built with **Next.js 15**, **React 19**, and **TypeScript**. It delivers stock market data, interactive candlestick and line charts, ticker search, and watchlist management with cloud persistence and authentication.

---

## ✨ Features

- **📊 Live & Delayed Market Quotes**: Real-time and delayed quote lookup using the Twelve Data API with automatic 5-minute caching.
- **📉 Interactive Historical Trends**: Daily historical candle charts with flexible timeframes (`1W`, `1M`, `3M`, `1Y`) and interactive hover price inspection.
- **🔍 Fast Symbol Search**: Debounced search autocomplete across exchanges and ticker symbols.
- **⭐ Personal Watchlist**: Track your favorite tickers with consolidated batch quote fetching to respect API rate limits.
- **🔒 Authentication with Clerk**: User session management with graceful fallback when running in placeholder mode.
- **☁️ MongoDB Atlas Persistence**: Seamlessly sync local watchlists with MongoDB Atlas via Mongoose connection pooling.
- **🛡️ Built-in Resilience**: If rate limits (HTTP 429) or network interruptions occur, the platform gracefully switches to verified offline sample data (`Showing sample data.`) without disrupting the user experience.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Frontend**: React 19, Tailwind CSS, Lucide-style SVG graphics
- **Language**: TypeScript
- **Data Provider**: Twelve Data API (Quotes, Time Series, Symbol Search)
- **Database & ORM**: MongoDB Atlas, Mongoose
- **Authentication**: Clerk (`@clerk/nextjs`)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.18.0 or newer
- **npm**: v9 or newer

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/ltciamichelle/SeeStocks.git
cd SeeStocks/temp-app
npm install
```

### 3. Environment Variables Configuration

Copy the sample environment file:

```bash
cp .env.example .env.local
```

Fill in the variables in `.env.local`:

```ini
# Stock API Configuration (Twelve Data: https://twelvedata.com)
STOCK_API_KEY=your_twelve_data_api_key
STOCK_API_PROVIDER=twelvedata

# Clerk Authentication (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# MongoDB Atlas Database URI
MONGODB_URI=your_mongodb_atlas_connection_string
```

> **Note**: If Clerk keys start with `pk_test_placeholder` or are omitted, the application automatically runs in demo mode without crashing, providing local-storage watchlists.

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the dashboard.

### 5. Building for Production

```bash
npm run build
npm run start
```

---

## 📡 API Reference

| Endpoint | Method | Query Parameters | Description |
|---|---|---|---|
| `/api/quote` | `GET` | `symbol` (e.g., `AAPL` or `AAPL,MSFT,NVDA`) | Retrieves current quote or batch quotes. |
| `/api/history` | `GET` | `symbol`, `range` (`1W`, `1M`, `1Y`) | Fetches daily historical candle series. |
| `/api/search` | `GET` | `q` (e.g., `app`) | Autocomplete lookup for symbols and company names. |
| `/api/watchlist` | `GET`, `POST`, `DELETE` | Authenticated session | Manages user watchlist items in MongoDB. |

---

## ⚖️ Disclaimer

*For learning only, not financial advice.* Market data is delayed by ~15 minutes per provider policy.
