import type { MetricMeta, MetricCategory } from "./types";

export const metricCatalog: MetricMeta[] = [
  // ── Price & MA ─────────────────────────────────────────
  { key: "btc_price", label: "BTC Price", category: "price", description: "Bitcoin price (USD)", unit: "USD" },
  { key: "price_200ma_ratio", label: "200MA Ratio", category: "price", description: "Price divided by 200-day moving average. Above 1 = bullish trend, below 1 = bearish. A core cycle indicator used by most analysts." },
  { key: "rsi_14", label: "RSI (14)", category: "price", description: "Relative Strength Index over 14 days. Above 70 = overbought, below 30 = oversold. Classic momentum oscillator." },
  { key: "price_momentum", label: "Momentum", category: "price", description: "Short-term price trend strength based on rate of change." },
  { key: "price_vol", label: "Price Volatility", category: "price", description: "Rolling realized price volatility. High values signal turbulent markets." },
  { key: "price_above_200ma", label: "Above 200MA", category: "price", description: "Binary flag: 1 when price is above its 200-day moving average, 0 when below." },
  { key: "ma_cross_signal", label: "MA Cross Signal", category: "price", description: "Moving average crossover signal. Positive = bullish (golden cross), negative = bearish (death cross)." },
  { key: "market_cap", label: "Market Cap", category: "price", description: "Total market capitalization: circulating supply × current price.", unit: "USD" },

  // ── SOPR ───────────────────────────────────────────────
  { key: "sopr", label: "SOPR", category: "sopr", description: "Spent Output Profit Ratio. Above 1 = coins moved at profit, below 1 = at loss. Key sentiment indicator." },
  { key: "asopr", label: "Adjusted SOPR", category: "sopr", description: "SOPR adjusted by filtering outputs younger than 1 hour to remove change noise. Cleaner signal than raw SOPR." },
  { key: "sopr_zscore", label: "SOPR Z-Score", category: "sopr", description: "SOPR standardized against its historical distribution. Extreme values signal overheated or capitulating markets." },
  { key: "sopr_percentile", label: "SOPR Percentile", category: "sopr", description: "Where current SOPR sits relative to its full history (0–1). Above 0.9 = extreme profit-taking." },
  { key: "sopr_momentum", label: "SOPR Momentum", category: "sopr", description: "Rate of change in SOPR. Rising = increasing profit-taking, falling = growing loss-taking." },
  { key: "sopr_osc", label: "SOPR Oscillator", category: "sopr", description: "Mean-reverting SOPR oscillator. Extreme readings signal regime shifts." },
  { key: "sopr_ratio", label: "SOPR Ratio", category: "sopr", description: "Ratio of short-period to long-period SOPR. Divergences signal trend changes." },
  { key: "sopr_deviation", label: "SOPR Deviation", category: "sopr", description: "SOPR deviation from its moving average. Large deviations = extreme sentiment." },
  { key: "sopr_winsorized", label: "SOPR Winsorized", category: "sopr", description: "SOPR with extreme outliers clipped. More robust for trend analysis." },
  { key: "sopr_median", label: "SOPR Median", category: "sopr", description: "Median SOPR — less sensitive to whale transactions than the mean." },
  { key: "sth_sopr_proxy", label: "STH SOPR", category: "sopr", description: "Short-term holder SOPR proxy. Below 1 = new buyers selling at a loss (capitulation signal)." },
  { key: "lth_sopr_proxy", label: "LTH SOPR", category: "sopr", description: "Long-term holder SOPR proxy. Below 1 = diamond hands capitulating (rare, high-signal)." },

  // ── MVRV / NUPL ────────────────────────────────────────
  { key: "mvrv", label: "MVRV", category: "mvrv", description: "Market Value to Realized Value. Measures aggregate unrealized profit. Above 3.5 = overvalued, below 1 = undervalued." },
  { key: "mvrv_zscore", label: "MVRV Z-Score", category: "mvrv", description: "Standardized MVRV separating market cap from realized cap relative to volatility. The top cycle-top indicator." },
  { key: "nupl", label: "NUPL", category: "mvrv", description: "Net Unrealized Profit/Loss. Above 0.75 = euphoria, below 0 = capitulation. Measures overall holder sentiment." },
  { key: "realized_cap", label: "Realized Cap", category: "mvrv", description: "Sum of all UTXOs valued at the price when they last moved. Represents the aggregate cost basis of Bitcoin.", unit: "USD" },
  { key: "thermocap_multiple", label: "Thermocap", category: "mvrv", description: "Market cap divided by cumulative miner revenue. Measures how much value the market assigns per unit of security spend." },

  // ── CDD / Dormancy ─────────────────────────────────────
  { key: "cdd", label: "CDD", category: "cdd", description: "Coin Days Destroyed — coins × days held before spending. Spikes mean long-dormant coins are moving." },
  { key: "cdd_90d_avg", label: "CDD 90d Avg", category: "cdd", description: "90-day moving average of CDD. Smoothed view of long-term holder activity." },
  { key: "binary_cdd", label: "Binary CDD", category: "cdd", description: "1 when CDD exceeds its long-term average, 0 otherwise. Flags statistically significant destruction events." },
  { key: "supply_adj_cdd", label: "Supply-Adj CDD", category: "cdd", description: "CDD adjusted for circulating supply. Comparable across different supply eras." },
  { key: "cdd_per_output", label: "CDD per Output", category: "cdd", description: "Average coin-days destroyed per spent output. High = old coins moving." },
  { key: "cdd_clean", label: "CDD Clean", category: "cdd", description: "CDD with outlier transactions removed for cleaner trend analysis." },
  { key: "dormancy", label: "Dormancy", category: "cdd", description: "Average coin age of spent outputs. High dormancy = old money moving." },
  { key: "dormancy_flow", label: "Dormancy Flow", category: "cdd", description: "Dormancy adjusted by market cap. Identifies when old money moves relative to market size." },
  { key: "dormancy_clean", label: "Dormancy Clean", category: "cdd", description: "Dormancy with outliers removed for smoother analysis." },

  // ── Liveliness / Velocity ──────────────────────────────
  { key: "liveliness", label: "Liveliness", category: "liveliness", description: "Ratio of cumulative CDD to cumulative coin-days created. Rising = spending outpaces HODLing." },
  { key: "velocity", label: "Velocity", category: "liveliness", description: "How rapidly the supply circulates. Higher velocity = more transactional economy." },
  { key: "velocity_7d", label: "Velocity 7d", category: "liveliness", description: "7-day smoothed velocity. Short-term spending activity." },
  { key: "velocity_30d", label: "Velocity 30d", category: "liveliness", description: "30-day smoothed velocity. Medium-term spending trends." },
  { key: "velocity_90d", label: "Velocity 90d", category: "liveliness", description: "90-day smoothed velocity. Long-term circulation trend." },
  { key: "velocity_momentum", label: "Velocity Momentum", category: "liveliness", description: "Rate of change in velocity. Accelerating velocity = growing network usage." },
  { key: "velocity_clean", label: "Velocity Clean", category: "liveliness", description: "Velocity with outlier days removed for trend analysis." },

  // ── HODL / Reserve Risk ────────────────────────────────
  { key: "reserve_risk", label: "Reserve Risk", category: "hodl", description: "Confidence of long-term holders relative to price. Low reserve risk = good accumulation opportunity." },
  { key: "hodl_bank", label: "HODL Bank", category: "hodl", description: "Cumulative opportunity cost of HODLing. Represents the stored conviction of long-term holders." },
  { key: "hodler_position_change", label: "HODLer Position Δ", category: "hodl", description: "Net change in long-term holder positions. Positive = accumulation, negative = distribution." },
  { key: "active_supply_30d", label: "Active Supply 30d", category: "hodl", description: "Proportion of supply that has moved in the last 30 days. Low = dormant market." },

  // ── Age Distribution ───────────────────────────────────
  { key: "young_dominance", label: "Young Dominance", category: "age", description: "Share of spent coins that are young (<6mo). High = speculative activity dominates." },
  { key: "mid_dominance", label: "Mid Dominance", category: "age", description: "Share of spent coins in the 6mo–2yr range. Represents mid-term holder activity." },
  { key: "old_dominance", label: "Old Dominance", category: "age", description: "Share of spent coins older than 2yr. High = long-term holders are distributing." },
  { key: "age_skew", label: "Age Skew", category: "age", description: "Ratio of old to young coin activity. Rising skew = old hands becoming active." },

  // ── STH vs LTH ─────────────────────────────────────────
  { key: "sth_lth_ratio", label: "STH/LTH Ratio", category: "holder", description: "Ratio of short-term to long-term holder supply. High = speculative, low = HODLer-dominated." },
  { key: "pct_sth", label: "% STH", category: "holder", description: "Percent of live supply held by short-term holders (<155 days)." },
  { key: "pct_lth", label: "% LTH", category: "holder", description: "Percent of live supply held by long-term holders (>155 days)." },
  { key: "lth_selling", label: "LTH Selling", category: "holder", description: "Long-term holder distribution intensity. Spikes signal smart money taking profit." },
  { key: "sth_activity", label: "STH Activity", category: "holder", description: "Short-term holder transaction activity. High = retail-driven market." },
  { key: "accumulation_signal", label: "Accumulation Signal", category: "holder", description: "Composite signal of holder accumulation behavior. Above 0.5 = net accumulation." },

  // ── Network Activity ───────────────────────────────────
  { key: "tx_count_proxy", label: "TX Count", category: "network", description: "Transaction count proxy derived from UTXO activity." },
  { key: "tx_momentum", label: "TX Momentum", category: "network", description: "Transaction count momentum. Rising = growing network adoption." },
  { key: "utxo_growth", label: "UTXO Growth", category: "network", description: "Net change in unspent outputs. Positive = new UTXOs being created (adoption)." },
  { key: "utxo_density", label: "UTXO Density", category: "network", description: "Average outputs per block. Higher density = more efficient blockspace usage." },
  { key: "congestion", label: "Congestion", category: "network", description: "Network congestion indicator. High values = fee pressure and blockspace competition." },

  // ── Profit / Loss ──────────────────────────────────────
  { key: "supply_in_profit_pct", label: "Supply in Profit", category: "profit", description: "Percentage of circulating supply currently in profit. Above 95% = overheated." },
  { key: "profit_ratio", label: "Profit Ratio", category: "profit", description: "Ratio of profitable to total spent outputs. Above 0.5 = majority selling at profit." },
  { key: "profit_momentum", label: "Profit Momentum", category: "profit", description: "Rate of change in profit-taking. Accelerating profit = potential top." },
  { key: "profit_osc", label: "Profit Oscillator", category: "profit", description: "Mean-reverting profit oscillator. Extremes signal regime shifts." },
  { key: "net_realized_pl", label: "Net Realized P/L", category: "profit", description: "Net realized profit minus loss in USD. Positive = net capital inflow." },
  { key: "realized_pl_ratio", label: "Realized P/L Ratio", category: "profit", description: "Ratio of realized profit to loss. Above 1 = profit-dominant, below 1 = loss-dominant." },
  { key: "capitulation", label: "Capitulation", category: "profit", description: "Binary capitulation flag. 1 = widespread loss-taking detected, historically marks bottoms." },
  { key: "euphoria", label: "Euphoria", category: "profit", description: "Binary euphoria flag. 1 = extreme profit-taking detected, historically marks tops." },

  // ── Whale Activity ─────────────────────────────────────
  { key: "whale_awakening", label: "Whale Awakening", category: "whale", description: "Detection of very old coins (5yr+) moving. Spikes signal major holder decisions." },
  { key: "whale_spike", label: "Whale Spike", category: "whale", description: "Magnitude of whale transaction spikes. Larger = more significant whale activity." },
  { key: "ancient_moved", label: "Ancient Moved", category: "whale", description: "Total BTC moved from ancient (very old) UTXOs. Raw volume of whale activity." },
  { key: "ancient_pct", label: "Ancient %", category: "whale", description: "Percentage of daily volume from ancient coins. High = old money is distributing." },

  // ── Valuation Models ───────────────────────────────────
  { key: "puell_multiple", label: "Puell Multiple", category: "valuation", description: "Daily miner revenue divided by 365-day average. Below 0.5 = miner capitulation, above 4 = overheated." },
  { key: "stock_to_flow", label: "Stock-to-Flow", category: "valuation", description: "Existing supply divided by annual new issuance. Higher ratio = greater scarcity." },
  { key: "onchain_signal", label: "On-Chain Signal", category: "valuation", description: "Composite of multiple on-chain indicators. Above 0.6 = bullish, below 0.4 = bearish." },
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
