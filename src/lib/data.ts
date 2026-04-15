import Papa from "papaparse";
import type { MetricRow } from "./types";

let cachedData: MetricRow[] | null = null;

export async function loadMetrics(): Promise<MetricRow[]> {
  if (cachedData) return cachedData;

  const response = await fetch("/data/all_metrics.csv");
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status}`);
  }
  const csvText = await response.text();

  const parsed = Papa.parse<MetricRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.data.length === 0 || !parsed.data[0].date) {
    throw new Error("CSV is empty or malformed");
  }

  cachedData = parsed.data;
  return cachedData;
}

export function getLatestRow(data: MetricRow[]): MetricRow {
  if (data.length === 0) {
    throw new Error("No data available");
  }
  return data[data.length - 1];
}

/**
 * Walk backwards to find the most recent non-null value for a metric.
 * Returns the value and the date it came from.
 */
export function getLatestValue(
  data: MetricRow[],
  metric: string,
): { value: number; date: string } | null {
  for (let i = data.length - 1; i >= 0; i--) {
    const v = data[i][metric];
    if (v != null && typeof v === "number" && !Number.isNaN(v)) {
      return { value: v, date: data[i].date };
    }
  }
  return null;
}

export function getMetricSeries(
  data: MetricRow[],
  metric: string
): { date: string; value: number }[] {
  return data
    .filter((row) => row[metric] != null)
    .map((row) => ({
      date: row.date,
      value: row[metric] as number,
    }));
}

export function getLastNDays(data: MetricRow[], n: number): MetricRow[] {
  return data.slice(-n);
}

/**
 * Compute a simple z-score for the latest value of a metric
 * relative to its full history: (value - mean) / std.
 */
export function getMetricZScore(
  data: MetricRow[],
  metric: string,
): number | null {
  const values: number[] = [];
  for (const row of data) {
    const v = row[metric];
    if (v != null && typeof v === "number" && !Number.isNaN(v)) {
      values.push(v);
    }
  }
  if (values.length < 30) return null;
  const last = values[values.length - 1];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return null;
  return (last - mean) / std;
}

/**
 * Get the biggest 24h movers — metric with largest absolute change
 * between the last two data rows.
 */
export function getBiggestMovers(
  data: MetricRow[],
  metricKeys: string[],
  n = 5,
): { key: string; change: number; direction: "up" | "down" }[] {
  if (data.length < 2) return [];
  const prev = data[data.length - 2];
  const curr = data[data.length - 1];
  const movers: { key: string; change: number; direction: "up" | "down" }[] = [];

  for (const key of metricKeys) {
    const p = prev[key];
    const c = curr[key];
    if (
      p == null || c == null ||
      typeof p !== "number" || typeof c !== "number" ||
      Number.isNaN(p) || Number.isNaN(c) || p === 0
    ) continue;
    const pctChange = ((c - p) / Math.abs(p)) * 100;
    movers.push({
      key,
      change: pctChange,
      direction: pctChange >= 0 ? "up" : "down",
    });
  }

  movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  return movers.slice(0, n);
}
