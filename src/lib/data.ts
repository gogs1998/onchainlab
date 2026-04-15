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
