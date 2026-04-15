"use client";

import { useMemo, useEffect, useRef } from "react";
import { useMetrics } from "@/components/DataProvider";
import { getMetricSeries } from "@/lib/data";
import { createChart, LineSeries } from "lightweight-charts";

/* ── Bitcoin halving dates ────────────────────────────────── */

const HALVINGS = [
  { label: "Halving 1", date: "2012-11-28", color: "#3b82f6" },
  { label: "Halving 2", date: "2016-07-09", color: "#22c55e" },
  { label: "Halving 3", date: "2020-05-11", color: "#a78bfa" },
  { label: "Halving 4", date: "2024-04-19", color: "#f59e0b" },
];

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Build an aligned series: day 0 = halving, values = % change from halving price.
 */
function buildCycleSeries(
  priceData: { date: string; value: number }[],
  halvingDate: string,
): { time: string; value: number }[] {
  // Find price on halving day (or closest after)
  const halvingTs = new Date(halvingDate).getTime();
  let halvingPrice: number | null = null;
  let startIdx = -1;

  for (let i = 0; i < priceData.length; i++) {
    if (new Date(priceData[i].date).getTime() >= halvingTs) {
      halvingPrice = priceData[i].value;
      startIdx = i;
      break;
    }
  }
  if (halvingPrice === null || startIdx === -1) return [];

  const result: { time: string; value: number }[] = [];
  for (let i = startIdx; i < priceData.length; i++) {
    const day = daysBetween(halvingDate, priceData[i].date);
    // Use day number as fake date (YYYY-MM-DD format for lightweight-charts)
    // We'll encode day number as the value and show as day offset
    result.push({
      time: priceData[i].date,
      value: ((priceData[i].value - halvingPrice) / halvingPrice) * 100,
    });
  }
  return result;
}

export default function CyclesPage() {
  const { data } = useMetrics();
  const fullChartRef = useRef<HTMLDivElement>(null);
  const alignedChartRef = useRef<HTMLDivElement>(null);

  const priceData = useMemo(
    () => getMetricSeries(data, "btc_price"),
    [data],
  );

  // Full price chart with halving markers
  useEffect(() => {
    if (!fullChartRef.current || priceData.length === 0) return;

    const chart = createChart(fullChartRef.current, {
      width: fullChartRef.current.clientWidth,
      height: 350,
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
      rightPriceScale: {
        borderColor: "#27272a",
        mode: 1, // logarithmic
      },
      timeScale: { borderColor: "#27272a" },
    });

    const series = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
      priceLineVisible: false,
    });
    series.setData(
      priceData.map((d) => ({ time: d.date as string, value: d.value })),
    );

    // Halving markers — draw colored vertical price lines at halving prices
    for (const h of HALVINGS) {
      const entry = priceData.find(
        (p) => new Date(p.date).getTime() >= new Date(h.date).getTime(),
      );
      if (entry) {
        series.createPriceLine({
          price: entry.value,
          color: h.color,
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: false,
          title: h.label,
        });
      }
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) chart.applyOptions({ width });
    });
    ro.observe(fullChartRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [priceData]);

  // Aligned cycle performance chart
  useEffect(() => {
    if (!alignedChartRef.current || priceData.length === 0) return;

    const chart = createChart(alignedChartRef.current, {
      width: alignedChartRef.current.clientWidth,
      height: 400,
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
      rightPriceScale: { borderColor: "#27272a" },
      timeScale: { borderColor: "#27272a" },
    });

    for (const halving of HALVINGS) {
      const cycleSeries = buildCycleSeries(priceData, halving.date);
      if (cycleSeries.length === 0) continue;

      const series = chart.addSeries(LineSeries, {
        color: halving.color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: halving.label,
      });
      series.setData(cycleSeries);
    }

    // Zero line
    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) chart.applyOptions({ width });
    });
    ro.observe(alignedChartRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [priceData]);

  // Current cycle stats
  const cycleStats = useMemo(() => {
    if (priceData.length === 0) return [];
    const latestDate = priceData[priceData.length - 1].date;
    const latestPrice = priceData[priceData.length - 1].value;

    return HALVINGS.map((h) => {
      const daysElapsed = daysBetween(h.date, latestDate);
      // Find halving price
      let halvingPrice = 0;
      for (const p of priceData) {
        if (new Date(p.date).getTime() >= new Date(h.date).getTime()) {
          halvingPrice = p.value;
          break;
        }
      }
      const pctChange = halvingPrice
        ? ((latestPrice - halvingPrice) / halvingPrice) * 100
        : 0;
      return { ...h, daysElapsed, halvingPrice, pctChange };
    });
  }, [priceData]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Cycle Position
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Bitcoin price performance relative to each halving epoch
        </p>
      </div>

      {/* Cycle stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cycleStats.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-[12px] font-semibold text-zinc-300">
                {c.label}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">{c.date}</p>
            <p className="mt-1 font-mono text-sm text-zinc-300">
              Day {c.daysElapsed.toLocaleString()}
            </p>
            <p
              className={`mt-1 font-mono text-sm font-bold ${
                c.pctChange >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {c.pctChange >= 0 ? "+" : ""}
              {c.pctChange.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>

      {/* Full price history */}
      <div className="mb-6 overflow-hidden rounded-lg border border-zinc-800/60 bg-[var(--bg-card)]">
        <div className="border-b border-zinc-800/40 px-4 py-2.5">
          <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold tracking-wide text-zinc-200">
            BTC Price — Full History (Log Scale)
          </span>
          <span className="ml-2 text-[10px] text-zinc-600">
            Arrows mark halvings
          </span>
        </div>
        <div ref={fullChartRef} className="w-full" />
      </div>

      {/* Aligned cycle chart */}
      <div className="overflow-hidden rounded-lg border border-zinc-800/60 bg-[var(--bg-card)]">
        <div className="border-b border-zinc-800/40 px-4 py-2.5">
          <span className="font-[family-name:var(--font-mono)] text-[12px] font-semibold tracking-wide text-zinc-200">
            Post-Halving Performance (% Change)
          </span>
          <span className="ml-2 text-[10px] text-zinc-600">
            Overlaid on same time axis
          </span>
        </div>
        <div ref={alignedChartRef} className="w-full" />
      </div>

      <p className="mt-4 text-[11px] text-zinc-600">
        Each cycle is measured from halving date. Current cycle (Halving 4) started April 19, 2024.
        The % change chart shows cumulative return from each halving&apos;s day-0 price.
      </p>
    </div>
  );
}
