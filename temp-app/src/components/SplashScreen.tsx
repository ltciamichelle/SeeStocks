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
  minDuration = 1200,
  sessionOnly = false,
}: SplashScreenProps) {
  const [mounted, setMounted] = useState<boolean>(() => {
    if (typeof window !== "undefined" && sessionOnly) {
      return !sessionStorage.getItem("seestocks_splash_shown");
    }
    return true;
  });
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    if (!mounted) return;

    if (sessionOnly && typeof window !== "undefined") {
      sessionStorage.setItem("seestocks_splash_shown", "true");
    }

    // Start fade-out transition
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
      if (onFinish) onFinish();
    }, minDuration);

    // Fully unmount from DOM after fade completes
    const unmountTimer = setTimeout(() => {
      setMounted(false);
    }, minDuration + 600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [minDuration, onFinish, mounted, sessionOnly]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-label="SeeStocks Terminal"
      className={`fixed inset-0 z-[9999] flex items-center justify-center select-none overflow-hidden bg-[#040406] transition-all duration-700 ease-out ${
        isFading
          ? "opacity-0 pointer-events-none scale-102"
          : "opacity-100 scale-100"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #282a36 0%, #14151d 45%, #07070a 80%, #020204 100%)",
      }}
    >
      {/* Dynamic ambient lime & grey backglow */}
      <div className="absolute w-80 h-80 rounded-full bg-[#ccff00]/15 blur-3xl pointer-events-none" />
      <div className="absolute w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none -top-12" />

      {/* Pure Centerpiece: Logo Only */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-[#09090b] border border-[#ccff00]/40 shadow-[0_0_60px_rgba(204,255,0,0.3)] flex items-center justify-center transition-transform transform duration-500 hover:scale-105">
            <Image
              src="/seestock-logo.png"
              alt="SeeStocks Logo"
              width={112}
              height={112}
              priority
              className="w-full h-full object-cover"
            />
          </div>
          {/* Subtle pulsating outer ring */}
          <div className="absolute -inset-1.5 rounded-[30px] border border-[#ccff00]/25 animate-ping pointer-events-none opacity-40" />
        </div>
      </div>
    </div>
  );
}
