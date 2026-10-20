"use client";

import React, { useState, useMemo, useRef } from "react";
import type { HistoryPoint } from "@/lib/stocks";

interface InteractiveChartProps {
  points: HistoryPoint[];
  symbol?: string;
  isDelayed?: boolean;
}

export default function InteractiveChart({ points, symbol = "MSFT" }: InteractiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Compute price bounds
  const { minPrice, maxPrice, yLabels, samplePoints } = useMemo(() => {
    if (!points || points.length === 0) {
      // Demo fallback points if empty
      const demo: HistoryPoint[] = [
        { date: "2026-08-01", open: 180, high: 210, low: 175, close: 200, volume: 1000 },
        { date: "2026-08-15", open: 200, high: 255, low: 195, close: 250, volume: 1000 },
        { date: "2026-09-01", open: 250, high: 252, low: 190, close: 195, volume: 1000 },
        { date: "2026-09-15", open: 195, high: 220, low: 190, close: 215, volume: 1000 },
        { date: "2026-10-01", open: 215, high: 220, low: 170, close: 175, volume: 1000 },
        { date: "2026-10-15", open: 175, high: 240, low: 170, close: 235, volume: 1000 },
        { date: "2026-11-01", open: 235, high: 285, low: 230, close: 280, volume: 1000 },
      ];
      return {
        minPrice: 160,
        maxPrice: 280,
        yLabels: [260, 240, 220, 200, 180, 160],
        samplePoints: demo,
      };
    }

    const closes = points.map((p) => p.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const padding = (max - min) * 0.12 || 5;
    const floor = Math.floor((min - padding) / 10) * 10;
    const ceil = Math.ceil((max + padding) / 10) * 10;

    // Generate 5 evenly spaced Y axis tick marks
    const step = (ceil - floor) / 5;
    const labels = [
      Math.round(ceil),
      Math.round(ceil - step),
      Math.round(ceil - step * 2),
      Math.round(ceil - step * 3),
      Math.round(ceil - step * 4),
      Math.round(floor),
    ];

    return {
      minPrice: floor,
      maxPrice: ceil,
      yLabels: labels,
      samplePoints: points,
    };
  }, [points]);

  // Chart coordinate mapping (viewBox 0 0 600 320)
  const chartWidth = 520;
  const chartHeight = 260;
  const offsetX = 20;
  const offsetY = 20;

  const chartCoords = useMemo(() => {
    const total = samplePoints.length;
    if (total <= 1) return [];

    return samplePoints.map((pt, i) => {
      const x = offsetX + (i / (total - 1)) * chartWidth;
      const range = maxPrice - minPrice || 1;
      const normalizedY = (pt.close - minPrice) / range;
      const y = offsetY + chartHeight - normalizedY * chartHeight;
      return { x, y, point: pt, index: i };
    });
  }, [samplePoints, minPrice, maxPrice, chartHeight, chartWidth]);

  // Build SVG bezier path
  const pathD = useMemo(() => {
    if (chartCoords.length < 2) return "";
    let d = `M ${chartCoords[0].x} ${chartCoords[0].y}`;
    for (let i = 0; i < chartCoords.length - 1; i++) {
      const curr = chartCoords[i];
      const next = chartCoords[i + 1];
      const cpx = (curr.x + next.x) / 2;
      d += ` C ${cpx} ${curr.y}, ${cpx} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  }, [chartCoords]);

  // Gradient area path
  const areaD = useMemo(() => {
    if (chartCoords.length < 2) return "";
    const first = chartCoords[0];
    const last = chartCoords[chartCoords.length - 1];
    const bottom = offsetY + chartHeight;
    return `${pathD} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }, [pathD, chartCoords, chartHeight]);

  // Active hover point (default to last point or hovered point)
  const activeCoord = useMemo(() => {
    if (chartCoords.length === 0) return null;
    if (hoverIndex !== null && chartCoords[hoverIndex]) {
      return chartCoords[hoverIndex];
    }
    return chartCoords[Math.floor(chartCoords.length * 0.72)] || chartCoords[chartCoords.length - 1];
  }, [hoverIndex, chartCoords]);

  // Handle pointer tracking
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - 20) / (svgRect.width - 60)));
    const targetIdx = Math.round(ratio * (chartCoords.length - 1));
    if (targetIdx >= 0 && targetIdx < chartCoords.length) {
      setHoverIndex(targetIdx);
    }
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  // Generate 5 readable date labels for X-axis
  const xLabels = useMemo(() => {
    if (samplePoints.length < 3) return ["Aug", "Sept", "Oct", "Nov", "Dec"];
    const indices = [
      0,
      Math.floor(samplePoints.length * 0.25),
      Math.floor(samplePoints.length * 0.5),
      Math.floor(samplePoints.length * 0.75),
      samplePoints.length - 1,
    ];
    return indices.map((idx) => {
      const rawDate = samplePoints[idx]?.date;
      if (!rawDate) return "";
      try {
        const d = new Date(rawDate);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } catch {
        return rawDate;
      }
    });
  }, [samplePoints]);

  return (
    <div ref={containerRef} className="relative w-full bg-white rounded-3xl p-5 shadow-xs border border-slate-100">
      {/* SVG Canvas */}
      <div className="relative w-full aspect-[16/9] min-h-[260px]">
        <svg
          viewBox="0 0 600 320"
          className="w-full h-full cursor-crosshair select-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines */}
          {yLabels.map((price, idx) => {
            const range = maxPrice - minPrice || 1;
            const y = offsetY + chartHeight - ((price - minPrice) / range) * chartHeight;
            return (
              <g key={`grid-y-${idx}`}>
                <line
                  x1={offsetX}
                  y1={y}
                  x2={offsetX + chartWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                {/* Y-axis label */}
                <text
                  x={offsetX + chartWidth + 12}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="12"
                  fontFamily="inherit"
                  textAnchor="start"
                >
                  {price}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Trendline */}
          <path
            d={pathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Active Hover Crosshair Line */}
          {activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={offsetY}
                x2={activeCoord.x}
                y2={offsetY + chartHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <line
                x1={offsetX}
                y1={activeCoord.y}
                x2={offsetX + chartWidth}
                y2={activeCoord.y}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />

              {/* Glowing Tracking Dot */}
              <circle cx={activeCoord.x} cy={activeCoord.y} r="6" fill="#06b6d4" />
              <circle cx={activeCoord.x} cy={activeCoord.y} r="3" fill="#ffffff" />
            </g>
          )}

          {/* X Axis Bottom Line */}
          <line
            x1={offsetX}
            y1={offsetY + chartHeight}
            x2={offsetX + chartWidth}
            y2={offsetY + chartHeight}
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />

          {/* X-axis date labels */}
          {xLabels.map((lbl, idx) => {
            const x = offsetX + (idx / (xLabels.length - 1)) * chartWidth;
            return (
              <text
                key={`x-${idx}`}
                x={x}
                y={offsetY + chartHeight + 24}
                fill="#94a3b8"
                fontSize="12"
                fontFamily="inherit"
                textAnchor="middle"
              >
                {lbl}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip Pill (matching reference black card with Open/Close) */}
        {activeCoord && (
          <div
            className="absolute pointer-events-none transition-all duration-100 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(activeCoord.x / 600) * 100}%`,
              top: `${Math.max(20, (activeCoord.y / 320) * 100 - 8)}%`,
            }}
          >
            <div className="bg-[#121214] text-white rounded-2xl px-3.5 py-2.5 shadow-xl border border-slate-700/50 text-xs min-w-[130px]">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Open ▲</span>
                <span className="font-semibold text-white ml-2">
                  ${activeCoord.point.open ? activeCoord.point.open.toFixed(2) : activeCoord.point.close.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Close ▼</span>
                <span className="font-semibold text-white ml-2">
                  ${activeCoord.point.close.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
