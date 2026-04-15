"use client";

import { useMemo } from "react";
import { useMetrics } from "@/components/DataProvider";
import { getLatestValue } from "@/lib/data";
import { getSignalZone, getSignalColor } from "@/lib/signals";
import type { MetricRow } from "@/lib/types";

/* ── Signal metrics we track ──────────────────────────────── */

interface SignalDef {
  key: string;
  label: string;
  description: string;
  condition: string;
}

const signals: SignalDef[] = [
  { key: "capitulation", label: "Capitulation", description: "Widespread loss-taking detected", condition: "= 1" },
  { key: "euphoria", label: "Euphoria", description: "Extreme profit-taking detected", condition: "= 1" },
  { key: "nupl", label: "NUPL < 0", description: "Net unrealized loss — market underwater", condition: "< 0" },
  { key: "mvrv_zscore", label: "MVRV Z > 7", description: "Extreme overvaluation", condition: "> 7" },
  { key: "sopr", label: "SOPR < 0.95", description: "Market selling at a loss", condition: "< 0.95" },
  { key: "rsi_14", label: "RSI > 70", description: "Overbought territory", condition: "> 70" },
  { key: "rsi_14", label: "RSI < 30", description: "Oversold territory", condition: "< 30" },
  { key: "puell_multiple", label: "Puell < 0.5", description: "Miner capitulation", condition: "< 0.5" },
  { key: "reserve_risk", label: "Reserve Risk > 0.02", description: "Confidence too high relative to price", condition: "> 0.02" },
  { key: "supply_in_profit_pct", label: "Supply in Profit > 95%", description: "Almost all supply in profit — overheated", condition: "> 0.95" },
];

function checkCondition(value: number, condition: string): boolean {
  const match = condition.match(/^([<>=!]+)\s*([\d.]+)$/);
  if (!match) return false;
  const [, op, numStr] = match;
  const num = parseFloat(numStr);
  switch (op) {
    case "=": return value === num;
    case ">": return value > num;
    case "<": return value < num;
    case ">=": return value >= num;
    case "<=": return value <= num;
    default: return false;
  }
}

interface SignalEvent {
  date: string;
  fired: boolean;
}

function findSignalHistory(
  data: MetricRow[],
  key: string,
  condition: string,
): { lastFired: string | null; daysSince: number | null; priceAtFire: number | null; priceNow: number | null; priceChange: number | null; count90d: number } {
  const now = data[data.length - 1];
  let lastFired: string | null = null;
  let priceAtFire: number | null = null;
  let count90d = 0;
  const cutoff90 = data.length > 90 ? data.length - 90 : 0;

  for (let i = data.length - 1; i >= 0; i--) {
    const v = data[i][key];
    if (v == null || typeof v !== "number" || Number.isNaN(v)) continue;
    const fired = checkCondition(v, condition);
    if (fired) {
      if (!lastFired) {
        lastFired = data[i].date;
        priceAtFire = data[i].btc_price as number | null;
      }
      if (i >= cutoff90) count90d++;
    }
  }

  const priceNow = now?.btc_price as number | null ?? null;
  let priceChange: number | null = null;
  if (priceAtFire && priceNow) {
    priceChange = ((priceNow - priceAtFire) / priceAtFire) * 100;
  }
  let daysSince: number | null = null;
  if (lastFired) {
    daysSince = Math.round(
      (new Date(now.date).getTime() - new Date(lastFired).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  return { lastFired, daysSince, priceAtFire, priceNow, priceChange, count90d };
}

export default function SignalsPage() {
  const { data } = useMetrics();

  const rows = useMemo(() => {
    if (data.length === 0) return [];
    return signals.map((sig) => ({
      ...sig,
      ...findSignalHistory(data, sig.key, sig.condition),
      currentValue: getLatestValue(data, sig.key)?.value ?? null,
      currentZone: getSignalZone(sig.key, getLatestValue(data, sig.key)?.value ?? null),
    }));
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Signal History
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          When each signal last fired and what happened to price afterward
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60 bg-[var(--bg-secondary)]">
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Signal</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Last Fired</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Days Ago</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Price Then</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Price Change</th>
              <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500">90d Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.key}-${row.condition}-${i}`}
                className="border-b border-zinc-800/30 transition-colors hover:bg-zinc-800/20"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-200">{row.label}</div>
                  <div className="text-[11px] text-zinc-600">{row.description}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getSignalColor(row.currentZone) }}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-400">
                  {row.lastFired ?? "Never"}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-400">
                  {row.daysSince != null ? `${row.daysSince}d` : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-400">
                  {row.priceAtFire != null
                    ? `$${row.priceAtFire.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-[12px]">
                  {row.priceChange != null ? (
                    <span
                      className={
                        row.priceChange >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {row.priceChange >= 0 ? "+" : ""}
                      {row.priceChange.toFixed(1)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-zinc-400">
                  {row.count90d}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11px] text-zinc-600">
        Price change shows the move from the signal fire date to today.
        90d count shows how many days the signal was active in the last 90 days.
      </p>
    </div>
  );
}
