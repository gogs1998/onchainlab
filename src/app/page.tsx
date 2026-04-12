"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMetrics } from "@/components/DataProvider";
import { getLatestRow } from "@/lib/data";
import StatCard from "@/components/StatCard";
import PriceSparkline from "@/components/PriceSparkline";

function formatUSD(v: number): string {
  return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatDecimal(v: number): string {
  return v.toFixed(3);
}

export default function Home() {
  const { data } = useMetrics();

  const latest = useMemo(
    () => (data.length > 0 ? getLatestRow(data) : null),
    [data],
  );

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Sparkline watermark */}
      <PriceSparkline />

      {/* Hero */}
      <section className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 pb-16 text-center">
        <h1
          className="font-[family-name:var(--font-mono)] text-5xl font-bold tracking-tight sm:text-6xl"
          style={{
            animation: "fadeIn 0.8s ease-out both",
          }}
        >
          OnChain
          <span className="text-[var(--accent)]">Lab</span>
        </h1>

        <p
          className="mt-4 text-lg text-[var(--text-secondary)] sm:text-xl"
          style={{ animation: "fadeIn 0.8s ease-out 0.15s both" }}
        >
          Open-source Bitcoin on-chain analytics
        </p>

        <p
          className="mt-2 font-[family-name:var(--font-mono)] text-sm tracking-wide text-[var(--text-secondary)]"
          style={{
            animation: "fadeIn 0.8s ease-out 0.3s both",
            opacity: 0.6,
          }}
        >
          131 metrics &middot; 17 years of data &middot; Zero cost
        </p>

        {/* CTA Buttons */}
        <div
          className="mt-10 flex gap-4"
          style={{ animation: "fadeIn 0.8s ease-out 0.45s both" }}
        >
          <Link
            href="/overview"
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            Dashboard
          </Link>
          <Link
            href="/lab"
            className="rounded-lg border border-zinc-700 bg-[var(--bg-card)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-zinc-500 hover:bg-[var(--bg-secondary)]"
          >
            Lab
          </Link>
        </div>
      </section>

      {/* Stat Cards */}
      {latest && (
        <section
          className="relative mx-auto max-w-4xl px-4 pb-16"
          style={{ animation: "fadeIn 0.8s ease-out 0.6s both" }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="BTC Price"
              value={latest.btc_price}
              format={formatUSD}
            />
            <StatCard
              label="MVRV Z-Score"
              value={latest.mvrv_zscore}
              metric="mvrv_zscore"
              format={formatDecimal}
            />
            <StatCard
              label="NUPL"
              value={latest.nupl}
              metric="nupl"
              format={formatDecimal}
            />
          </div>
        </section>
      )}

      {/* About blurb */}
      <section
        className="relative mx-auto max-w-2xl px-4 pb-16 text-center"
        style={{ animation: "fadeIn 0.8s ease-out 0.75s both" }}
      >
        <div className="rounded-lg border border-zinc-800/60 bg-[var(--bg-card)]/50 px-6 py-6">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            OnChainLab is an open-source research tool that aggregates 131
            Bitcoin on-chain metrics spanning 17 years of blockchain history.
            Built for analysts, researchers, and long-term holders who want raw
            data without paywalls or vendor lock-in. All data is processed
            locally with zero tracking.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-zinc-800/50 py-6 text-center">
        <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-secondary)] opacity-50">
          Data last updated: {latest?.date ?? "---"}
        </p>
      </footer>
    </div>
  );
}
