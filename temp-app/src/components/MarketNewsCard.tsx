import React from "react";
import StockLogo from "./StockLogo";

interface NewsItem {
  id: string;
  symbol: string;
  companyName: string;
  headline: string;
  date: string;
  source: string;
  url?: string;
}

const DEFAULT_NEWS: NewsItem[] = [
  {
    id: "1",
    symbol: "TSLA",
    companyName: "Tesla Inc",
    headline: "Cathie Wood loads up another $2M in Tesla while Elon Musk urges employees to stay laser focused on autonomous robotaxi rollout.",
    date: "Nov 21, 2026",
    source: "The Guardian",
    url: "#",
  },
  {
    id: "2",
    symbol: "MSFT",
    companyName: "Microsoft Co.",
    headline: "Microsoft expands Copilot AI infrastructure with newly announced quantum-accelerated data centers across North America.",
    date: "Nov 20, 2026",
    source: "Bloomberg",
    url: "#",
  },
  {
    id: "3",
    symbol: "NVDA",
    companyName: "NVIDIA Co.",
    headline: "Next-gen Blackwell ultra enterprise GPUs experience unprecedented enterprise demand across cloud hyperscalers.",
    date: "Nov 19, 2026",
    source: "Reuters",
    url: "#",
  },
];

export default function MarketNewsCard({ news = DEFAULT_NEWS }: { news?: NewsItem[] }) {
  return (
    <div className="space-y-3.5">
      {news.map((item) => (
        <a
          key={item.id}
          href={item.url || "#"}
          target={item.url && item.url !== "#" ? "_blank" : undefined}
          rel="noreferrer"
          className="block bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:shadow-md transition group"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                {item.symbol}{" "}
                <span className="font-normal text-slate-400">({item.companyName})</span>
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-700 mt-2 line-clamp-2 leading-relaxed group-hover:text-black transition">
                &ldquo;{item.headline}&rdquo;
              </p>
            </div>
            <StockLogo symbol={item.symbol} size={36} className="shrink-0" />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100 font-medium">
            <span>{item.date}</span>
            <span className="text-slate-600 font-semibold">{item.source}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
