import React from "react";

interface RippleWatermarkProps {
  className?: string;
  size?: number;
  strokeColor?: string;
}

export default function RippleWatermark({
  className = "absolute right-0 bottom-0 pointer-events-none opacity-20",
  size = 220,
  strokeColor = "#ffffff",
}: RippleWatermarkProps) {
  return (
    <div className={`overflow-hidden select-none ${className}`} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform translate-x-8 translate-y-8"
      >
        <circle cx="100" cy="100" r="20" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
        <circle cx="100" cy="100" r="40" stroke={strokeColor} strokeWidth="1.5" opacity="0.6" />
        <circle cx="100" cy="100" r="60" stroke={strokeColor} strokeWidth="1.5" opacity="0.7" />
        <circle cx="100" cy="100" r="80" stroke={strokeColor} strokeWidth="1.5" opacity="0.8" />
        <circle cx="100" cy="100" r="100" stroke={strokeColor} strokeWidth="1.5" opacity="0.6" />
        <circle cx="100" cy="100" r="120" stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
        <circle cx="100" cy="100" r="140" stroke={strokeColor} strokeWidth="1.5" opacity="0.25" />
      </svg>
    </div>
  );
}
