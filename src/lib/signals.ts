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
  reserve_risk: {
    green: (v) => v < 0.005,
    yellow: (v) => v >= 0.005 && v <= 0.02,
    red: (v) => v > 0.02,
  },
  puell_multiple: {
    green: (v) => v < 0.5,
    yellow: (v) => v >= 0.5 && v <= 4,
    red: (v) => v > 4,
  },
  rsi_14: {
    green: (v) => v > 50 && v < 70,
    yellow: (v) => v >= 30 && v <= 50,
    red: (v) => v < 30 || v >= 70,
  },
  supply_in_profit_pct: {
    green: (v) => v > 0.7,
    yellow: (v) => v >= 0.4 && v <= 0.7,
    red: (v) => v < 0.4,
  },
};

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

export function getSignalColor(zone: SignalZone | null): string {
  if (zone === null) return "#6b7280";
  return signalColors[zone] ?? "#6b7280";
}
