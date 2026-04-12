import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — OnChainLab",
  description:
    "About OnChainLab: free Bitcoin on-chain analytics dashboard.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {/* Header */}
      <h1 className="font-[family-name:var(--font-mono)] text-4xl font-bold tracking-tight">
        About <span className="text-[var(--accent)]">OnChainLab</span>
      </h1>

      {/* What is this? */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          What is this?
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
          OnChainLab is a free Bitcoin on-chain analytics dashboard.
          It tracks 131 metrics computed from the public blockchain, with daily
          data going back to 2009. No accounts, no paywalls, no tracking.
        </p>
      </section>

      {/* Data Sources */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Data Sources
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
          All metrics are computed from Bitcoin&apos;s UTXO set and public
          blockchain data. There are no proprietary data sources. The pipeline
          runs daily and produces a static CSV file that powers the entire
          dashboard.
        </p>
      </section>

      {/* Methodology Notes */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Methodology Notes
        </h2>
        <ul className="mt-3 space-y-3 text-[var(--text-secondary)]">
          <li className="leading-relaxed">
            <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)]">
              Realized Cap
            </span>{" "}
            — Calculated as{" "}
            <code className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-sm text-[var(--accent)]">
              total_mined_btc × price_200ma
            </code>
            . This is a project convention and differs from the standard
            definition.
          </li>
          <li className="leading-relaxed">
            <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)]">
              SOPR
            </span>{" "}
            — Spent Output Profit Ratio. Values above 1 indicate coins moved at
            a profit.
          </li>
          <li className="leading-relaxed">
            <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)]">
              MVRV
            </span>{" "}
            — Market Value to Realized Value. High Z-scores signal potential
            overvaluation.
          </li>
          <li className="leading-relaxed">
            <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)]">
              CDD
            </span>{" "}
            — Coin Days Destroyed. Measures the age of spent coins — a spike
            means long-dormant coins are moving.
          </li>
          <li className="leading-relaxed">
            <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)]">
              aSOPR
            </span>{" "}
            — Adjusted SOPR. Intentionally sparse in this dataset (~88% null
            values) due to filtering criteria.
          </li>
        </ul>
      </section>

    </div>
  );
}
