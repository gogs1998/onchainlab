export interface MetricRow {
  date: string;
  btc_price: number | null;
  price_close: number | null;
  price_200ma_ratio: number | null;
  price_above_200ma: number | null;
  ma_cross_signal: number | null;
  rsi_14: number | null;
  price_momentum: number | null;
  price_vol: number | null;
  sopr: number | null;
  sopr_median: number | null;
  sopr_winsorized: number | null;
  sopr_zscore: number | null;
  sopr_percentile: number | null;
  sopr_ratio: number | null;
  sopr_deviation: number | null;
  sopr_momentum: number | null;
  sopr_osc: number | null;
  sth_sopr_proxy: number | null;
  lth_sopr_proxy: number | null;
  asopr: number | null;
  mvrv: number | null;
  mvrv_zscore: number | null;
  nupl: number | null;
  market_cap: number | null;
  realized_cap: number | null;
  thermocap_multiple: number | null;
  cdd: number | null;
  cdd_90d_avg: number | null;
  binary_cdd: number | null;
  supply_adj_cdd: number | null;
  cdd_per_output: number | null;
  cdd_clean: number | null;
  dormancy: number | null;
  dormancy_flow: number | null;
  dormancy_clean: number | null;
  liveliness: number | null;
  velocity: number | null;
  velocity_7d: number | null;
  velocity_30d: number | null;
  velocity_90d: number | null;
  velocity_momentum: number | null;
  velocity_clean: number | null;
  hodl_bank: number | null;
  reserve_risk: number | null;
  puell_multiple: number | null;
  stock_to_flow: number | null;
  supply_in_profit_pct: number | null;
  capitulation: number | null;
  euphoria: number | null;
  onchain_signal: number | null;
  accumulation_signal: number | null;
  sth_lth_ratio: number | null;
  pct_sth: number | null;
  pct_lth: number | null;
  lth_selling: number | null;
  sth_activity: number | null;
  whale_awakening: number | null;
  whale_spike: number | null;
  ancient_moved: number | null;
  ancient_pct: number | null;
  utxo_growth: number | null;
  congestion: number | null;
  tx_count_proxy: number | null;
  tx_momentum: number | null;
  profit_ratio: number | null;
  profit_momentum: number | null;
  profit_osc: number | null;
  net_realized_pl: number | null;
  realized_pl_ratio: number | null;
  cum_realized_profit: number | null;
  [key: string]: string | number | null;
}

export interface MetricMeta {
  key: string;
  label: string;
  category: MetricCategory;
  description: string;
  unit?: string;
}

export type MetricCategory =
  | "price"
  | "sopr"
  | "mvrv"
  | "cdd"
  | "liveliness"
  | "hodl"
  | "age"
  | "holder"
  | "network"
  | "profit"
  | "whale"
  | "valuation";

export type SignalZone = "green" | "yellow" | "red";
