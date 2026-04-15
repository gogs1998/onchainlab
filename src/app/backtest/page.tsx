"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useMetrics } from "@/components/DataProvider";
import { metricCatalog } from "@/lib/metrics";
import {
  runBacktest,
  presetStrategies,
  type Strategy,
  type Rule,
  type Operator,
  type BacktestResult,
} from "@/lib/backtest";
import { createChart, LineSeries } from "lightweight-charts";

/* ── Constants ────────────────────────────────────────────── */

const operators: { value: Operator; label: string }[] = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
  { value: "crosses_above", label: "crosses above" },
  { value: "crosses_below", label: "crosses below" },
];

const signalMetrics = metricCatalog.filter(
  (m) => m.key !== "btc_price" && m.key !== "price_close" && m.key !== "market_cap" && m.key !== "realized_cap",
);

const defaultRule = (): Rule => ({
  metric: "mvrv_zscore",
  op: "<",
  value: 1,
});

/* ── Rule editor row ──────────────────────────────────────── */

function RuleRow({
  rule,
  onChange,
  onRemove,
}: {
  rule: Rule;
  onChange: (r: Rule) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-200 flex-1 min-w-0"
        value={rule.metric}
        onChange={(e) => onChange({ ...rule, metric: e.target.value })}
      >
        {signalMetrics.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-200 w-32"
        value={rule.op}
        onChange={(e) => onChange({ ...rule, op: e.target.value as Operator })}
      >
        {operators.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="any"
        className="w-24 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-200"
        value={rule.value}
        onChange={(e) => onChange({ ...rule, value: parseFloat(e.target.value) || 0 })}
      />
      <button
        onClick={onRemove}
        className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/30"
      >
        ✕
      </button>
    </div>
  );
}

/* ── Equity chart ─────────────────────────────────────────── */

function EquityChart({ equity, trades }: { equity: BacktestResult["equity"]; trades: BacktestResult["trades"] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || equity.length === 0) return;
    const el = containerRef.current;
    el.innerHTML = "";

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 350,
      layout: { background: { color: "#09090b" }, textColor: "#a1a1aa" },
      grid: { vertLines: { color: "#27272a40" }, horzLines: { color: "#27272a40" } },
      rightPriceScale: { borderColor: "#27272a" },
      timeScale: { borderColor: "#27272a" },
      crosshair: { mode: 0 },
    });

    // Equity line
    const series = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
      priceLineVisible: false,
      title: "Strategy",
    });
    series.setData(equity.map((e) => ({ time: e.date as string, value: e.value })));

    // Buy & hold line — normalize from same $10k start
    if (equity.length > 0) {
      const firstVal = equity[0].value;
      const bnh = chart.addSeries(LineSeries, {
        color: "#6b728080",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        title: "Buy & Hold",
      });
      // We don't have raw BTC price curve in equity, so we'll skip B&H overlay
      // and just show it in the stats
    }

    // Entry/exit markers as price lines? No — just show the equity
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [equity, trades]);

  return <div ref={containerRef} className="w-full" />;
}

/* ── Stats panel ──────────────────────────────────────────── */

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${color ?? "text-zinc-100"}`}>{value}</div>
    </div>
  );
}

function StatsPanel({ stats }: { stats: BacktestResult["stats"] }) {
  const pctFmt = (v: number) => `${(v * 100).toFixed(1)}%`;
  const numFmt = (v: number) => v.toFixed(2);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard
        label="Total Return"
        value={pctFmt(stats.totalReturn)}
        color={stats.totalReturn >= 0 ? "text-emerald-400" : "text-red-400"}
      />
      <StatCard
        label="CAGR"
        value={pctFmt(stats.cagr)}
        color={stats.cagr >= 0 ? "text-emerald-400" : "text-red-400"}
      />
      <StatCard label="Max Drawdown" value={pctFmt(stats.maxDrawdown)} color="text-red-400" />
      <StatCard
        label="Sharpe Ratio"
        value={numFmt(stats.sharpe)}
        color={stats.sharpe >= 1 ? "text-emerald-400" : stats.sharpe >= 0 ? "text-yellow-400" : "text-red-400"}
      />
      <StatCard label="Win Rate" value={pctFmt(stats.winRate)} />
      <StatCard label="Total Trades" value={String(stats.totalTrades)} />
      <StatCard label="Avg Return" value={pctFmt(stats.avgReturn)} />
      <StatCard label="Avg Days Held" value={`${stats.avgDaysHeld}d`} />
      <StatCard label="Profit Factor" value={stats.profitFactor === Infinity ? "∞" : numFmt(stats.profitFactor)} />
      <StatCard
        label="Buy & Hold"
        value={pctFmt(stats.buyAndHoldReturn)}
        color="text-zinc-400"
      />
    </div>
  );
}

/* ── Trade table ──────────────────────────────────────────── */

function TradeTable({ trades }: { trades: BacktestResult["trades"] }) {
  if (trades.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs text-zinc-500">
          <tr>
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">Entry</th>
            <th className="px-4 py-2">Entry $</th>
            <th className="px-4 py-2">Exit</th>
            <th className="px-4 py-2">Exit $</th>
            <th className="px-4 py-2">Return</th>
            <th className="px-4 py-2">Days</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="px-4 py-2 text-zinc-500">{i + 1}</td>
              <td className="px-4 py-2 text-zinc-300">{t.entryDate}</td>
              <td className="px-4 py-2 text-zinc-300">${t.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td className="px-4 py-2 text-zinc-300">{t.exitDate}</td>
              <td className="px-4 py-2 text-zinc-300">${t.exitPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              <td className={`px-4 py-2 font-medium ${t.returnPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {(t.returnPct * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-2 text-zinc-400">{t.daysHeld}d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function BacktestPage() {
  const { data, loading } = useMetrics();

  // Strategy builder state
  const [strategyName, setStrategyName] = useState("Custom Strategy");
  const [entryRules, setEntryRules] = useState<Rule[]>([defaultRule()]);
  const [exitRules, setExitRules] = useState<Rule[]>([{ metric: "mvrv_zscore", op: ">", value: 6 }]);
  const [entryLogic, setEntryLogic] = useState<"AND" | "OR">("AND");
  const [exitLogic, setExitLogic] = useState<"AND" | "OR">("OR");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const updateEntryRule = useCallback((idx: number, r: Rule) => {
    setEntryRules((prev) => prev.map((old, i) => (i === idx ? r : old)));
  }, []);

  const updateExitRule = useCallback((idx: number, r: Rule) => {
    setExitRules((prev) => prev.map((old, i) => (i === idx ? r : old)));
  }, []);

  const loadPreset = useCallback((s: Strategy) => {
    setStrategyName(s.name);
    setEntryRules([...s.entryRules]);
    setExitRules([...s.exitRules]);
    setEntryLogic(s.entryLogic);
    setExitLogic(s.exitLogic);
    setActivePreset(s.name);
    setResult(null);
  }, []);

  const runTest = useCallback(() => {
    if (!data || data.length === 0) return;
    const strategy: Strategy = {
      name: strategyName,
      entryRules,
      exitRules,
      entryLogic,
      exitLogic,
    };
    const res = runBacktest(data, strategy);
    setResult(res);
  }, [data, strategyName, entryRules, exitRules, entryLogic, exitLogic]);

  if (loading || !data || data.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-zinc-500">
        Loading data...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Strategy Backtester</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Define entry & exit rules using on-chain metrics, then test against {data.length.toLocaleString()} days of history.
          Starting capital: $10,000.
        </p>
      </div>

      {/* Preset strategies */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Preset Strategies
        </h2>
        <div className="flex flex-wrap gap-2">
          {presetStrategies.map((s) => (
            <button
              key={s.name}
              onClick={() => loadPreset(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                activePreset === s.name
                  ? "border-blue-600 bg-blue-600/20 text-blue-400"
                  : "border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy builder */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entry rules */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-emerald-400">
              ▲ Entry Rules
              <span className="ml-2 text-xs text-zinc-500">
                (
                <button
                  onClick={() => setEntryLogic(entryLogic === "AND" ? "OR" : "AND")}
                  className="text-blue-400 underline"
                >
                  {entryLogic}
                </button>
                )
              </span>
            </h3>
            <button
              onClick={() => setEntryRules([...entryRules, defaultRule()])}
              className="rounded bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-400 hover:bg-emerald-900/60"
            >
              + Add Rule
            </button>
          </div>
          <div className="space-y-2">
            {entryRules.map((r, i) => (
              <RuleRow
                key={i}
                rule={r}
                onChange={(nr) => updateEntryRule(i, nr)}
                onRemove={() => setEntryRules(entryRules.filter((_, j) => j !== i))}
              />
            ))}
            {entryRules.length === 0 && (
              <p className="text-xs text-zinc-600">No entry rules. Add at least one.</p>
            )}
          </div>
        </div>

        {/* Exit rules */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-red-400">
              ▼ Exit Rules
              <span className="ml-2 text-xs text-zinc-500">
                (
                <button
                  onClick={() => setExitLogic(exitLogic === "AND" ? "OR" : "AND")}
                  className="text-blue-400 underline"
                >
                  {exitLogic}
                </button>
                )
              </span>
            </h3>
            <button
              onClick={() => setExitRules([...exitRules, { metric: "mvrv_zscore", op: ">", value: 6 }])}
              className="rounded bg-red-900/40 px-2 py-0.5 text-xs text-red-400 hover:bg-red-900/60"
            >
              + Add Rule
            </button>
          </div>
          <div className="space-y-2">
            {exitRules.map((r, i) => (
              <RuleRow
                key={i}
                rule={r}
                onChange={(nr) => updateExitRule(i, nr)}
                onRemove={() => setExitRules(exitRules.filter((_, j) => j !== i))}
              />
            ))}
            {exitRules.length === 0 && (
              <p className="text-xs text-zinc-600">No exit rules. Add at least one.</p>
            )}
          </div>
        </div>
      </div>

      {/* Run button */}
      <div className="flex items-center gap-4">
        <button
          onClick={runTest}
          disabled={entryRules.length === 0 || exitRules.length === 0}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Run Backtest
        </button>
        {result && (
          <span className="text-sm text-zinc-500">
            {result.stats.totalTrades} trades over{" "}
            {data.length.toLocaleString()} days
          </span>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <StatsPanel stats={result.stats} />

          {result.equity.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-400">Equity Curve ($10k start)</h3>
              <EquityChart equity={result.equity} trades={result.trades} />
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-400">
              Trade History ({result.trades.length})
            </h3>
            <TradeTable trades={result.trades} />
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-zinc-600">
        Backtest results are hypothetical and do not account for slippage, fees, or market impact.
        Past performance does not guarantee future results. This is not financial advice.
      </p>
    </div>
  );
}
