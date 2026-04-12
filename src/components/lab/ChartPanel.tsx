"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

/** Assign a stable color per metric key. */
const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#a78bfa",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CHART_COLORS[Math.abs(hash) % CHART_COLORS.length];
}

interface ChartPanelProps {
  metricKey: string;
  label: string;
  data: { date: string; value: number }[];
  onRemove: () => void;
}

export default function ChartPanel({
  metricKey,
  label,
  data,
  onRemove,
}: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const color = colorForKey(metricKey);

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 320,
      layout: {
        background: { color: "#1a1a2e" },
        textColor: "#a1a1aa",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      crosshair: {
        vertLine: { color: "#3b82f680", width: 1, labelBackgroundColor: "#3b82f6" },
        horzLine: { color: "#3b82f680", width: 1, labelBackgroundColor: "#3b82f6" },
      },
      rightPriceScale: {
        borderColor: "#27272a",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "#27272a",
        timeVisible: false,
      },
    });

    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: color,
      priceLineVisible: false,
    });

    series.setData(
      data.map((d) => ({
        time: d.date as string,
        value: d.value,
      }))
    );

    chart.timeScale().fitContent();

    // Resize observer for layout-driven and window resizes
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        chart.applyOptions({ width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [metricKey, data]);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] shadow-lg shadow-black/20">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/40 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colorForKey(metricKey) }}
          />
          <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold tracking-wide text-zinc-200">
            {label}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          Remove
        </button>
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
