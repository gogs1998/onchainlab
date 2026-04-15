"use client";

import { useMemo } from "react";
import { useMetrics } from "@/components/DataProvider";
import { getLatestRow, getLatestValue, getLastNDays, getMetricSeries, getMetricZScore } from "@/lib/data";
import { getSignalZone } from "@/lib/signals";
import { metricCatalog } from "@/lib/metrics";
import { computeComposites } from "@/lib/composites";
import SectionHeader from "@/components/overview/SectionHeader";
import MetricCard from "@/components/overview/MetricCard";

/* ── Formatting helpers ───────────────────────────────────── */

const fmt = (decimals: number) => (v: number) => v.toFixed(decimals);
const fmtUsd = (v: number) =>
  `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

/* ── Section definitions ──────────────────────────────────── */

interface CardDef {
  label: string;
  metric: string;
  description: string;
  format?: (v: number) => string;
}

interface SectionDef {
  title: string;
  cards: CardDef[];
}

const sections: SectionDef[] = [
  {
    title: "Market Pulse",
    cards: [
      {
        label: "BTC Price",
        metric: "btc_price",
        description: "Current Bitcoin price (USD)",
        format: fmtUsd,
      },
      {
        label: "RSI (14)",
        metric: "rsi_14",
        description:
          "Relative Strength Index — above 70 is overbought, below 30 is oversold",
        format: fmt(1),
      },
      {
        label: "Price Momentum",
        metric: "price_momentum",
        description: "Short-term price trend strength",
        format: fmt(3),
      },
      {
        label: "200MA Ratio",
        metric: "price_200ma_ratio",
        description:
          "Price relative to 200-day moving average — above 1 means bullish trend",
        format: fmt(2),
      },
    ],
  },
  {
    title: "Cycle Position",
    cards: [
      {
        label: "MVRV Z-Score",
        metric: "mvrv_zscore",
        description:
          "Market value vs realized value — high values signal overvaluation",
        format: fmt(2),
      },
      {
        label: "NUPL",
        metric: "nupl",
        description:
          "Net Unrealized Profit/Loss — measures overall market profitability",
        format: fmt(3),
      },
      {
        label: "Puell Multiple",
        metric: "puell_multiple",
        description:
          "Miner revenue relative to yearly average — extreme values mark cycle tops/bottoms",
        format: fmt(2),
      },
      {
        label: "Reserve Risk",
        metric: "reserve_risk",
        description:
          "Confidence of long-term holders relative to price — low = good time to invest",
        format: fmt(4),
      },
    ],
  },
  {
    title: "Smart Money",
    cards: [
      {
        label: "STH/LTH Ratio",
        metric: "sth_lth_ratio",
        description:
          "Short-term vs long-term holder balance — high means more speculative activity",
        format: fmt(3),
      },
      {
        label: "Whale Awakening",
        metric: "whale_awakening",
        description:
          "Very old coins (5yr+) moving — spikes indicate major holder activity",
        format: fmt(2),
      },
      {
        label: "Accumulation Signal",
        metric: "accumulation_signal",
        description: "Composite signal of holder accumulation behavior",
        format: fmt(2),
      },
      {
        label: "LTH Selling",
        metric: "lth_selling",
        description: "Long-term holder distribution intensity",
        format: fmt(3),
      },
    ],
  },
  {
    title: "Network Health",
    cards: [
      {
        label: "Velocity",
        metric: "velocity",
        description:
          "How actively the supply is circulating — higher means more transactional use",
        format: fmt(4),
      },
      {
        label: "UTXO Growth",
        metric: "utxo_growth",
        description:
          "Net change in unspent outputs — growing means adoption",
        format: fmt(2),
      },
      {
        label: "Congestion",
        metric: "congestion",
        description: "Network utilization and fee pressure",
        format: fmt(2),
      },
      {
        label: "Liveliness",
        metric: "liveliness",
        description:
          "Ratio of cumulative coin-days destroyed to created — rising means spending",
        format: fmt(4),
      },
    ],
  },
  {
    title: "Signals",
    cards: [
      {
        label: "Capitulation",
        metric: "capitulation",
        description:
          "Widespread loss-taking detected — historically marks market bottoms",
        format: fmt(2),
      },
      {
        label: "Euphoria",
        metric: "euphoria",
        description:
          "Extreme profit-taking detected — historically marks market tops",
        format: fmt(2),
      },
      {
        label: "On-Chain Signal",
        metric: "onchain_signal",
        description: "Composite of multiple on-chain indicators",
        format: fmt(2),
      },
      {
        label: "Supply in Profit",
        metric: "supply_in_profit_pct",
        description:
          "Percentage of circulating supply currently in profit",
        format: fmtPct,
      },
    ],
  },
];

/* ── Page component ───────────────────────────────────────── */

export default function OverviewPage() {
  const { data } = useMetrics();

  const latest = useMemo(
    () => (data.length > 0 ? getLatestRow(data) : null),
    [data],
  );

  const last90 = useMemo(
    () => (data.length > 0 ? getLastNDays(data, 90) : []),
    [data],
  );

  // Per-metric latest non-null value (handles trailing sparse rows)
  const latestValues = useMemo(() => {
    if (data.length === 0) return new Map<string, number | null>();
    const map = new Map<string, number | null>();
    // Include all card metrics + composite score metrics
    const allKeys = new Set<string>();
    for (const section of sections) {
      for (const card of section.cards) allKeys.add(card.metric);
    }
    for (const m of [
      "nupl", "mvrv_zscore", "sopr", "mvrv", "reserve_risk",
      "puell_multiple", "rsi_14", "supply_in_profit_pct",
      "price_200ma_ratio", "onchain_signal",
    ]) allKeys.add(m);

    for (const metric of allKeys) {
      const hit = getLatestValue(data, metric);
      map.set(metric, hit ? hit.value : null);
    }
    return map;
  }, [data]);

  // Pre-compute all spark series
  const sparkMap = useMemo(() => {
    if (last90.length === 0) return new Map<string, { date: string; value: number }[]>();
    const map = new Map<string, { date: string; value: number }[]>();
    for (const section of sections) {
      for (const card of section.cards) {
        if (!map.has(card.metric)) {
          map.set(card.metric, getMetricSeries(last90, card.metric));
        }
      }
    }
    return map;
  }, [last90]);

  if (!latest) return null;

  // ── Composite Market Health Score ──────────────────────
  const scoreMetrics = [
    "nupl", "mvrv_zscore", "sopr", "mvrv", "reserve_risk",
    "puell_multiple", "rsi_14", "supply_in_profit_pct",
    "price_200ma_ratio", "onchain_signal",
  ];
  let bullCount = 0, bearCount = 0, neutralCount = 0, scoreTotal = 0;
  for (const m of scoreMetrics) {
    const val = latestValues.get(m) ?? null;
    const zone = getSignalZone(m, val);
    if (zone === "green") { bullCount++; scoreTotal++; }
    else if (zone === "yellow") { neutralCount++; scoreTotal++; }
    else if (zone === "red") { bearCount++; scoreTotal++; }
  }
  const healthPct = scoreTotal > 0 ? Math.round(((bullCount + neutralCount * 0.5) / scoreTotal) * 100) : 50;
  const healthLabel = healthPct >= 70 ? "Bullish" : healthPct >= 40 ? "Neutral" : "Bearish";
  const healthColor = healthPct >= 70 ? "#22c55e" : healthPct >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Market snapshot for {latest.date}
        </p>
      </div>

      {/* Composite Market Health */}
      <div className="mb-8 overflow-hidden rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          {/* Score gauge */}
          <div className="flex flex-col items-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full border-4"
              style={{ borderColor: healthColor }}
            >
              <span
                className="text-3xl font-bold"
                style={{ color: healthColor }}
              >
                {healthPct}
              </span>
            </div>
            <span
              className="mt-2 text-sm font-semibold tracking-wide"
              style={{ color: healthColor }}
            >
              {healthLabel}
            </span>
          </div>
          {/* Breakdown */}
          <div className="flex-1">
            <h2 className="mb-2 font-[family-name:var(--font-mono)] text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
              Market Health Score
            </h2>
            <p className="mb-3 text-[12px] leading-relaxed text-zinc-500">
              Composite of {scoreTotal} on-chain indicators. Green = supportive of
              price, yellow = neutral, red = caution.
            </p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-zinc-400">
                  {bullCount} Bullish
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-zinc-400">
                  {neutralCount} Neutral
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-zinc-400">
                  {bearCount} Bearish
                </span>
              </div>
            </div>
            {/* Mini bar */}
            <div className="mt-3 flex h-2 overflow-hidden rounded-full">
              {bullCount > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${(bullCount / scoreTotal) * 100}%` }}
                />
              )}
              {neutralCount > 0 && (
                <div
                  className="bg-yellow-500"
                  style={{ width: `${(neutralCount / scoreTotal) * 100}%` }}
                />
              )}
              {bearCount > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(bearCount / scoreTotal) * 100}%` }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Composite Scores */}
      <CompositeScores data={data} />

      {/* Metric Extremes — "What's screaming right now?" */}
      <MetricExtremes data={data} />

      {/* Sections */}
      {sections.map((section) => (
        <section key={section.title}>
          <SectionHeader title={section.title} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {section.cards.map((card) => (
              <MetricCard
                key={card.metric}
                label={card.label}
                metric={card.metric}
                value={latestValues.get(card.metric) ?? null}
                description={card.description}
                sparkData={sparkMap.get(card.metric) ?? []}
                format={card.format}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Bottom spacing */}
      <div className="h-12" />
    </div>
  );
}

/* ── Composite Scores sub-component ───────────────────────── */

function CompositeScores({ data }: { data: import("@/lib/types").MetricRow[] }) {
  const scores = useMemo(() => computeComposites(data), [data]);

  if (scores.length === 0) return null;

  return (
    <div className="mb-8">
      <SectionHeader title="Composite Scores" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scores.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-5 shadow-lg shadow-black/20"
          >
            {/* Gauge */}
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px]"
                style={{ borderColor: s.color }}
              >
                <span className="text-2xl font-bold" style={{ color: s.color }}>
                  {s.score}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {s.label}
                </p>
                <p className="text-xs font-medium" style={{ color: s.color }}>
                  {s.scoreLabel}
                </p>
              </div>
            </div>
            {/* Description */}
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              {s.description}
            </p>
            {/* Metric breakdown */}
            <div className="mt-3 space-y-1">
              {s.metrics.map((m) => {
                const dotColor =
                  m.zone === "green" ? "#22c55e" : m.zone === "red" ? "#ef4444" : m.zone === "yellow" ? "#eab308" : "#6b7280";
                return (
                  <div key={m.key} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                      <span className="text-zinc-400">{m.label}</span>
                    </div>
                    <span className="font-mono text-zinc-500">
                      {m.value !== null ? (Math.abs(m.value) >= 1000 ? m.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : m.value.toFixed(3)) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Metric Extremes sub-component ────────────────────────── */

function MetricExtremes({ data }: { data: import("@/lib/types").MetricRow[] }) {
  const extremes = useMemo(() => {
    const candidates = metricCatalog
      .filter((m) => m.key !== "btc_price" && m.key !== "market_cap" && m.key !== "realized_cap")
      .map((m) => {
        const z = getMetricZScore(data, m.key);
        return { ...m, zscore: z };
      })
      .filter((m) => m.zscore !== null)
      .sort((a, b) => Math.abs(b.zscore!) - Math.abs(a.zscore!))
      .slice(0, 5);
    return candidates;
  }, [data]);

  if (extremes.length === 0) return null;

  return (
    <div className="mb-8">
      <SectionHeader title="Most Extreme Readings" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {extremes.map((m) => {
          const absZ = Math.abs(m.zscore!);
          const isHigh = m.zscore! > 0;
          const barColor = absZ > 2 ? (isHigh ? "#ef4444" : "#22c55e") : "#eab308";
          const barWidth = Math.min(absZ / 3, 1) * 100;
          return (
            <div
              key={m.key}
              className="rounded-lg border border-zinc-800/60 bg-[var(--bg-card)] p-3"
            >
              <p className="text-[11px] font-semibold text-zinc-300 truncate">
                {m.label}
              </p>
              <p
                className="mt-1 text-lg font-bold"
                style={{ color: barColor }}
              >
                {m.zscore! > 0 ? "+" : ""}
                {m.zscore!.toFixed(1)}σ
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
              <p className="mt-1 text-[9px] text-zinc-600">
                {absZ > 2 ? "Extreme" : absZ > 1 ? "Elevated" : "Moderate"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
