"use client";

import { useMemo } from "react";
import { useMetrics } from "@/components/DataProvider";
import { getLatestRow, getLastNDays, getMetricSeries } from "@/lib/data";
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
                value={latest[card.metric] as number | null}
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
