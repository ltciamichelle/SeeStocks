"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
  sessionOnly?: boolean;
}

export default function SplashScreen({
  onFinish,
  minDuration = 1400,
  sessionOnly = false,
}: SplashScreenProps) {
  const [mounted, setMounted] = useState<boolean>(() => {
    if (typeof window !== "undefined" && sessionOnly) {
      return !sessionStorage.getItem("seestocks_splash_shown");
    }
    return true;
  });
  const [isFading, setIsFading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(15);

  useEffect(() => {
    if (!mounted) return;

    if (sessionOnly && typeof window !== "undefined") {
      sessionStorage.setItem("seestocks_splash_shown", "true");
    }

    // Smooth progress bar fill
    const progressTimer = setTimeout(() => {
      setProgress(100);
    }, 150);

    // Start fade-out transition
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
      if (onFinish) onFinish();
    }, minDuration);

    // Fully unmount from DOM after fade completes
    const unmountTimer = setTimeout(() => {
      setMounted(false);
    }, minDuration + 700);

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [minDuration, onFinish, mounted, sessionOnly]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-label="Loading SeeStocks"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none overflow-hidden bg-[#040406] transition-all duration-700 ease-out ${
        isFading
          ? "opacity-0 pointer-events-none scale-102"
          : "opacity-100 scale-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #282a36 0%, #14151d 45%, #07070a 80%, #020204 100%)",
      }}
    >
      {/* Dynamic ambient lime & grey backglow */}
      <div className="absolute w-80 h-80 rounded-full bg-[#ccff00]/12 blur-3xl pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none -top-12" />

      {/* Centerpiece container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Glowing Logo Icon */}
        <div className="relative mb-5 group">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-[#09090b] border border-[#ccff00]/40 shadow-[0_0_50px_rgba(204,255,0,0.25)] flex items-center justify-center transition-transform transform duration-500 hover:scale-105">
            <Image
              src="/seestock-logo.png"
              alt="SeeStocks Logo"
              width={96}
              height={96}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          {/* Subtle pulsating outer ring */}
          <div className="absolute -inset-1 rounded-[28px] border border-[#ccff00]/20 animate-ping pointer-events-none opacity-40" />
        </div>

        {/* Brand Typography */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-1">
            See<span className="text-[#ccff00]">Stocks</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase">
            Real-Time Market Terminal
          </p>
        </div>

        {/* Minimalist Hairline Progress Bar */}
        <div className="mt-8 w-36 sm:w-44 h-1 bg-zinc-800/80 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-[#ccff00] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_#ccff00]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Minimalist Status Indicator */}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500 font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse" />
          <span>Streaming live quotes...</span>
        </div>
      </div>

      {/* Discreet bottom security/legal badge */}
      <div className="absolute bottom-8 text-[10px] text-zinc-600 font-medium tracking-wider uppercase">
        Encrypted Analytics • Delayed Market Feed
      </div>
    </div>
  );
}
