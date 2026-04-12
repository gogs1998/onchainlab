import type { MetricMeta, MetricCategory } from "./types";

export const metricCatalog: MetricMeta[] = [
  // Price & MA
  { key: "btc_price", label: "BTC Price", category: "price", description: "Bitcoin price (USD)" },
  { key: "price_200ma_ratio", label: "200MA Ratio", category: "price", description: "Price / 200-day moving average" },
  { key: "rsi_14", label: "RSI (14)", category: "price", description: "Relative Strength Index" },
  { key: "price_momentum", label: "Momentum", category: "price", description: "Price momentum indicator" },

  // SOPR
  { key: "sopr", label: "SOPR", category: "sopr", description: "Spent Output Profit Ratio" },
  { key: "sopr_zscore", label: "SOPR Z-Score", category: "sopr", description: "SOPR standardized score" },
  { key: "sth_sopr_proxy", label: "STH SOPR", category: "sopr", description: "Short-term holder SOPR proxy" },
  { key: "lth_sopr_proxy", label: "LTH SOPR", category: "sopr", description: "Long-term holder SOPR proxy" },

  // MVRV
  { key: "mvrv", label: "MVRV", category: "mvrv", description: "Market Value to Realized Value" },
  { key: "mvrv_zscore", label: "MVRV Z-Score", category: "mvrv", description: "MVRV standardized score" },
  { key: "nupl", label: "NUPL", category: "mvrv", description: "Net Unrealized Profit/Loss" },
  { key: "thermocap_multiple", label: "Thermocap", category: "mvrv", description: "Thermocap multiple" },

  // CDD
  { key: "cdd", label: "CDD", category: "cdd", description: "Coin Days Destroyed" },
  { key: "dormancy", label: "Dormancy", category: "cdd", description: "Average coin age of spent outputs" },
  { key: "dormancy_flow", label: "Dormancy Flow", category: "cdd", description: "Dormancy / market cap ratio" },

  // Liveliness
  { key: "liveliness", label: "Liveliness", category: "liveliness", description: "Cumulative CDD / cumulative coin-days created" },
  { key: "velocity", label: "Velocity", category: "liveliness", description: "Supply circulation rate" },

  // HODL
  { key: "reserve_risk", label: "Reserve Risk", category: "hodl", description: "Long-term holder confidence vs price" },

  // Holder
  { key: "sth_lth_ratio", label: "STH/LTH Ratio", category: "holder", description: "Short-term vs long-term holder ratio" },
  { key: "pct_sth", label: "% STH", category: "holder", description: "Percent short-term holder supply" },
  { key: "pct_lth", label: "% LTH", category: "holder", description: "Percent long-term holder supply" },

  // Network
  { key: "tx_count_proxy", label: "TX Count", category: "network", description: "Transaction count proxy" },
  { key: "utxo_growth", label: "UTXO Growth", category: "network", description: "Net UTXO change" },
  { key: "congestion", label: "Congestion", category: "network", description: "Network congestion indicator" },

  // Profit/Loss
  { key: "supply_in_profit_pct", label: "Supply in Profit", category: "profit", description: "% of supply in profit" },
  { key: "net_realized_pl", label: "Net Realized P/L", category: "profit", description: "Net realized profit/loss" },
  { key: "capitulation", label: "Capitulation", category: "profit", description: "Capitulation flag" },
  { key: "euphoria", label: "Euphoria", category: "profit", description: "Euphoria flag" },

  // Whale
  { key: "whale_awakening", label: "Whale Awakening", category: "whale", description: "Old coin movement spikes" },
  { key: "ancient_pct", label: "Ancient %", category: "whale", description: "Percentage of very old coins moving" },

  // Valuation
  { key: "puell_multiple", label: "Puell Multiple", category: "valuation", description: "Miner revenue vs yearly average" },
  { key: "stock_to_flow", label: "Stock-to-Flow", category: "valuation", description: "Stock-to-flow model ratio" },
  { key: "onchain_signal", label: "On-Chain Signal", category: "valuation", description: "Composite on-chain signal" },
];

export const categoryLabels: Record<MetricCategory, string> = {
  price: "Price & MA",
  sopr: "SOPR",
  mvrv: "MVRV / NUPL",
  cdd: "CDD / Dormancy",
  liveliness: "Liveliness",
  hodl: "HODL / Reserve Risk",
  age: "Age Distribution",
  holder: "STH vs LTH",
  network: "Network Activity",
  profit: "Profit / Loss",
  whale: "Whale Activity",
  valuation: "Valuation Models",
};

/** Group the catalog by category, preserving insertion order. */
export function groupedMetrics(): Record<string, MetricMeta[]> {
  const groups: Record<string, MetricMeta[]> = {};
  for (const m of metricCatalog) {
    if (!groups[m.category]) groups[m.category] = [];
    groups[m.category].push(m);
  }
  return groups;
}
