"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";
import { getMetricSeries } from "@/lib/data";
import type { MetricRow } from "@/lib/types";
import type { MetricMeta } from "@/lib/types";

const COLORS = [
  "#3b82f6", "#22c55e", "#a78bfa", "#f59e0b", "#ec4899",
  "#06b6d4", "#ef4444", "#14b8a6", "#f97316", "#6366f1",
];

interface CompareChartProps {
  metricKeys: string[];
  data: MetricRow[];
  catalogMap: Map<string, MetricMeta>;
}

/**
 * Normalize a series to 0–100 percentile range for fair comparison.
 */
function normalize(
  series: { date: string; value: number }[],
): { date: string; value: number }[] {
  if (series.length === 0) return [];
  const values = series.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return series.map((s) => ({
    date: s.date,
    value: ((s.value - min) / range) * 100,
  }));
}

export default function CompareChart({
  metricKeys,
  data,
  catalogMap,
}: CompareChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0 || metricKeys.length === 0)
      return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 500,
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
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: "#27272a",
        timeVisible: false,
      },
    });

    for (let i = 0; i < metricKeys.length; i++) {
      const key = metricKeys[i];
      const color = COLORS[i % COLORS.length];
      const raw = getMetricSeries(data, key);
      const norm = normalize(raw);
      if (norm.length === 0) continue;

      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        crosshairMarkerRadius: 3,
        crosshairMarkerBackgroundColor: color,
        priceLineVisible: false,
        lastValueVisible: true,
        title: catalogMap.get(key)?.label ?? key,
      });

      series.setData(
        norm.map((d) => ({ time: d.date as string, value: d.value })),
      );
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
  }, [metricKeys, data, catalogMap]);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] shadow-lg shadow-black/20">
      <div className="flex items-center justify-between border-b border-zinc-800/40 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold tracking-wide text-zinc-200">
            Compare Mode
          </span>
          <span className="text-[10px] text-zinc-600">
            (normalized 0–100)
          </span>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {metricKeys.map((key, i) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-[10px] text-zinc-400">
                {catalogMap.get(key)?.label ?? key}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
