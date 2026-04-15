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
  asopr: {
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
  price_200ma_ratio: {
    green: (v) => v > 1,
    yellow: (v) => v >= 0.75 && v <= 1,
    red: (v) => v < 0.75,
  },
  capitulation: {
    green: (v) => v === 0,
    yellow: (v) => false,
    red: (v) => v === 1,
  },
  euphoria: {
    green: (v) => v === 0,
    yellow: (v) => false,
    red: (v) => v === 1,
  },
  onchain_signal: {
    green: (v) => v > 0.6,
    yellow: (v) => v >= 0.4 && v <= 0.6,
    red: (v) => v < 0.4,
  },
  profit_ratio: {
    green: (v) => v > 0.6,
    yellow: (v) => v >= 0.4 && v <= 0.6,
    red: (v) => v < 0.4,
  },
  realized_pl_ratio: {
    green: (v) => v > 1.5,
    yellow: (v) => v >= 0.5 && v <= 1.5,
    red: (v) => v < 0.5,
  },
  accumulation_signal: {
    green: (v) => v > 0.5,
    yellow: (v) => v >= 0.2 && v <= 0.5,
    red: (v) => v < 0.2,
  },
  sth_sopr_proxy: {
    green: (v) => v > 1.02,
    yellow: (v) => v >= 0.98 && v <= 1.02,
    red: (v) => v < 0.98,
  },
  lth_sopr_proxy: {
    green: (v) => v > 1,
    yellow: (v) => v >= 0.9 && v <= 1,
    red: (v) => v < 0.9,
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

/* ── Zone lines for chart overlays ────────────────────────── */

export interface ZoneLine {
  value: number;
  color: string;
  lineStyle: number; // 0=solid, 1=dotted, 2=dashed
  label: string;
}

const zoneLineConfigs: Record<string, ZoneLine[]> = {
  nupl: [
    { value: 0, color: "#ef444480", lineStyle: 2, label: "Capitulation" },
    { value: 0.5, color: "#eab30880", lineStyle: 2, label: "Optimism" },
    { value: 0.75, color: "#ef444480", lineStyle: 2, label: "Euphoria" },
  ],
  mvrv_zscore: [
    { value: 2, color: "#eab30880", lineStyle: 2, label: "Caution" },
    { value: 7, color: "#ef444480", lineStyle: 2, label: "Danger" },
  ],
  sopr: [
    { value: 0.95, color: "#ef444480", lineStyle: 2, label: "Loss zone" },
    { value: 1.0, color: "#a1a1aa60", lineStyle: 0, label: "Break-even" },
    { value: 1.05, color: "#22c55e80", lineStyle: 2, label: "Profit zone" },
  ],
  asopr: [
    { value: 0.95, color: "#ef444480", lineStyle: 2, label: "Loss zone" },
    { value: 1.0, color: "#a1a1aa60", lineStyle: 0, label: "Break-even" },
    { value: 1.05, color: "#22c55e80", lineStyle: 2, label: "Profit zone" },
  ],
  mvrv: [
    { value: 1, color: "#22c55e80", lineStyle: 2, label: "Undervalued" },
    { value: 2, color: "#eab30880", lineStyle: 2, label: "Fair value" },
    { value: 3.5, color: "#ef444480", lineStyle: 2, label: "Overvalued" },
  ],
  rsi_14: [
    { value: 30, color: "#22c55e80", lineStyle: 2, label: "Oversold" },
    { value: 50, color: "#a1a1aa40", lineStyle: 1, label: "Neutral" },
    { value: 70, color: "#ef444480", lineStyle: 2, label: "Overbought" },
  ],
  supply_in_profit_pct: [
    { value: 0.4, color: "#ef444480", lineStyle: 2, label: "40%" },
    { value: 0.7, color: "#eab30880", lineStyle: 2, label: "70%" },
    { value: 0.95, color: "#ef444480", lineStyle: 2, label: "95%" },
  ],
  price_200ma_ratio: [
    { value: 0.75, color: "#ef444480", lineStyle: 2, label: "Bearish" },
    { value: 1.0, color: "#a1a1aa60", lineStyle: 0, label: "200MA" },
  ],
  puell_multiple: [
    { value: 0.5, color: "#22c55e80", lineStyle: 2, label: "Miner cap." },
    { value: 4.0, color: "#ef444480", lineStyle: 2, label: "Overheated" },
  ],
  reserve_risk: [
    { value: 0.005, color: "#22c55e80", lineStyle: 2, label: "Buy zone" },
    { value: 0.02, color: "#ef444480", lineStyle: 2, label: "Sell zone" },
  ],
  profit_ratio: [
    { value: 0.5, color: "#a1a1aa60", lineStyle: 0, label: "50/50" },
  ],
  sth_sopr_proxy: [
    { value: 1.0, color: "#a1a1aa60", lineStyle: 0, label: "Break-even" },
  ],
  lth_sopr_proxy: [
    { value: 1.0, color: "#a1a1aa60", lineStyle: 0, label: "Break-even" },
  ],
};

export function getZoneLines(metric: string): ZoneLine[] {
  return zoneLineConfigs[metric] ?? [];
}
