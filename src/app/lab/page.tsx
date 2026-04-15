"use client";

import { useState, useMemo } from "react";
import { useMetrics } from "@/components/DataProvider";
import { getMetricSeries } from "@/lib/data";
import { metricCatalog } from "@/lib/metrics";
import MetricSelector from "@/components/lab/MetricSelector";
import ChartPanel from "@/components/lab/ChartPanel";

const DEFAULT_METRICS = ["btc_price", "mvrv_zscore"];

type TimeRange = "7d" | "1m" | "3m" | "6m" | "1y" | "2y" | "all";
const RANGES: { key: TimeRange; label: string; days: number | null }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "1m", label: "1M", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
  { key: "1y", label: "1Y", days: 365 },
  { key: "2y", label: "2Y", days: 730 },
  { key: "all", label: "ALL", days: null },
];

export default function LabPage() {
  const { data } = useMetrics();
  const [selectedMetrics, setSelectedMetrics] =
    useState<string[]>(DEFAULT_METRICS);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const catalogMap = useMemo(() => {
    const map = new Map<string, (typeof metricCatalog)[number]>();
    for (const m of metricCatalog) map.set(m.key, m);
    return map;
  }, []);

  const rangeDays = RANGES.find((r) => r.key === timeRange)?.days ?? null;
  const slicedData = useMemo(
    () => (rangeDays ? data.slice(-rangeDays) : data),
    [data, rangeDays],
  );

  // Pre-compute BTC price series for overlay (once, using sliced data)
  const priceData = useMemo(
    () => getMetricSeries(slicedData, "btc_price"),
    [slicedData],
  );

  const handleToggle = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="flex" style={{ height: "calc(100vh - 57px)" }}>
      {/* Sidebar */}
      <MetricSelector selected={selectedMetrics} onToggle={handleToggle} />

      {/* Chart area */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)] p-4 xl:p-6">
        {/* Time range selector */}
        <div className="mb-4 flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setTimeRange(r.key)}
              className={`rounded-md px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors ${
                timeRange === r.key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {selectedMetrics.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
                <svg
                  className="h-7 w-7 text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">
                Select a metric from the sidebar to start charting
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {selectedMetrics.map((key) => {
              const meta = catalogMap.get(key);
              if (!meta) return null;
              const series = getMetricSeries(slicedData, key);
              return (
                <ChartPanel
                  key={key}
                  metricKey={key}
                  label={meta.label}
                  data={series}
                  priceData={priceData}
                  onRemove={() => handleToggle(key)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
