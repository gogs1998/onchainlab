"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useMetrics } from "@/components/DataProvider";
import { getMetricSeries, getLatestValue, getMetricZScore } from "@/lib/data";
import { metricCatalog, categoryLabels } from "@/lib/metrics";
import { getSignalZone, getSignalColor } from "@/lib/signals";
import ChartPanel from "@/components/lab/ChartPanel";

interface MetricPageClientProps {
  metricKey: string;
}

export default function MetricPageClient({ metricKey }: MetricPageClientProps) {
  const { data } = useMetrics();

  const meta = useMemo(
    () => metricCatalog.find((m) => m.key === metricKey),
    [metricKey],
  );

  const series = useMemo(
    () => getMetricSeries(data, metricKey),
    [data, metricKey],
  );

  const priceData = useMemo(
    () => getMetricSeries(data, "btc_price"),
    [data],
  );

  const latestValue = useMemo(
    () => getLatestValue(data, metricKey),
    [data, metricKey],
  );

  const zscore = useMemo(
    () => getMetricZScore(data, metricKey),
    [data, metricKey],
  );

  const zone = getSignalZone(metricKey, latestValue?.value ?? null);

  if (!meta) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-300">Metric not found</h1>
        <p className="mt-2 text-zinc-500">
          No metric matching &ldquo;{metricKey}&rdquo;
        </p>
        <Link href="/lab" className="mt-4 inline-block text-blue-400 hover:underline">
          Go to Lab →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-[12px] text-zinc-600">
        <Link href="/overview" className="hover:text-zinc-400">Dashboard</Link>
        <span>/</span>
        <Link href="/lab" className="hover:text-zinc-400">Lab</Link>
        <span>/</span>
        <span className="text-zinc-400">{meta.label}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {meta.label}
          </h1>
          {zone && (
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: getSignalColor(zone) }}
              title={`Signal: ${zone}`}
            />
          )}
        </div>
        <p className="mt-1 text-[12px] uppercase tracking-wider text-zinc-500">
          {categoryLabels[meta.category]}
        </p>
      </div>

      {/* Description */}
      <div className="mb-6 rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] p-4">
        <p className="text-sm leading-relaxed text-zinc-400">
          {meta.description}
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Current Value</p>
          <p className="mt-1 font-mono text-lg font-bold text-zinc-200">
            {latestValue?.value != null
              ? meta.unit === "USD"
                ? `$${latestValue.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : latestValue.value.toFixed(4)
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">As of</p>
          <p className="mt-1 font-mono text-sm text-zinc-300">
            {latestValue?.date ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Z-Score</p>
          <p className={`mt-1 font-mono text-lg font-bold ${
            zscore != null && Math.abs(zscore) > 2 ? "text-red-400" : "text-zinc-200"
          }`}>
            {zscore != null ? `${zscore > 0 ? "+" : ""}${zscore.toFixed(2)}σ` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] p-3">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Signal</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: getSignalColor(zone) }}>
            {zone ? zone.charAt(0).toUpperCase() + zone.slice(1) : "No threshold"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ChartPanel
          metricKey={metricKey}
          label={meta.label}
          data={series}
          priceData={priceData}
          onRemove={() => {}}
        />
      </div>

      {/* Data span */}
      <div className="flex items-center justify-between text-[11px] text-zinc-600">
        <span>
          Data points: {series.length.toLocaleString()} rows,{" "}
          {series.length > 0 ? series[0].date : "—"} to{" "}
          {series.length > 0 ? series[series.length - 1].date : "—"}
        </span>
        <Link
          href={`/lab?m=${metricKey}`}
          className="text-blue-400 hover:underline"
        >
          Open in Lab →
        </Link>
      </div>
    </div>
  );
}
