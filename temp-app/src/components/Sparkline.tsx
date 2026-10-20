import React from "react";

interface SparklineProps {
  data?: number[];
  isPositive?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export default function Sparkline({
  data,
  isPositive = true,
  width = 68,
  height = 32,
  className = "",
}: SparklineProps) {
  // Default wave coordinates if data not provided
  const points = data && data.length >= 2 ? data : isPositive ? [10, 18, 12, 22, 16, 26, 28] : [26, 22, 24, 16, 18, 12, 8];

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  // Construct smooth bezier curve path
  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const curr = coords[i];
    const next = coords[i + 1];
    const cpx = (curr.x + next.x) / 2;
    pathD += ` C ${cpx} ${curr.y}, ${cpx} ${next.y}, ${next.x} ${next.y}`;
  }

  const strokeColor = isPositive ? "#10b981" : "#f43f5e";

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        <path
          d={pathD}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
