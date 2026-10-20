# 📱 SeeStocks UI & Frontend Redesign Specification
> **Based on Design Reference:** Dual-Tone Minimalist Neo-Fintech (Dark Slate & Electric Lime `#CCFF00`)

---

## 1. Design System & Style Tokens

### 🎨 Color Palette
| Token | Hex / HSL | Usage |
| :--- | :--- | :--- |
| **Accent Lime** | `#CCFF00` / `#D2F824` | Primary CTA ("Buy"), active tabs, balance accent, high-contrast highlights |
| **Charcoal Dark** | `#121214` / `#18181B` | Primary cards (Balance, Market Cap, Portfolio lower card), action buttons ("Sell") |
| **Card Surface Light** | `#FFFFFF` | Stock item cards, market news cards, metric cards |
| **Background Neutral**| `#F4F5F8` | Screen background, search bar input surface |
| **Text Primary** | `#0F172A` (light) / `#FFFFFF` (dark) | Main headers, prices, symbol names |
| **Text Muted** | `#64748B` / `#94A3B8` | Subtitles, company full names, timestamps |
| **Positive / Bullish**| `#10B981` (Emerald) or Lime `#CCFF00` | Gain percentages, bullish momentum |
| **Negative / Bearish**| `#EF4444` / `#F43F5E` | Loss percentages, bearish direction |
| **Chart Line** | `#06B6D4` / `#10B981` (Cyan / Emerald) | Interactive stock history trend line |

### 🖋️ Typography & Iconography
- **Font Family**: Modern grotesque / geometric sans (`Geist Sans`, `Inter`, or `Outfit`).
- **Card Corner Radius**: `rounded-3xl` (24px) for cards, `rounded-full` (9999px) for pill buttons and search bar.
- **Graphic Watermark**: Subtle SVG concentric ripple / fingerprint watermark in charcoal headers.
- **Icons**: Lucide icons (`ArrowUpRight`, `ArrowDownLeft`, `Bell`, `Star`, `Search`, `LayoutGrid`, `TrendingUp`, `Wallet`, `Settings`).

---

## 2. Screen Architecture & Reference Mapping

### 🖥️ Screen 1: Home / Summary Dashboard
```
┌──────────────────────────────────────────────┐
│  [Status Bar: Time, Wifi, Battery]           │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Your Balance              [Watermark]  │  │
│  │ $209,891.21                            │  │
│  │                                        │  │
│  │ ┌─────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │ │ Deposit │  │ Withdraw │  │Transfer*│ │  │
│  │ └─────────┘  └──────────┘  └─────────┘ │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [ 🔍 Try "amazon"                       ]   │
│                                              │
│  Stock Activities               This month ∨ │
│  ┌────────────────────────────────────────┐  │
│  │ [MSFT] Microsoft Co.  [~/\~]   $234.53 │  │
│  │                                +10.21% │  │
│  ├────────────────────────────────────────┤  │
│  │ [NVDA] NVIDIA Co.     [\_/\_]  $140.36 │  │
│  │                                 -0.60% │  │
│  ├────────────────────────────────────────┤  │
│  │ [AAPL] Apple Inc.     [~/\~]   $182.53 │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [  Summary    Markets    Portfolio   ⚙️  ]   │
└──────────────────────────────────────────────┘
```

#### Key Components:
1. **Balance Card (`HeroBalanceCard`)**:
   - Dark rounded card (`#121214`) with custom SVG ripple watermark.
   - Live total balance & quick action buttons:
     - **Deposit** (icon + label)
     - **Withdraw** (icon + label)
     - **Transfer** (highlighted in Electric Lime circle button)
2. **Search Pill (`StockSearchBar`)**:
   - Rounded pill input with magnifying glass icon.
   - Autocomplete dropdown pulling from `/api/search` with company symbol, name, and current price.
3. **Stock Activities Feed (`StockActivityList`)**:
   - Filter dropdown (`Today`, `This week`, `This month`).
   - Cards with:
     - High-res Company Icon / Logo badge
     - Ticker & Company Name
     - Inline SVG sparkline wave (green for gainers, red for losers)
     - Price & % change pill
     - Click navigates to **Screen 3 (Stock Detail)**.

---

### 🖥️ Screen 2: Markets & Portfolio Insights
```
┌──────────────────────────────────────────────┐
│  Helllo, [User Name]!           [🔔] [Avatar]│
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Your Portfolio        December 21, 2026│  │ (Lime #CCFF00)
│  ├────────────────────────────────────────┤  │
│  │ Total Invest              ▲ +14.31%    │  │ (Dark #121214)
│  │ $4,389.80                              │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌───────────────────┐ ┌───────────────────┐ │
│  │ Market Direction  │ │ Market Momentum   │ │
│  │ Bearish           │ │ Bullish           │ │
│  │ -1.321% last 7 day│ │ +0.1673 last 7 day│ │
│  └───────────────────┘ └───────────────────┘ │
│                                              │
│  Recent Market News                 See more │
│  ┌────────────────────────────────────────┐  │
│  │ TSLA (Tesla Inc)                   [𝘛] │  │
│  │ "Cathie Wood loads up another $2M... " │  │
│  │ Nov 21, 2026              The Guardian │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [  Summary    Markets    Portfolio   ⚙️  ]   │
└──────────────────────────────────────────────┘
```

#### Key Components:
1. **User Greeting Header (`UserHeader`)**:
   - Dynamic user name from Clerk (`Hello, {firstName}!`).
   - Notification bell button with unread ping.
   - User profile avatar / Clerk `<UserButton />`.
2. **Two-Tone Split Portfolio Card (`SplitPortfolioCard`)**:
   - Top banner: Electric Lime `#CCFF00` with dark text, "Your Portfolio" + current date.
   - Bottom half: Dark charcoal `#121214` with "Total Invest", formatted amount, and `+14.31%` badge.
3. **Market Metrics Dual Grid (`MarketMetricsGrid`)**:
   - **Market Direction**: e.g., "Bearish" / "Neutral" / "Bullish" with 7-day delta.
   - **Market Momentum**: e.g., "Bullish" / RSI / Volume momentum with 7-day delta.
4. **Market News Feed (`MarketNewsList`)**:
   - Recent financial stories related to active stocks.
   - Source pill, publication date, and stock ticker tag.

---

### 🖥️ Screen 3: Stock Detail & Trading Screen (e.g. MSFT)
```
┌──────────────────────────────────────────────┐
│  [← Back]       MSFT                 [⭐]    │
│            Microsoft Corporation             │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ $1780.09B                  ▲ +10.21%   │  │
│  │ Market capitalization                  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [ 1D ]  [ 5D ]  [ 1W ]  [ 1M*]  [ 3M ] [ 1Y]│
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 260 |           _/\                    │  │
│  │ 240 |      _/\_/   \____   (Hover Dot) │  │
│  │ 220 |  _.-'             \--/           │  │
│  │ 200 |  [ Open  ▲ $233.53 ]             │  │
│  │     |  [ Close ▼ $280.21 ]             │  │
│  │     +-----------------------------     │  │
│  │       Aug   Sept   Oct   Nov   Dec     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │      Sell ↗      │  │      Buy ↙       │  │
│  │  (Dark Button)   │  │  (Lime #CCFF00)  │  │
│  └──────────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────┘
```

#### Key Components:
1. **Stock Detail Top Bar (`StockDetailHeader`)**:
   - Back button to return to dashboard/list.
   - Stock Symbol (`MSFT`) in bold, Company Name subtitle.
   - Star icon toggle for Watchlist (persisted via MongoDB & `/api/watchlist`).
2. **Market Cap Hero Card (`MarketCapCard`)**:
   - Total Market Cap or Company Valuation.
   - Change indicator badge (`+10.21%`).
3. **Period Selector Tabs (`TimeframeSelector`)**:
   - Pill tabs: `1D`, `5D`, `1W`, `1M`, `3M`, `1Y`.
   - Selected tab styled with solid black background and white text.
4. **Interactive Chart View (`InteractiveStockChart`)**:
   - Smooth curved SVG/Canvas line chart with gradient area fill.
   - Crosshair on touch / hover with vertical dashed tracking line.
   - High-contrast floating tooltip: `Open ▲ $XXX.XX` and `Close ▼ $XXX.XX` or `Price / Date`.
   - Clean Cartesian grid with price axis and time axis labels.
5. **Trade Action Bar (`TradeActionButtons`)**:
   - **Sell Button**: Dark charcoal button with diagonal arrow icon `↗`.
   - **Buy Button**: Electric Lime `#CCFF00` primary button with downward diagonal arrow icon `↙`.
   - Modal trigger for simulated order placement / position tracking.

---

### 📱 Navigation & Frame Layout
- **Navigation Dock (`BottomNavDock`)**:
  - Pinned or floating bottom dock with 4 primary destinations:
    1. **Summary** (Home / Balance / Stock Activities)
    2. **Markets** (Market indices, gainers/losers, sector momentum)
    3. **Portfolio** (Invested positions, watchlist, news)
    4. **Settings** (Clerk account profile, theme, preferences)
- **Responsive Layout**:
  - **Mobile (< 768px)**: Native mobile app experience with bottom navigation.
  - **Desktop (≥ 768px)**: Centered mobile viewport preview or dual-pane layout (left: Dashboard/Portfolio, right: Interactive Stock Detail & Trade panel) so the aesthetic is preserved perfectly across devices.

---

## 3. Data & Backend Integration

| UI Feature | Existing Backend Route / Service | Status |
| :--- | :--- | :--- |
| **Search Bar** | `/api/search?q={query}` | ✅ Available |
| **Quote & Market Cap** | `/api/quote?symbol={symbol}` | ✅ Available |
| **Interactive Chart** | `/api/history?symbol={symbol}&range={range}` | ✅ Available |
| **Watchlist Star** | `/api/watchlist` (GET / POST / DELETE) | ✅ Available with MongoDB Atlas |
| **User Profile & Auth** | Clerk Provider (`@clerk/nextjs`) | ✅ Available |
| **Balance & Portfolio** | Client simulated portfolio / local storage + MongoDB model | ⚡ Ready to wire up |
| **Market News** | Market news feed API / Finnhub or curated financial news | ⚡ Ready to wire up |

---

## 4. Implementation Steps

1. **Step 1 - Review & Approval**: User checks this specification.
2. **Step 2 - Design System Setup**:
   - Update `globals.css` with color variables (`--lime-accent: #ccff00`, `--dark-card: #121214`, `--bg-surface: #f4f5f8`).
   - Create ripple/fingerprint SVG watermark asset.
3. **Step 3 - Core Components**:
   - Build `HeroBalanceCard`, `SplitPortfolioCard`, `StockActivityCard`, `BottomNavDock`.
   - Refactor `StockChart` into the curved grid chart with crosshair & floating tooltip.
4. **Step 4 - Page Integration**:
   - Connect the 3 screen tabs (Summary, Markets/Portfolio, and Stock Detail view).
   - Hook into live quotes, history endpoints, and watchlist toggles.
5. **Step 5 - Testing & Polish**:
   - Verify mobile responsiveness, button interactions, hover states, and smooth transitions.
