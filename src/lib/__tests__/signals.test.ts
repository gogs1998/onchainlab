import { describe, it, expect } from "vitest";
import { getSignalZone, getSignalColor } from "../signals";

describe("getSignalZone", () => {
  it("returns green for NUPL > 0.5", () => {
    expect(getSignalZone("nupl", 0.6)).toBe("green");
  });

  it("returns yellow for NUPL between 0 and 0.5", () => {
    expect(getSignalZone("nupl", 0.3)).toBe("yellow");
  });

  it("returns red for NUPL < 0", () => {
    expect(getSignalZone("nupl", -0.1)).toBe("red");
  });

  it("returns yellow for MVRV Z-Score between 2 and 7", () => {
    expect(getSignalZone("mvrv_zscore", 4)).toBe("yellow");
  });

  it("returns null for unknown metric", () => {
    expect(getSignalZone("unknown_metric", 1)).toBeNull();
  });

  it("returns null for null value", () => {
    expect(getSignalZone("nupl", null)).toBeNull();
  });

  it("returns green for SOPR > 1.05", () => {
    expect(getSignalZone("sopr", 1.1)).toBe("green");
  });

  it("returns red for SOPR < 0.95", () => {
    expect(getSignalZone("sopr", 0.9)).toBe("red");
  });

  it("returns green for MVRV < 2", () => {
    expect(getSignalZone("mvrv", 1.5)).toBe("green");
  });

  it("returns red for MVRV > 3.5", () => {
    expect(getSignalZone("mvrv", 4.0)).toBe("red");
  });

  it("returns green for drawdown_pct > -0.1", () => {
    expect(getSignalZone("drawdown_pct", -0.05)).toBe("green");
  });

  it("returns red for drawdown_pct < -0.3", () => {
    expect(getSignalZone("drawdown_pct", -0.5)).toBe("red");
  });

  it("returns green for utxo_profit_share > 0.7", () => {
    expect(getSignalZone("utxo_profit_share", 0.8)).toBe("green");
  });

  it("returns red for utxo_profit_share < 0.4", () => {
    expect(getSignalZone("utxo_profit_share", 0.3)).toBe("red");
  });

  it("returns null for undefined value", () => {
    expect(getSignalZone("nupl", undefined)).toBeNull();
  });
});

describe("getSignalColor", () => {
  it("returns green hex for green zone", () => {
    expect(getSignalColor("green")).toBe("#22c55e");
  });

  it("returns yellow hex for yellow zone", () => {
    expect(getSignalColor("yellow")).toBe("#eab308");
  });

  it("returns red hex for red zone", () => {
    expect(getSignalColor("red")).toBe("#ef4444");
  });

  it("returns gray hex for null zone", () => {
    expect(getSignalColor(null)).toBe("#6b7280");
  });
});
