"use client";

import { useMemo, useState, useCallback } from "react";
import { useMetrics } from "@/components/DataProvider";
import { metricCatalog, categoryLabels } from "@/lib/metrics";
import type { MetricRow } from "@/lib/types";

/* ── Pearson correlation ─────────────────────────────────── */

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 30) return null;
  const n = xs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }
  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denom === 0) return null;
  return (n * sumXY - sumX * sumY) / denom;
}

/* ── Build correlation matrix ────────────────────────────── */

function buildCorrelationMatrix(
  data: MetricRow[],
  keys: string[],
): { matrix: (number | null)[][]; keys: string[] } {
  // Extract column arrays (only rows where both values are non-null for each pair)
  const columns: Map<string, number[][]> = new Map();
  const rawCols: Map<string, (number | null)[]> = new Map();

  for (const k of keys) {
    const col: (number | null)[] = data.map((row) => {
      const v = row[k];
      return typeof v === "number" && !Number.isNaN(v) ? v : null;
    });
    rawCols.set(k, col);
  }

  const n = keys.length;
  const matrix: (number | null)[][] = Array.from({ length: n }, () =>
    Array(n).fill(null),
  );

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1; // self correlation
    const colI = rawCols.get(keys[i])!;
    for (let j = i + 1; j < n; j++) {
      const colJ = rawCols.get(keys[j])!;
      // Paired non-null values
      const xs: number[] = [];
      const ys: number[] = [];
      for (let r = 0; r < data.length; r++) {
        if (colI[r] !== null && colJ[r] !== null) {
          xs.push(colI[r]!);
          ys.push(colJ[r]!);
        }
      }
      const corr = pearson(xs, ys);
      matrix[i][j] = corr;
      matrix[j][i] = corr;
    }
  }

  return { matrix, keys };
}

/* ── Color for correlation value ─────────────────────────── */

function corrColor(v: number | null): string {
  if (v === null) return "#1f1f23";
  // Blue (-1) → white (0) → red (+1)
  const abs = Math.abs(v);
  if (v > 0) {
    const r = Math.round(239 + (255 - 239) * (1 - abs));
    const g = Math.round(68 + (255 - 68) * (1 - abs));
    const b = Math.round(68 + (255 - 68) * (1 - abs));
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(59 + (255 - 59) * (1 - abs));
  const g = Math.round(130 + (255 - 130) * (1 - abs));
  const b = Math.round(246 + (255 - 246) * (1 - abs));
  return `rgb(${r},${g},${b})`;
}

/* ── Page ─────────────────────────────────────────────────── */

export default function CorrelationsPage() {
  const { data, loading } = useMetrics();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);
  const [sortByCorr, setSortByCorr] = useState<string | null>(null);

  // Filter metrics by category
  const filteredKeys = useMemo(() => {
    const keys = metricCatalog
      .filter((m) => m.key !== "btc_price" && m.key !== "market_cap" && m.key !== "realized_cap")
      .filter((m) => selectedCategory === "all" || m.category === selectedCategory)
      .map((m) => m.key);
    return keys.length <= 30 ? keys : keys.slice(0, 30); // Cap for readability
  }, [selectedCategory]);

  const corrData = useMemo(
    () => (data.length > 0 ? buildCorrelationMatrix(data, filteredKeys) : null),
    [data, filteredKeys],
  );

  // Top correlations with BTC price
  const topCorrelations = useMemo(() => {
    if (data.length === 0) return [];
    const priceCol = data.map((r) =>
      typeof r.btc_price === "number" && !Number.isNaN(r.btc_price) ? r.btc_price : null,
    );
    const results: { key: string; label: string; corr: number }[] = [];
    for (const m of metricCatalog) {
      if (m.key === "btc_price" || m.key === "market_cap") continue;
      const mCol = data.map((r) => {
        const v = r[m.key];
        return typeof v === "number" && !Number.isNaN(v) ? v : null;
      });
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i < data.length; i++) {
        if (priceCol[i] !== null && mCol[i] !== null) {
          xs.push(priceCol[i]!);
          ys.push(mCol[i]!);
        }
      }
      const c = pearson(xs, ys);
      if (c !== null) results.push({ key: m.key, label: m.label, corr: c });
    }
    results.sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
    return results.slice(0, 10);
  }, [data]);

  const labelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of metricCatalog) map.set(m.key, m.label);
    return map;
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const categories = Object.entries(categoryLabels);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Correlations Explorer
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Discover relationships between on-chain metrics. Click a cell for details.
        </p>
      </div>

      {/* Top correlations with BTC price */}
      <div className="mb-8 rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-5 shadow-lg shadow-black/20">
        <h2 className="mb-3 font-[family-name:var(--font-mono)] text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
          Strongest Correlations with BTC Price
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {topCorrelations.map((t) => {
            const isPositive = t.corr > 0;
            return (
              <div
                key={t.key}
                className="rounded-lg border border-zinc-800/40 bg-zinc-900/50 p-3"
              >
                <p className="text-[11px] font-medium text-zinc-400 truncate">
                  {t.label}
                </p>
                <p
                  className="mt-1 text-lg font-bold font-mono"
                  style={{ color: isPositive ? "#ef4444" : "#3b82f6" }}
                >
                  {t.corr > 0 ? "+" : ""}
                  {t.corr.toFixed(3)}
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.abs(t.corr) * 100}%`,
                      backgroundColor: isPositive ? "#ef4444" : "#3b82f6",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-zinc-800/50 text-zinc-400 hover:text-white"
          }`}
        >
          All
        </button>
        {categories.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === key
                ? "bg-blue-600 text-white"
                : "bg-zinc-800/50 text-zinc-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Heatmap */}
      {corrData && corrData.keys.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-4 shadow-lg shadow-black/20">
          <div className="min-w-max">
            {/* Header row */}
            <div className="flex">
              <div className="w-28 shrink-0" />
              {corrData.keys.map((k) => (
                <div
                  key={k}
                  className="flex w-10 shrink-0 items-end justify-center pb-1"
                  title={labelMap.get(k) ?? k}
                >
                  <span
                    className="block origin-bottom-left -rotate-45 whitespace-nowrap text-[9px] text-zinc-500"
                    style={{ width: "10px" }}
                  >
                    {(labelMap.get(k) ?? k).slice(0, 8)}
                  </span>
                </div>
              ))}
            </div>
            {/* Rows */}
            {corrData.keys.map((rowKey, i) => (
              <div key={rowKey} className="flex items-center">
                <div
                  className="w-28 shrink-0 truncate pr-2 text-right text-[10px] text-zinc-400"
                  title={labelMap.get(rowKey) ?? rowKey}
                >
                  {(labelMap.get(rowKey) ?? rowKey).slice(0, 14)}
                </div>
                {corrData.keys.map((colKey, j) => {
                  const val = corrData.matrix[i][j];
                  const isHovered =
                    hoveredCell?.i === i && hoveredCell?.j === j;
                  return (
                    <div
                      key={colKey}
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center transition-transform"
                      style={{
                        backgroundColor: corrColor(val),
                        transform: isHovered ? "scale(1.3)" : "scale(1)",
                        zIndex: isHovered ? 10 : 1,
                        border: isHovered ? "2px solid white" : "1px solid rgba(0,0,0,0.2)",
                      }}
                      onMouseEnter={() => setHoveredCell({ i, j })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${labelMap.get(rowKey)} × ${labelMap.get(colKey)}: ${val !== null ? val.toFixed(3) : "N/A"}`}
                    >
                      {corrData.keys.length <= 15 && val !== null && (
                        <span className="text-[8px] font-bold text-white mix-blend-difference">
                          {val.toFixed(1)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[10px] text-zinc-500">−1</span>
            <div
              className="h-3 w-40 rounded-full"
              style={{
                background: "linear-gradient(to right, #3b82f6, #ffffff, #ef4444)",
              }}
            />
            <span className="text-[10px] text-zinc-500">+1</span>
          </div>

          {/* Hovered cell detail */}
          {hoveredCell && (
            <div className="mt-3 text-center text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">
                {labelMap.get(corrData.keys[hoveredCell.i]) ?? corrData.keys[hoveredCell.i]}
              </span>
              {" × "}
              <span className="font-semibold text-zinc-300">
                {labelMap.get(corrData.keys[hoveredCell.j]) ?? corrData.keys[hoveredCell.j]}
              </span>
              {" = "}
              <span className="font-mono font-bold" style={{
                color: corrData.matrix[hoveredCell.i][hoveredCell.j] !== null
                  ? corrData.matrix[hoveredCell.i][hoveredCell.j]! > 0 ? "#ef4444" : "#3b82f6"
                  : "#6b7280",
              }}>
                {corrData.matrix[hoveredCell.i][hoveredCell.j]?.toFixed(4) ?? "N/A"}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-8 text-center text-sm text-zinc-500">
          No data available for this category.
        </div>
      )}
    </div>
  );
}
