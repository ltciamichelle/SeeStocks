import React from "react";

interface StockLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export default function StockLogo({ symbol, size = 44, className = "" }: StockLogoProps) {
  const sym = symbol.toUpperCase();

  // Microsoft (4 colored squares)
  if (sym === "MSFT") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-white rounded-2xl flex items-center justify-center p-2.5 shadow-sm border border-slate-100 shrink-0 ${className}`}
      >
        <div className="grid grid-cols-2 gap-1 w-full h-full">
          <div className="bg-[#f25022] rounded-sm" />
          <div className="bg-[#7fba00] rounded-sm" />
          <div className="bg-[#00a4ef] rounded-sm" />
          <div className="bg-[#ffb900] rounded-sm" />
        </div>
      </div>
    );
  }

  // NVIDIA (Green stylized claw/eye on dark)
  if (sym === "NVDA") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-[#0a0a0a] rounded-2xl flex items-center justify-center p-2 shadow-sm shrink-0 ${className}`}
      >
        <svg viewBox="0 0 100 80" className="w-6 h-6 fill-[#76b900]">
          <path d="M50 0C25 0 5 18 0 42c6-11 19-19 33-19 21 0 37 15 37 34 0 1-.1 3-.2 4C82 56 94 40 94 22 94 10 74 0 50 0zm0 18c-15 0-27 11-27 24 0 7 3 13 8 18-3-4-5-8-5-13 0-11 11-20 24-20 12 0 22 8 24 19 1-2 1-5 1-8 0-11-11-20-25-20z" />
        </svg>
      </div>
    );
  }

  // Apple
  if (sym === "AAPL") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-black rounded-2xl flex items-center justify-center p-2 shadow-sm shrink-0 ${className}`}
      >
        <svg viewBox="0 0 170 170" className="w-5 h-5 fill-white">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.83-8.15-12.44-15.22-5.99-9.13-10.66-19.68-14.01-31.64-3.35-11.96-5.02-23.27-5.02-33.93 0-14.78 3.73-27.18 11.2-37.21 7.46-10.02 17.2-15.15 29.21-15.39 4.36 0 9.27 1.13 14.74 3.39 5.48 2.26 9.27 3.44 11.39 3.55 1.74 0 5.69-1.29 11.83-3.88 6.15-2.58 11.36-3.72 15.64-3.41 12.08.79 21.6 5.25 28.56 13.38-10.63 6.44-15.83 15.27-15.6 26.49.23 8.87 3.52 16.29 9.87 22.25 6.35 5.96 13.88 9.5 22.59 10.62-2.18 6.78-4.8 13.5-7.86 20.17zM119.22 31.42c0-7.29 2.58-14.28 7.74-20.97 5.16-6.68 11.66-10.45 19.5-11.31.22 1.09.33 2.06.33 2.93 0 7.28-2.67 14.32-8.01 21.13-5.34 6.81-11.88 10.63-19.62 11.45.06-1.08.06-2.16.06-3.23z" />
        </svg>
      </div>
    );
  }

  // Tesla
  if (sym === "TSLA") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm border border-slate-100 shrink-0 ${className}`}
      >
        <svg viewBox="0 0 100 100" className="w-6 h-6 fill-[#e82127]">
          <path d="M50 18c12 0 24 3 34 8l5-12C74 7 62 4 50 4 38 4 26 7 11 14l5 12c10-5 22-8 34-8zm0 18c-7 0-14 2-20 5l3 11c5-2 11-4 17-4 6 0 12 2 17 4l3-11c-6-3-13-5-20-5zm-5 24h10v36H45V60z" />
        </svg>
      </div>
    );
  }

  // Fallback badge with gradient and letter
  const getGradient = (letter: string) => {
    const charCode = letter.charCodeAt(0) % 5;
    switch (charCode) {
      case 0:
        return "bg-gradient-to-br from-indigo-500 to-purple-600 text-white";
      case 1:
        return "bg-gradient-to-br from-amber-400 to-orange-500 text-white";
      case 2:
        return "bg-gradient-to-br from-emerald-400 to-teal-600 text-white";
      case 3:
        return "bg-gradient-to-br from-cyan-400 to-blue-600 text-white";
      default:
        return "bg-gradient-to-br from-slate-700 to-slate-900 text-white";
    }
  };

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-2xl font-bold text-sm tracking-wider flex items-center justify-center shadow-sm shrink-0 ${getGradient(
        sym
      )} ${className}`}
    >
      {sym.slice(0, 2)}
    </div>
  );
}
