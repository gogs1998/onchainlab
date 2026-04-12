import type { SignalZone } from "./types";

interface ThresholdConfig {
  green: (v: number) => boolean;
  yellow: (v: number) => boolean;
  red: (v: number) => boolean;
}

const thresholds: Record<string, ThresholdConfig> = {
  nupl: {
    green: (v) => v > 0.5,
    yellow: (v) => v >= 0 && v <= 0.5,
    red: (v) => v < 0,
  },
  mvrv_zscore: {
    green: (v) => v < 2,
    yellow: (v) => v >= 2 && v <= 7,
    red: (v) => v > 7,
  },
  sopr: {
    green: (v) => v > 1.05,
    yellow: (v) => v >= 0.95 && v <= 1.05,
    red: (v) => v < 0.95,
  },
  mvrv: {
    green: (v) => v < 2,
    yellow: (v) => v >= 2 && v <= 3.5,
    red: (v) => v > 3.5,
  },
  drawdown_pct: {
    green: (v) => v > -0.1,
    yellow: (v) => v >= -0.3 && v <= -0.1,
    red: (v) => v < -0.3,
  },
  utxo_profit_share: {
    green: (v) => v > 0.7,
    yellow: (v) => v >= 0.4 && v <= 0.7,
    red: (v) => v < 0.4,
  },
};

/**
 * Determine the signal zone for a given metric and value.
 * Returns null if the metric is unknown or the value is null/undefined.
 */
export function getSignalZone(
  metric: string,
  value: number | null | undefined,
): SignalZone | null {
  if (value === null || value === undefined) return null;

  const config = thresholds[metric];
  if (!config) return null;

  if (config.green(value)) return "green";
  if (config.yellow(value)) return "yellow";
  if (config.red(value)) return "red";

  return null;
}

const signalColors: Record<SignalZone, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

/**
 * Map a signal zone to its hex color.
 * Returns a neutral gray for null/unknown zones.
 */
export function getSignalColor(zone: SignalZone | null): string {
  if (zone === null) return "#6b7280";
  return signalColors[zone] ?? "#6b7280";
}
