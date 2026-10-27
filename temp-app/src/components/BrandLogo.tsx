"use client";

import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
  priority?: boolean;
}

export default function BrandLogo({
  size = 40,
  className = "",
  glow = false,
  priority = false,
}: BrandLogoProps) {
  const isCustomRounded = className.includes("rounded-");
  const roundedClass = isCustomRounded ? "" : "rounded-2xl";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-[#09090b] ${roundedClass} ${
        glow ? "shadow-[0_0_20px_rgba(204,255,0,0.35)] ring-1 ring-[#ccff00]/40" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/seestock-logo.png"
        alt="SeeStocks Logo"
        width={size}
        height={size}
        priority={priority}
        className="w-full h-full object-cover select-none"
      />
    </div>
  );
}
