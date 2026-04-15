"use client";

import { useMemo, useState, useCallback } from "react";
import { useMetrics } from "@/components/DataProvider";
import { metricCatalog, categoryLabels, groupedMetrics } from "@/lib/metrics";
import type { MetricRow } from "@/lib/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ── Safe expression evaluator (no eval) ─────────────────── */

type Token =
  | { type: "number"; value: number }
  | { type: "metric"; value: string }
  | { type: "op"; value: string }
  | { type: "paren"; value: "(" | ")" }
  | { type: "func"; value: string };

const SAFE_FUNCS: Record<string, (x: number) => number> = {
  abs: Math.abs,
  sqrt: Math.sqrt,
  log: Math.log,
  log10: Math.log10,
  exp: Math.exp,
  min: Math.min,
  max: Math.max,
};

function tokenize(expr: string, validKeys: Set<string>): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if ("+-*/()".includes(expr[i])) {
      if (expr[i] === "(" || expr[i] === ")") {
        tokens.push({ type: "paren", value: expr[i] as "(" | ")" });
      } else {
        tokens.push({ type: "op", value: expr[i] });
      }
      i++;
      continue;
    }
    if (/[0-9.]/.test(expr[i])) {
      let num = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i++]; }
      tokens.push({ type: "number", value: parseFloat(num) });
      continue;
    }
    if (/[a-zA-Z_]/.test(expr[i])) {
      let ident = "";
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) { ident += expr[i++]; }
      if (SAFE_FUNCS[ident]) {
        tokens.push({ type: "func", value: ident });
      } else if (validKeys.has(ident)) {
        tokens.push({ type: "metric", value: ident });
      } else {
        throw new Error(`Unknown identifier: ${ident}`);
      }
      continue;
    }
    throw new Error(`Unexpected character: ${expr[i]}`);
  }
  return tokens;
}

/* ── Recursive descent parser → evaluator ────────────────── */

function parseExpression(
  tokens: Token[],
  pos: { i: number },
  row: MetricRow,
): number {
  let left = parseTerm(tokens, pos, row);
  while (pos.i < tokens.length && tokens[pos.i].type === "op" && (tokens[pos.i].value === "+" || tokens[pos.i].value === "-")) {
    const op = tokens[pos.i++].value;
    const right = parseTerm(tokens, pos, row);
    left = op === "+" ? left + right : left - right;
  }
  return left;
}

function parseTerm(
  tokens: Token[],
  pos: { i: number },
  row: MetricRow,
): number {
  let left = parseFactor(tokens, pos, row);
  while (pos.i < tokens.length && tokens[pos.i].type === "op" && (tokens[pos.i].value === "*" || tokens[pos.i].value === "/")) {
    const op = tokens[pos.i++].value;
    const right = parseFactor(tokens, pos, row);
    left = op === "*" ? left * right : right !== 0 ? left / right : NaN;
  }
  return left;
}

function parseFactor(
  tokens: Token[],
  pos: { i: number },
  row: MetricRow,
): number {
  if (pos.i >= tokens.length) throw new Error("Unexpected end of expression");
  const tok = tokens[pos.i];

  if (tok.type === "number") { pos.i++; return tok.value; }
  if (tok.type === "metric") {
    pos.i++;
    const v = row[tok.value];
    return typeof v === "number" && !Number.isNaN(v) ? v : NaN;
  }
  if (tok.type === "func") {
    pos.i++; // skip func name
    if (pos.i >= tokens.length || tokens[pos.i].value !== "(") throw new Error(`Expected ( after ${tok.value}`);
    pos.i++; // skip (
    const arg = parseExpression(tokens, pos, row);
    if (pos.i >= tokens.length || tokens[pos.i].value !== ")") throw new Error(`Expected ) after ${tok.value} argument`);
    pos.i++; // skip )
    return SAFE_FUNCS[tok.value](arg);
  }
  if (tok.type === "paren" && tok.value === "(") {
    pos.i++;
    const val = parseExpression(tokens, pos, row);
    if (pos.i >= tokens.length || tokens[pos.i].value !== ")") throw new Error("Missing closing parenthesis");
    pos.i++;
    return val;
  }
  // Handle unary minus
  if (tok.type === "op" && tok.value === "-") {
    pos.i++;
    return -parseFactor(tokens, pos, row);
  }
  throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
}

function evaluateFormula(
  formula: string,
  data: MetricRow[],
  validKeys: Set<string>,
): { series: { date: string; value: number }[]; error: string | null } {
  try {
    const tokens = tokenize(formula, validKeys);
    if (tokens.length === 0) return { series: [], error: null };

    const series: { date: string; value: number }[] = [];
    for (const row of data) {
      const pos = { i: 0 };
      const val = parseExpression(tokens, pos, row);
      if (!Number.isNaN(val) && Number.isFinite(val)) {
        series.push({ date: row.date, value: val });
      }
    }
    return { series, error: null };
  } catch (e: unknown) {
    return { series: [], error: (e as Error).message };
  }
}

/* ── Saved formulas (localStorage) ───────────────────────── */

interface SavedFormula {
  name: string;
  formula: string;
}

function loadSavedFormulas(): SavedFormula[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("custom_formulas");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSavedFormulas(formulas: SavedFormula[]) {
  localStorage.setItem("custom_formulas", JSON.stringify(formulas));
}

/* ── Preset formulas ─────────────────────────────────────── */

const presets: SavedFormula[] = [
  { name: "MVRV × NUPL", formula: "mvrv * nupl" },
  { name: "SOPR Spread", formula: "(sopr - 1) * 100" },
  { name: "Cycle Heat", formula: "mvrv_zscore + nupl * 10" },
  { name: "Holder Strength", formula: "pct_lth - pct_sth" },
  { name: "Risk-Adjusted Reserve", formula: "log(reserve_risk + 0.001) * -1" },
];

/* ── Page ─────────────────────────────────────────────────── */

export default function BuilderPage() {
  const { data, loading } = useMetrics();
  const [formula, setFormula] = useState("(sopr - 1) * 100");
  const [customName, setCustomName] = useState("");
  const [saved, setSaved] = useState<SavedFormula[]>(() => loadSavedFormulas());

  const validKeys = useMemo(() => {
    const s = new Set<string>();
    for (const m of metricCatalog) s.add(m.key);
    return s;
  }, []);

  const result = useMemo(
    () => (data.length > 0 && formula.trim() ? evaluateFormula(formula, data, validKeys) : { series: [], error: null }),
    [data, formula, validKeys],
  );

  const groups = useMemo(() => groupedMetrics(), []);

  const handleSave = useCallback(() => {
    const name = customName.trim() || formula.slice(0, 30);
    const next = [...saved, { name, formula }];
    setSaved(next);
    saveSavedFormulas(next);
    setCustomName("");
  }, [customName, formula, saved]);

  const handleDelete = useCallback((idx: number) => {
    const next = saved.filter((_, i) => i !== idx);
    setSaved(next);
    saveSavedFormulas(next);
  }, [saved]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Custom Metric Builder
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Combine on-chain metrics with math formulas. Supports +, -, *, /, parentheses, and functions (abs, sqrt, log, exp).
        </p>
      </div>

      {/* Formula input */}
      <div className="mb-6 rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-5 shadow-lg shadow-black/20">
        <label className="mb-2 block font-[family-name:var(--font-mono)] text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
          Formula
        </label>
        <div className="flex gap-3">
          <input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="e.g. (sopr - 1) * 100"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 font-mono text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Name (optional)"
              className="w-36 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSave}
              disabled={!formula.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
        {result.error && (
          <p className="mt-2 text-xs text-red-400">Error: {result.error}</p>
        )}
      </div>

      {/* Presets & saved */}
      <div className="mb-6 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => setFormula(p.formula)}
            className="rounded-md bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            {p.name}
          </button>
        ))}
        {saved.map((s, idx) => (
          <div
            key={idx}
            className="flex items-center rounded-md bg-blue-900/30 border border-blue-800/50"
          >
            <button
              onClick={() => setFormula(s.formula)}
              className="px-3 py-1.5 text-xs font-medium text-blue-300 hover:text-blue-200"
            >
              {s.name}
            </button>
            <button
              onClick={() => handleDelete(idx)}
              className="px-2 py-1.5 text-xs text-blue-500 hover:text-red-400"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Chart */}
      {result.series.length > 0 ? (
        <div className="mb-8 rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-5 shadow-lg shadow-black/20">
          <h2 className="mb-3 font-[family-name:var(--font-mono)] text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
            Result ({result.series.length.toLocaleString()} data points)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  tickFormatter={(d: string) => d.slice(0, 7)}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  tickFormatter={(v: number) =>
                    Math.abs(v) >= 1e6
                      ? `${(v / 1e6).toFixed(1)}M`
                      : Math.abs(v) >= 1e3
                        ? `${(v / 1e3).toFixed(1)}K`
                        : v.toFixed(2)
                  }
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(v) => [Number(v).toFixed(4), "Value"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : formula.trim() && !result.error ? (
        <div className="mb-8 rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-8 text-center text-sm text-zinc-500">
          No valid data points produced.
        </div>
      ) : null}

      {/* Metric Reference */}
      <div className="rounded-xl border border-zinc-800/60 bg-[var(--bg-card)] p-5 shadow-lg shadow-black/20">
        <h2 className="mb-3 font-[family-name:var(--font-mono)] text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
          Available Metrics
        </h2>
        <p className="mb-4 text-[11px] text-zinc-500">
          Click a metric key to insert it into the formula.
        </p>
        <div className="space-y-4">
          {Object.entries(groups).map(([cat, metrics]) => (
            <div key={cat}>
              <h3 className="mb-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                {categoryLabels[cat as keyof typeof categoryLabels] ?? cat}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {metrics.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setFormula((prev) => prev ? `${prev} ${m.key}` : m.key);
                    }}
                    className="rounded bg-zinc-800/60 px-2 py-1 font-mono text-[10px] text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                    title={m.description}
                  >
                    {m.key}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
