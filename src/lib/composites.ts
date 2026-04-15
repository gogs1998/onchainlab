import type { MetricRow } from "./types";
import { getLatestValue, getMetricZScore } from "./data";
import { getSignalZone } from "./signals";

export interface CompositeScore {
  id: string;
  label: string;
  description: string;
  score: number;        // 0–100
  scoreLabel: string;   // e.g. "Bullish", "Caution"
  color: string;
  metrics: { key: string; label: string; value: number | null; zone: string | null }[];
}

/* ── Helper: zone-based scoring ──────────────────────────── */

function zoneScore(metric: string, value: number | null): number {
  const zone = getSignalZone(metric, value);
  if (zone === "green") return 1;
  if (zone === "yellow") return 0.5;
  if (zone === "red") return 0;
  return 0.5;
}

function label100(score: number, highGood: boolean): { label: string; color: string } {
  if (highGood) {
    if (score >= 70) return { label: "Bullish", color: "#22c55e" };
    if (score >= 40) return { label: "Neutral", color: "#eab308" };
    return { label: "Bearish", color: "#ef4444" };
  }
  // high = risky
  if (score >= 70) return { label: "High Risk", color: "#ef4444" };
  if (score >= 40) return { label: "Moderate", color: "#eab308" };
  return { label: "Low Risk", color: "#22c55e" };
}

/* ── Normalize a z-score to 0–100 (sigmoid-like) ─────────── */

function zscore100(z: number | null): number {
  if (z === null) return 50;
  // Map z-score to 0..100 using a logistic curve
  return Math.round(100 / (1 + Math.exp(-z)));
}

/* ── Composite definitions ───────────────────────────────── */

interface CompositeDef {
  id: string;
  label: string;
  description: string;
  metrics: { key: string; label: string }[];
  highGood: boolean;
}

const composites: CompositeDef[] = [
  {
    id: "cycle_risk",
    label: "Cycle Risk Score",
    description: "How close are we to a cycle top? Combines the top cycle-top indicators. Low = safe zone, high = danger zone.",
    metrics: [
      { key: "mvrv_zscore", label: "MVRV Z-Score" },
      { key: "nupl", label: "NUPL" },
      { key: "puell_multiple", label: "Puell Multiple" },
      { key: "reserve_risk", label: "Reserve Risk" },
      { key: "thermocap_multiple", label: "Thermocap" },
    ],
    highGood: false, // high = risky
  },
  {
    id: "accumulation",
    label: "Accumulation Score",
    description: "Is smart money accumulating? Based on holder behavior and conviction metrics. High = accumulation, low = distribution.",
    metrics: [
      { key: "accumulation_signal", label: "Accumulation Signal" },
      { key: "reserve_risk", label: "Reserve Risk" },
      { key: "pct_lth", label: "% LTH Supply" },
      { key: "hodler_position_change", label: "HODLer Position Δ" },
      { key: "sth_lth_ratio", label: "STH/LTH Ratio" },
    ],
    highGood: true,
  },
  {
    id: "network_activity",
    label: "Network Activity Score",
    description: "How healthy is on-chain activity? Measures transaction throughput, UTXO growth, and spending behavior.",
    metrics: [
      { key: "velocity", label: "Velocity" },
      { key: "utxo_growth", label: "UTXO Growth" },
      { key: "congestion", label: "Congestion" },
      { key: "liveliness", label: "Liveliness" },
      { key: "tx_momentum", label: "TX Momentum" },
    ],
    highGood: true,
  },
  {
    id: "sentiment",
    label: "Market Sentiment",
    description: "What is the on-chain mood? Profit-taking intensity, SOPR behavior, and realized gains/losses.",
    metrics: [
      { key: "sopr", label: "SOPR" },
      { key: "asopr", label: "Adjusted SOPR" },
      { key: "supply_in_profit_pct", label: "Supply in Profit" },
      { key: "profit_ratio", label: "Profit Ratio" },
      { key: "realized_pl_ratio", label: "Realized P/L Ratio" },
    ],
    highGood: true,
  },
];

/* ── Main compute function ───────────────────────────────── */

export function computeComposites(data: MetricRow[]): CompositeScore[] {
  if (data.length === 0) return [];

  return composites.map((def) => {
    let total = 0;
    let count = 0;
    const metricResults = def.metrics.map((m) => {
      const hit = getLatestValue(data, m.key);
      const value = hit ? hit.value : null;
      const zone = getSignalZone(m.key, value);

      // Try signal-zone first (interpretable). Fall back to z-score.
      if (zone) {
        total += zoneScore(m.key, value);
        count++;
      } else if (value !== null) {
        const z = getMetricZScore(data, m.key);
        total += zscore100(z) / 100;
        count++;
      }

      return { key: m.key, label: m.label, value, zone };
    });

    const raw = count > 0 ? Math.round((total / count) * 100) : 50;
    // For "high = risky" composites, invert so 100 = maximum risk
    const score = def.highGood ? raw : 100 - raw;
    const { label: scoreLabel, color } = label100(score, def.highGood);

    return {
      id: def.id,
      label: def.label,
      description: def.description,
      score,
      scoreLabel,
      color,
      metrics: metricResults,
    };
  });
}
