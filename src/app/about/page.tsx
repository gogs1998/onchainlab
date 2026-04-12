import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — OnChainLab",
  description:
    "About OnChainLab: free, open-source Bitcoin on-chain analytics dashboard.",
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
          OnChainLab is a free, open-source Bitcoin on-chain analytics dashboard.
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

      {/* Download Raw Data */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Download Raw Data
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
          The full dataset is available as a single CSV file containing all 131
          metrics.
        </p>
        <a
          href="/data/all_metrics.csv"
          download
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-[var(--bg-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-zinc-500 hover:bg-[var(--bg-secondary)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          all_metrics.csv
        </a>
      </section>

      {/* Open Source */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Open Source
        </h2>
        <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
          OnChainLab is fully open source. View the code, report issues, or
          contribute on GitHub.
        </p>
        <a
          href="https://github.com/gogs1998/GN"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-[var(--bg-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-zinc-500 hover:bg-[var(--bg-secondary)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          github.com/gogs1998/GN
        </a>
      </section>
    </div>
  );
}
