export interface MetricRow {
  date: string;
  price_close: number | null;
  market_value_usd: number | null;
  realized_value_usd: number | null;
  realized_profit_usd: number | null;
  realized_loss_usd: number | null;
  realized_profit_loss_ratio: number | null;
  sopr: number | null;
  asopr: number | null;
  mvrv: number | null;
  mvrv_zscore: number | null;
  nupl: number | null;
  cdd: number | null;
  adjusted_cdd: number | null;
  dormancy_flow: number | null;
  utxo_profit_share: number | null;
  drawdown_pct: number | null;
  supply_btc: number | null;
  supply_sats: number | null;
  supply_cost_basis_usd: number | null;
  pipeline_version: string | null;
  lineage_id: string | null;
  hodl_share_000_001d: number | null;
  hodl_share_001_007d: number | null;
  hodl_share_007_030d: number | null;
  hodl_share_030_180d: number | null;
  hodl_share_180_365d: number | null;
  hodl_share_365d_plus: number | null;
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

export interface SignalThreshold {
  green: { min?: number; max?: number };
  yellow: { min?: number; max?: number };
  red: { min?: number; max?: number };
}

export type SignalZone = "green" | "yellow" | "red";
