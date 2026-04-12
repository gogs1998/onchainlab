import { describe, it, expect } from "vitest";
import { getLatestRow, getMetricSeries, getLastNDays } from "../data";
import type { MetricRow } from "../types";

const mockData: MetricRow[] = [
  { date: "2025-01-01", price_close: 40000 } as MetricRow,
  { date: "2025-01-02", price_close: 41000 } as MetricRow,
  { date: "2025-01-03", price_close: null } as MetricRow,
  { date: "2025-01-04", price_close: 42000 } as MetricRow,
];

describe("getLatestRow", () => {
  it("returns the last row", () => {
    expect(getLatestRow(mockData).date).toBe("2025-01-04");
  });
});

describe("getMetricSeries", () => {
  it("filters out null values", () => {
    const series = getMetricSeries(mockData, "price_close");
    expect(series).toHaveLength(3);
    expect(series.map((s) => s.date)).not.toContain("2025-01-03");
  });
});

describe("getLastNDays", () => {
  it("returns last N rows", () => {
    const last2 = getLastNDays(mockData, 2);
    expect(last2).toHaveLength(2);
    expect(last2[0].date).toBe("2025-01-03");
  });
});
