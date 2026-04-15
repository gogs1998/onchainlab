import type { MetricRow } from "./types";

/* ── Rule definition ────────────────────────────────────── */

export type Operator = ">" | "<" | ">=" | "<=" | "=" | "crosses_above" | "crosses_below";

export interface Rule {
  metric: string;
  op: Operator;
  value: number;
}

export interface Strategy {
  name: string;
  entryRules: Rule[];      // ALL must be true to enter (AND logic)
  exitRules: Rule[];       // ANY true to exit (OR logic)
  entryLogic: "AND" | "OR";
  exitLogic: "AND" | "OR";
}

/* ── Trade / result types ───────────────────────────────── */

export interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  returnPct: number;
  daysHeld: number;
}

export interface BacktestResult {
  strategy: Strategy;
  trades: Trade[];
  equity: { date: string; value: number }[];
  stats: BacktestStats;
}

export interface BacktestStats {
  totalReturn: number;
  cagr: number;
  maxDrawdown: number;
  sharpe: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  avgDaysHeld: number;
  profitFactor: number;
  buyAndHoldReturn: number;
}

/* ── Helpers ─────────────────────────────────────────────── */

function evalOp(op: Operator, current: number, threshold: number, prev: number | null): boolean {
  switch (op) {
    case ">": return current > threshold;
    case "<": return current < threshold;
    case ">=": return current >= threshold;
    case "<=": return current <= threshold;
    case "=": return current === threshold;
    case "crosses_above":
      return prev !== null && prev <= threshold && current > threshold;
    case "crosses_below":
      return prev !== null && prev >= threshold && current < threshold;
    default: return false;
  }
}

function getVal(row: MetricRow, metric: string): number | null {
  const v = row[metric];
  if (v == null || typeof v !== "number" || Number.isNaN(v)) return null;
  return v;
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function checkRules(
  rules: Rule[],
  logic: "AND" | "OR",
  row: MetricRow,
  prevRow: MetricRow | null,
): boolean {
  if (rules.length === 0) return false;
  const results = rules.map((r) => {
    const cur = getVal(row, r.metric);
    if (cur === null) return false;
    const prev = prevRow ? getVal(prevRow, r.metric) : null;
    return evalOp(r.op, cur, r.value, prev);
  });
  return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
}

/* ── Main engine ─────────────────────────────────────────── */

export function runBacktest(data: MetricRow[], strategy: Strategy): BacktestResult {
  const rows = data.filter((r) => {
    const p = r.btc_price ?? r.price_close;
    return p != null && typeof p === "number" && !Number.isNaN(p);
  });

  if (rows.length < 2) {
    return {
      strategy,
      trades: [],
      equity: [],
      stats: emptyStats(),
    };
  }

  const trades: Trade[] = [];
  const equity: { date: string; value: number }[] = [];
  let capital = 10000;
  let inPosition = false;
  let entryPrice = 0;
  let entryDate = "";

  const firstPrice = (rows[0].btc_price ?? rows[0].price_close) as number;
  const lastPrice = (rows[rows.length - 1].btc_price ?? rows[rows.length - 1].price_close) as number;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const prevRow = rows[i - 1];
    const price = (row.btc_price ?? row.price_close) as number;

    if (!inPosition) {
      // Check entry
      if (checkRules(strategy.entryRules, strategy.entryLogic, row, prevRow)) {
        inPosition = true;
        entryPrice = price;
        entryDate = row.date;
      }
    } else {
      // Check exit
      if (checkRules(strategy.exitRules, strategy.exitLogic, row, prevRow)) {
        const returnPct = (price - entryPrice) / entryPrice;
        capital *= 1 + returnPct;
        trades.push({
          entryDate,
          entryPrice,
          exitDate: row.date,
          exitPrice: price,
          returnPct,
          daysHeld: daysBetween(entryDate, row.date),
        });
        inPosition = false;
      }
    }

    // Track equity (capital when out, mark-to-market when in)
    const mtm = inPosition ? capital * (price / entryPrice) : capital;
    equity.push({ date: row.date, value: mtm });
  }

  // Close open position at end
  if (inPosition) {
    const lastRow = rows[rows.length - 1];
    const price = (lastRow.btc_price ?? lastRow.price_close) as number;
    const returnPct = (price - entryPrice) / entryPrice;
    capital *= 1 + returnPct;
    trades.push({
      entryDate,
      entryPrice,
      exitDate: lastRow.date,
      exitPrice: price,
      returnPct,
      daysHeld: daysBetween(entryDate, lastRow.date),
    });
    equity[equity.length - 1] = { date: lastRow.date, value: capital };
  }

  // Calculate stats
  const stats = computeStats(trades, equity, firstPrice, lastPrice, rows[0].date, rows[rows.length - 1].date);

  return { strategy, trades, equity, stats };
}

function computeStats(
  trades: Trade[],
  equity: { date: string; value: number }[],
  firstPrice: number,
  lastPrice: number,
  startDate: string,
  endDate: string,
): BacktestStats {
  if (trades.length === 0) return emptyStats();

  const years = daysBetween(startDate, endDate) / 365.25;
  const finalEquity = equity.length > 0 ? equity[equity.length - 1].value : 10000;
  const totalReturn = (finalEquity - 10000) / 10000;
  const cagr = years > 0 ? (finalEquity / 10000) ** (1 / years) - 1 : 0;
  const buyAndHoldReturn = (lastPrice - firstPrice) / firstPrice;

  // Max drawdown from equity curve
  let peak = 0;
  let maxDd = 0;
  for (const e of equity) {
    if (e.value > peak) peak = e.value;
    const dd = (peak - e.value) / peak;
    if (dd > maxDd) maxDd = dd;
  }

  // Win rate & avg return
  const wins = trades.filter((t) => t.returnPct > 0).length;
  const avgReturn = trades.reduce((s, t) => s + t.returnPct, 0) / trades.length;
  const avgDays = trades.reduce((s, t) => s + t.daysHeld, 0) / trades.length;

  // Profit factor
  const grossProfit = trades.filter((t) => t.returnPct > 0).reduce((s, t) => s + t.returnPct, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.returnPct < 0).reduce((s, t) => s + t.returnPct, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Sharpe (annualized from daily equity returns)
  let sharpe = 0;
  if (equity.length > 30) {
    const dailyReturns: number[] = [];
    for (let i = 1; i < equity.length; i++) {
      if (equity[i - 1].value > 0) {
        dailyReturns.push(equity[i].value / equity[i - 1].value - 1);
      }
    }
    if (dailyReturns.length > 1) {
      const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / dailyReturns.length;
      const std = Math.sqrt(variance);
      if (std > 0) {
        sharpe = (mean / std) * Math.sqrt(365);
      }
    }
  }

  return {
    totalReturn,
    cagr,
    maxDrawdown: maxDd,
    sharpe,
    winRate: wins / trades.length,
    totalTrades: trades.length,
    avgReturn,
    avgDaysHeld: Math.round(avgDays),
    profitFactor,
    buyAndHoldReturn,
  };
}

function emptyStats(): BacktestStats {
  return {
    totalReturn: 0, cagr: 0, maxDrawdown: 0, sharpe: 0,
    winRate: 0, totalTrades: 0, avgReturn: 0, avgDaysHeld: 0,
    profitFactor: 0, buyAndHoldReturn: 0,
  };
}

/* ── Preset strategies ───────────────────────────────────── */

export const presetStrategies: Strategy[] = [
  {
    name: "MVRV Z-Score Cycle",
    entryRules: [{ metric: "mvrv_zscore", op: "<", value: 0.5 }],
    exitRules: [{ metric: "mvrv_zscore", op: ">", value: 6 }],
    entryLogic: "AND",
    exitLogic: "OR",
  },
  {
    name: "NUPL Capitulation → Euphoria",
    entryRules: [{ metric: "nupl", op: "<", value: 0 }],
    exitRules: [{ metric: "nupl", op: ">", value: 0.7 }],
    entryLogic: "AND",
    exitLogic: "OR",
  },
  {
    name: "RSI Mean Reversion",
    entryRules: [{ metric: "rsi_14", op: "<", value: 30 }],
    exitRules: [{ metric: "rsi_14", op: ">", value: 70 }],
    entryLogic: "AND",
    exitLogic: "OR",
  },
  {
    name: "Reserve Risk Accumulate",
    entryRules: [{ metric: "reserve_risk", op: "<", value: 0.005 }],
    exitRules: [{ metric: "reserve_risk", op: ">", value: 0.02 }],
    entryLogic: "AND",
    exitLogic: "OR",
  },
  {
    name: "Puell Miner Capitulation",
    entryRules: [{ metric: "puell_multiple", op: "<", value: 0.5 }],
    exitRules: [{ metric: "puell_multiple", op: ">", value: 4 }],
    entryLogic: "AND",
    exitLogic: "OR",
  },
  {
    name: "Multi-Signal Confluence",
    entryRules: [
      { metric: "nupl", op: "<", value: 0.1 },
      { metric: "rsi_14", op: "<", value: 40 },
      { metric: "mvrv", op: "<", value: 1.5 },
    ],
    exitRules: [
      { metric: "nupl", op: ">", value: 0.6 },
      { metric: "mvrv", op: ">", value: 3 },
    ],
    entryLogic: "AND",
    exitLogic: "OR",
  },
  {
    name: "200MA Cross + SOPR",
    entryRules: [
      { metric: "price_200ma_ratio", op: ">", value: 1.0 },
      { metric: "sopr", op: ">", value: 1.0 },
    ],
    exitRules: [
      { metric: "price_200ma_ratio", op: "<", value: 0.9 },
    ],
    entryLogic: "AND",
    exitLogic: "OR",
  },
];
