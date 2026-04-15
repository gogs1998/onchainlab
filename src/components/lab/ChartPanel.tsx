"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, LineSeries } from "lightweight-charts";
import { metricCatalog } from "@/lib/metrics";
import { getZoneLines } from "@/lib/signals";

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

export interface ChartPanelProps {
  metricKey: string;
  label: string;
  data: { date: string; value: number }[];
  priceData?: { date: string; value: number }[];
  onRemove: () => void;
}

export default function ChartPanel({
  metricKey,
  label,
  data,
  priceData,
  onRemove,
}: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPrice, setShowPrice] = useState(false);
  const [logScale, setLogScale] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [showZones, setShowZones] = useState(true);

  const description =
    metricCatalog.find((m) => m.key === metricKey)?.description ?? "";

  const isBtcPrice = metricKey === "btc_price";

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
        mode: logScale ? 1 : 0,
      },
      timeScale: {
        borderColor: "#27272a",
        timeVisible: false,
      },
    });

    // Main metric series
    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: color,
      priceLineVisible: false,
    });

    series.setData(
      data.map((d) => ({ time: d.date as string, value: d.value }))
    );

    // Signal zone lines
    if (showZones) {
      const zoneLines = getZoneLines(metricKey);
      for (const zl of zoneLines) {
        series.createPriceLine({
          price: zl.value,
          color: zl.color,
          lineWidth: 1,
          lineStyle: zl.lineStyle,
          axisLabelVisible: false,
          title: zl.label,
        });
      }
    }

    // BTC price overlay (right scale, semi-transparent)
    if (showPrice && !isBtcPrice && priceData && priceData.length > 0) {
      const priceSeries = chart.addSeries(LineSeries, {
        color: "rgba(251,191,36,0.35)",
        lineWidth: 1,
        crosshairMarkerRadius: 0,
        priceLineVisible: false,
        priceScaleId: "price-overlay",
        lastValueVisible: false,
      });
      priceSeries.setData(
        priceData.map((d) => ({ time: d.date as string, value: d.value }))
      );
      chart.priceScale("price-overlay").applyOptions({
        scaleMargins: { top: 0.1, bottom: 0.1 },
        borderVisible: false,
        visible: false,
      });
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) chart.applyOptions({ width });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [metricKey, data, priceData, showPrice, logScale, showZones, isBtcPrice]);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] shadow-lg shadow-black/20">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/40 px-4 py-2">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colorForKey(metricKey) }}
          />
          <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold tracking-wide text-zinc-200">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Info toggle */}
          {description && (
            <button
              onClick={() => setShowDesc((p) => !p)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                showDesc
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-400"
              }`}
              title="Show metric info"
            >
              i
            </button>
          )}
          {/* Zone lines toggle */}
          {getZoneLines(metricKey).length > 0 && (
            <button
              onClick={() => setShowZones((p) => !p)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                showZones
                  ? "bg-green-500/15 text-green-400"
                  : "text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-400"
              }`}
              title="Toggle signal zones"
            >
              Z
            </button>
          )}
          {/* Log toggle */}
          <button
            onClick={() => setLogScale((p) => !p)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              logScale
                ? "bg-purple-500/15 text-purple-400"
                : "text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-400"
            }`}
            title="Toggle logarithmic scale"
          >
            LOG
          </button>
          {/* Price overlay toggle */}
          {!isBtcPrice && priceData && (
            <button
              onClick={() => setShowPrice((p) => !p)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                showPrice
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-400"
              }`}
              title="Toggle BTC price overlay"
            >
              BTC
            </button>
          )}
          {/* Remove */}
          <button
            onClick={onRemove}
            className="rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Description panel */}
      {showDesc && description && (
        <div className="border-b border-zinc-800/40 bg-zinc-900/50 px-4 py-2">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>
      )}

      {/* Chart container */}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
