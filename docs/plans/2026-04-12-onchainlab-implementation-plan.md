# OnChainLab Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a public Bitcoin on-chain analytics dashboard at onchainlab.cloud with two views — a clean Overview for general users and an advanced Lab for analysts.

**Architecture:** Next.js static export served from Cloudflare Pages. CSV data loaded client-side with PapaParse, rendered with Recharts (Overview) and TradingView Lightweight Charts (Lab). Tailwind CSS dark theme.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Recharts, lightweight-charts, PapaParse

**Design Doc:** `docs/plans/2026-04-12-onchainlab-website-design.md`

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Git & Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`

**Step 1: Initialize git**

```bash
cd D:/VSCode/OnChainLab
git init
```

**Step 2: Scaffold Next.js with TypeScript and Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --no-turbopack
```

Accept overwriting existing files if prompted. This creates the full Next.js scaffold with App Router, TypeScript, Tailwind, and ESLint.

**Step 3: Configure static export**

Edit `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

**Step 4: Install dashboard dependencies**

```bash
npm install recharts lightweight-charts papaparse
npm install -D @types/papaparse
```

**Step 5: Verify it builds**

```bash
npm run build
```

Expected: Successful static export to `out/` directory.

**Step 6: Create .gitignore additions and commit**

Ensure `.gitignore` includes `out/` and `node_modules/`. Then:

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind, Recharts, Lightweight Charts"
```

---

### Task 2: Add Data Files & Data Loader

**Files:**
- Create: `public/data/all_metrics.csv` (copy from pipeline output)
- Create: `src/lib/data.ts`
- Create: `src/lib/types.ts`
- Test: `src/lib/__tests__/data.test.ts`

**Step 1: Copy CSV data into project**

Copy `all_metrics.csv` from the pipeline repo (`github.com/gogs1998/GN.git`, `onchain-lab` folder) into `public/data/all_metrics.csv`.

If the file isn't available locally, clone the repo and copy:
```bash
git clone https://github.com/gogs1998/GN.git /tmp/GN
cp /tmp/GN/onchain-lab/all_metrics.csv public/data/all_metrics.csv
```

**Step 2: Define TypeScript types**

Create `src/lib/types.ts`:
```typescript
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
  [key: string]: string | number | null; // Allow dynamic access to all 131 metrics
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
```

**Step 3: Create data loader**

Create `src/lib/data.ts`:
```typescript
import Papa from "papaparse";
import type { MetricRow } from "./types";

let cachedData: MetricRow[] | null = null;

export async function loadMetrics(): Promise<MetricRow[]> {
  if (cachedData) return cachedData;

  const response = await fetch("/data/all_metrics.csv");
  const csvText = await response.text();

  const parsed = Papa.parse<MetricRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  cachedData = parsed.data;
  return cachedData;
}

export function getLatestRow(data: MetricRow[]): MetricRow {
  return data[data.length - 1];
}

export function getMetricSeries(
  data: MetricRow[],
  metric: string
): { date: string; value: number }[] {
  return data
    .filter((row) => row[metric] != null)
    .map((row) => ({
      date: row.date,
      value: row[metric] as number,
    }));
}

export function getLastNDays(data: MetricRow[], n: number): MetricRow[] {
  return data.slice(-n);
}
```

**Step 4: Write tests**

Install test deps:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/lib/__tests__/data.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { getLatestRow, getMetricSeries, getLastNDays } from "../data";
import type { MetricRow } from "../types";

const mockData: MetricRow[] = [
  { date: "2025-01-01", btc_price: 40000 } as MetricRow,
  { date: "2025-01-02", btc_price: 41000 } as MetricRow,
  { date: "2025-01-03", btc_price: null } as MetricRow,
  { date: "2025-01-04", btc_price: 42000 } as MetricRow,
];

describe("getLatestRow", () => {
  it("returns the last row", () => {
    expect(getLatestRow(mockData).date).toBe("2025-01-04");
  });
});

describe("getMetricSeries", () => {
  it("filters out null values", () => {
    const series = getMetricSeries(mockData, "btc_price");
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
```

**Step 5: Run tests**

```bash
npm test
```

Expected: 3 tests PASS.

**Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/data.ts src/lib/__tests__/data.test.ts vitest.config.ts public/data/.gitkeep
git commit -m "feat: add data types, CSV loader, and utility functions with tests"
```

Note: Do NOT commit the 10.9MB CSV yet. Add `public/data/all_metrics.csv` to `.gitignore` for now — we'll handle large file strategy later. Add a `.gitkeep` in `public/data/` as a placeholder.

---

### Task 3: Signal Thresholds Config

**Files:**
- Create: `src/lib/signals.ts`
- Test: `src/lib/__tests__/signals.test.ts`

**Step 1: Write the failing test**

Create `src/lib/__tests__/signals.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { getSignalZone } from "../signals";

describe("getSignalZone", () => {
  it("returns green for NUPL > 0.5", () => {
    expect(getSignalZone("nupl", 0.6)).toBe("green");
  });

  it("returns yellow for NUPL between 0.25 and 0.5", () => {
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
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/signals.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement signals**

Create `src/lib/signals.ts`:
```typescript
import type { SignalZone } from "./types";

interface ThresholdConfig {
  green: (v: number) => boolean;
  yellow: (v: number) => boolean;
  red: (v: number) => boolean;
}

const thresholds: Record<string, ThresholdConfig> = {
  nupl: {
    green: (v) => v > 0.5,
    yellow: (v) => v >= 0 && v <= 0.5,
    red: (v) => v < 0,
  },
  mvrv_zscore: {
    green: (v) => v < 2,
    yellow: (v) => v >= 2 && v <= 7,
    red: (v) => v > 7,
  },
  sopr: {
    green: (v) => v > 1.05,
    yellow: (v) => v >= 0.95 && v <= 1.05,
    red: (v) => v < 0.95,
  },
  reserve_risk: {
    green: (v) => v < 0.005,
    yellow: (v) => v >= 0.005 && v <= 0.02,
    red: (v) => v > 0.02,
  },
  puell_multiple: {
    green: (v) => v < 0.5,
    yellow: (v) => v >= 0.5 && v <= 4,
    red: (v) => v > 4,
  },
  rsi_14: {
    green: (v) => v > 50 && v < 70,
    yellow: (v) => v >= 30 && v <= 50,
    red: (v) => v < 30 || v > 70,
  },
};

export function getSignalZone(
  metric: string,
  value: number | null
): SignalZone | null {
  if (value == null) return null;
  const config = thresholds[metric];
  if (!config) return null;

  if (config.green(value)) return "green";
  if (config.red(value)) return "red";
  return "yellow";
}

export function getSignalColor(zone: SignalZone | null): string {
  switch (zone) {
    case "green":
      return "#22c55e";
    case "yellow":
      return "#eab308";
    case "red":
      return "#ef4444";
    default:
      return "#6b7280";
  }
}
```

**Step 4: Run tests**

```bash
npx vitest run src/lib/__tests__/signals.test.ts
```

Expected: 6 tests PASS.

**Step 5: Commit**

```bash
git add src/lib/signals.ts src/lib/__tests__/signals.test.ts
git commit -m "feat: add signal threshold system with zone classification"
```

---

## Phase 2: Shared Layout & Navigation

### Task 4: App Layout, Fonts, Dark Theme

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/Nav.tsx`

**Step 1: Set up global styles**

Replace `src/app/globals.css` with:
```css
@import "tailwindcss";

:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-card: #1a1a2e;
  --text-primary: #e4e4e7;
  --text-secondary: #a1a1aa;
  --accent: #3b82f6;
  --green: #22c55e;
  --yellow: #eab308;
  --red: #ef4444;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

**Step 2: Create Nav component**

Create `src/components/Nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-[var(--bg-secondary)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-mono text-xl font-bold tracking-tight">
          OnChain<span className="text-blue-500">Lab</span>
        </Link>
        <div className="flex gap-1 rounded-lg bg-zinc-800/50 p-1">
          <Link
            href="/overview"
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/overview"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/lab"
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/lab"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Lab
          </Link>
        </div>
        <a
          href="https://github.com/gogs1998/GN"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}
```

**Step 3: Update layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "OnChainLab — Bitcoin On-Chain Analytics",
  description:
    "Open-source Bitcoin on-chain analytics. 131 metrics. 17 years of data. Zero cost.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-[family-name:var(--font-sans)] antialiased">
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

**Step 4: Verify dev server renders**

```bash
npm run dev
```

Open http://localhost:3000 — should see dark background, "OnChainLab" in nav with Dashboard/Lab toggle and GitHub link.

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/Nav.tsx
git commit -m "feat: add dark theme layout with nav bar and view toggle"
```

---

### Task 5: Data Provider Context

**Files:**
- Create: `src/components/DataProvider.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create data context**

Create `src/components/DataProvider.tsx`:
```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { loadMetrics } from "@/lib/data";
import type { MetricRow } from "@/lib/types";

interface DataContextValue {
  data: MetricRow[];
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextValue>({
  data: [],
  loading: true,
  error: null,
});

export function useMetrics() {
  return useContext(DataContext);
}

export default function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error }}>
      {loading ? (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-zinc-500">Loading 17 years of on-chain data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-red-400">Failed to load data: {error}</p>
        </div>
      ) : (
        children
      )}
    </DataContext.Provider>
  );
}
```

**Step 2: Wrap layout with DataProvider**

In `src/app/layout.tsx`, import DataProvider and wrap `<main>`:
```tsx
import DataProvider from "@/components/DataProvider";

// In the return, wrap main:
<Nav />
<DataProvider>
  <main>{children}</main>
</DataProvider>
```

**Step 3: Verify loading spinner shows, then data loads**

```bash
npm run dev
```

Open http://localhost:3000 — should see loading spinner, then content once CSV is parsed (or error if CSV not in place yet).

**Step 4: Commit**

```bash
git add src/components/DataProvider.tsx src/app/layout.tsx
git commit -m "feat: add data provider context with loading state"
```

---

## Phase 3: Landing Page

### Task 6: Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/StatCard.tsx`
- Create: `src/components/PriceSparkline.tsx`

**Step 1: Create StatCard component**

Create `src/components/StatCard.tsx`:
```tsx
import { getSignalZone, getSignalColor } from "@/lib/signals";

interface StatCardProps {
  label: string;
  value: number | null;
  metric?: string;
  format?: (v: number) => string;
}

export default function StatCard({ label, value, metric, format }: StatCardProps) {
  const zone = metric && value != null ? getSignalZone(metric, value) : null;
  const borderColor = getSignalColor(zone);

  const formatted =
    value != null
      ? format
        ? format(value)
        : value.toLocaleString()
      : "—";

  return (
    <div
      className="rounded-xl bg-[var(--bg-card)] p-6 border-l-4"
      style={{ borderLeftColor: borderColor }}
    >
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold">{formatted}</p>
    </div>
  );
}
```

**Step 2: Create PriceSparkline component**

Create `src/components/PriceSparkline.tsx`:
```tsx
"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useMetrics } from "./DataProvider";
import { getLastNDays, getMetricSeries } from "@/lib/data";

export default function PriceSparkline() {
  const { data } = useMetrics();
  const recent = getLastNDays(data, 90);
  const series = getMetricSeries(recent, "btc_price");

  return (
    <div className="absolute inset-0 opacity-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series}>
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Step 3: Build the landing page**

Replace `src/app/page.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useMetrics } from "@/components/DataProvider";
import { getLatestRow } from "@/lib/data";
import StatCard from "@/components/StatCard";
import PriceSparkline from "@/components/PriceSparkline";

export default function Home() {
  const { data } = useMetrics();
  const latest = getLatestRow(data);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 text-center">
        <PriceSparkline />
        <div className="relative z-10">
          <h1 className="font-mono text-5xl font-bold tracking-tight">
            OnChain<span className="text-blue-500">Lab</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Open-source Bitcoin on-chain analytics
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            131 metrics &middot; 17 years of data &middot; Zero cost
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/overview"
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/lab"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-medium text-zinc-300 hover:border-zinc-500 transition-colors"
            >
              Lab
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="BTC Price"
            value={latest.btc_price}
            format={(v) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          />
          <StatCard
            label="MVRV Z-Score"
            metric="mvrv_zscore"
            value={latest.mvrv_zscore ?? null}
            format={(v) => v.toFixed(2)}
          />
          <StatCard
            label="NUPL"
            metric="nupl"
            value={latest.nupl ?? null}
            format={(v) => v.toFixed(3)}
          />
        </div>
      </section>

      {/* About blurb */}
      <section className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-zinc-400">
          OnChainLab is a free, open-source Bitcoin analytics tool. All data is
          derived from the public blockchain — updated daily, no account
          required. Built for researchers, investors, and the curious.
        </p>
        <p className="mt-4 text-sm text-zinc-600">
          Data last updated: {latest.date}
        </p>
      </section>
    </div>
  );
}
```

**Step 4: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000 — should see hero with sparkline background, three stat cards, about text. Cards should show live values from the CSV.

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/StatCard.tsx src/components/PriceSparkline.tsx
git commit -m "feat: build landing page with hero, stat cards, and price sparkline"
```

---

## Phase 4: Overview Dashboard

### Task 7: Overview Page Layout

**Files:**
- Create: `src/app/overview/page.tsx`
- Create: `src/components/overview/SectionHeader.tsx`
- Create: `src/components/overview/MetricCard.tsx`

**Step 1: Create SectionHeader**

Create `src/components/overview/SectionHeader.tsx`:
```tsx
export default function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="mb-4 mt-10 font-mono text-lg font-semibold text-zinc-300 border-b border-zinc-800 pb-2">
      {title}
    </h2>
  );
}
```

**Step 2: Create MetricCard with sparkline and explanation**

Create `src/components/overview/MetricCard.tsx`:
```tsx
"use client";

import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { getSignalZone, getSignalColor } from "@/lib/signals";

interface MetricCardProps {
  label: string;
  metric: string;
  value: number | null;
  description: string;
  sparkData: { date: string; value: number }[];
  format?: (v: number) => string;
}

export default function MetricCard({
  label,
  metric,
  value,
  description,
  sparkData,
  format,
}: MetricCardProps) {
  const zone = getSignalZone(metric, value);
  const color = getSignalColor(zone);

  const formatted =
    value != null
      ? format
        ? format(value)
        : value.toFixed(2)
      : "—";

  return (
    <div className="rounded-xl bg-[var(--bg-card)] p-5 border border-zinc-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 font-mono text-xl font-bold" style={{ color }}>
            {formatted}
          </p>
        </div>
        <div className="h-10 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.slice(-90)}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">{description}</p>
    </div>
  );
}
```

**Step 3: Build the Overview page**

Create `src/app/overview/page.tsx`:
```tsx
"use client";

import { useMetrics } from "@/components/DataProvider";
import { getLatestRow, getMetricSeries } from "@/lib/data";
import SectionHeader from "@/components/overview/SectionHeader";
import MetricCard from "@/components/overview/MetricCard";

const fmt = (decimals: number) => (v: number) => v.toFixed(decimals);
const fmtUsd = (v: number) =>
  `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;

interface CardDef {
  label: string;
  metric: string;
  description: string;
  format?: (v: number) => string;
}

const sections: { title: string; cards: CardDef[] }[] = [
  {
    title: "Market Pulse",
    cards: [
      { label: "BTC Price", metric: "btc_price", description: "Current Bitcoin price (USD)", format: fmtUsd },
      { label: "RSI (14)", metric: "rsi_14", description: "Relative Strength Index — above 70 is overbought, below 30 is oversold", format: fmt(1) },
      { label: "Price Momentum", metric: "price_momentum", description: "Short-term price trend strength" , format: fmt(3) },
      { label: "200MA Ratio", metric: "price_200ma_ratio", description: "Price relative to 200-day moving average — above 1 means bullish trend", format: fmt(2) },
    ],
  },
  {
    title: "Cycle Position",
    cards: [
      { label: "MVRV Z-Score", metric: "mvrv_zscore", description: "Market value vs realized value — high values signal overvaluation", format: fmt(2) },
      { label: "NUPL", metric: "nupl", description: "Net Unrealized Profit/Loss — measures overall market profitability", format: fmt(3) },
      { label: "Puell Multiple", metric: "puell_multiple", description: "Miner revenue relative to yearly average — extreme values mark cycle tops/bottoms", format: fmt(2) },
      { label: "Reserve Risk", metric: "reserve_risk", description: "Confidence of long-term holders relative to price — low = good time to invest", format: fmt(4) },
    ],
  },
  {
    title: "Smart Money",
    cards: [
      { label: "STH/LTH Ratio", metric: "sth_lth_ratio", description: "Short-term vs long-term holder balance — high means more speculative activity", format: fmt(2) },
      { label: "Whale Awakening", metric: "whale_awakening", description: "Very old coins (5yr+) moving — spikes indicate major holder activity", format: fmt(0) },
      { label: "Accumulation Signal", metric: "accumulation_signal", description: "Composite signal of holder accumulation behavior", format: fmt(3) },
      { label: "LTH Selling", metric: "lth_selling", description: "Long-term holder distribution intensity", format: fmt(3) },
    ],
  },
  {
    title: "Network Health",
    cards: [
      { label: "Velocity", metric: "velocity", description: "How actively the supply is circulating — higher means more transactional use", format: fmt(4) },
      { label: "UTXO Growth", metric: "utxo_growth", description: "Net change in unspent outputs — growing means adoption", format: fmt(0) },
      { label: "Congestion", metric: "congestion", description: "Network utilization and fee pressure", format: fmt(3) },
      { label: "Liveliness", metric: "liveliness", description: "Ratio of cumulative coin-days destroyed to created — rising means spending", format: fmt(4) },
    ],
  },
  {
    title: "Signals",
    cards: [
      { label: "Capitulation", metric: "capitulation", description: "Widespread loss-taking detected — historically marks market bottoms", format: fmt(0) },
      { label: "Euphoria", metric: "euphoria", description: "Extreme profit-taking detected — historically marks market tops", format: fmt(0) },
      { label: "On-Chain Signal", metric: "onchain_signal", description: "Composite of multiple on-chain indicators", format: fmt(3) },
      { label: "Supply in Profit", metric: "supply_in_profit_pct", description: "Percentage of circulating supply currently in profit", format: fmtPct },
    ],
  },
];

export default function OverviewPage() {
  const { data } = useMetrics();
  const latest = getLatestRow(data);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20">
      <div className="pt-6 pb-2">
        <h1 className="font-mono text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Market snapshot for {latest.date}
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <SectionHeader title={section.title} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {section.cards.map((card) => (
              <MetricCard
                key={card.metric}
                label={card.label}
                metric={card.metric}
                value={(latest[card.metric] as number) ?? null}
                description={card.description}
                sparkData={getMetricSeries(data, card.metric)}
                format={card.format}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000/overview — should see 5 sections, 20 metric cards with sparklines, color-coded values, and descriptions.

**Step 5: Commit**

```bash
git add src/app/overview/ src/components/overview/
git commit -m "feat: build overview dashboard with metric cards and sparklines"
```

---

## Phase 5: Lab View (Advanced)

### Task 8: Lab Page with TradingView Charts

**Files:**
- Create: `src/app/lab/page.tsx`
- Create: `src/components/lab/ChartPanel.tsx`
- Create: `src/components/lab/MetricSelector.tsx`
- Create: `src/lib/metrics.ts`

**Step 1: Create metric catalog**

Create `src/lib/metrics.ts`:
```typescript
import type { MetricCategory, MetricMeta } from "./types";

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
```

**Step 2: Create MetricSelector sidebar**

Create `src/components/lab/MetricSelector.tsx`:
```tsx
"use client";

import { metricCatalog, categoryLabels } from "@/lib/metrics";
import type { MetricCategory } from "@/lib/types";

interface MetricSelectorProps {
  selected: string[];
  onToggle: (key: string) => void;
}

export default function MetricSelector({ selected, onToggle }: MetricSelectorProps) {
  const categories = Object.entries(categoryLabels) as [MetricCategory, string][];

  return (
    <div className="h-full overflow-y-auto border-r border-zinc-800 bg-[var(--bg-secondary)] p-4 w-64">
      <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Metrics
      </h2>
      {categories.map(([cat, label]) => {
        const metrics = metricCatalog.filter((m) => m.category === cat);
        if (metrics.length === 0) return null;
        return (
          <div key={cat} className="mb-4">
            <p className="mb-1 text-xs font-semibold text-zinc-500 uppercase">
              {label}
            </p>
            {metrics.map((m) => (
              <button
                key={m.key}
                onClick={() => onToggle(m.key)}
                className={`block w-full text-left rounded px-2 py-1 text-sm transition-colors ${
                  selected.includes(m.key)
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 3: Create TradingView chart panel**

Create `src/components/lab/ChartPanel.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { createChart, type IChartApi, type ISeriesApi, LineSeries } from "lightweight-charts";

interface ChartPanelProps {
  label: string;
  data: { date: string; value: number }[];
  onRemove: () => void;
}

export default function ChartPanel({ label, data, onRemove }: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#1a1a2e" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: "#27272a",
      },
      rightPriceScale: {
        borderColor: "#27272a",
      },
      width: containerRef.current.clientWidth,
      height: 300,
    });

    const series = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 2,
    });

    series.setData(
      data.map((d) => ({
        time: d.date,
        value: d.value,
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="rounded-lg border border-zinc-800 bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="font-mono text-sm text-zinc-300">{label}</span>
        <button
          onClick={onRemove}
          className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
        >
          Remove
        </button>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
```

**Step 4: Build the Lab page**

Create `src/app/lab/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useMetrics } from "@/components/DataProvider";
import { getMetricSeries } from "@/lib/data";
import { metricCatalog } from "@/lib/metrics";
import MetricSelector from "@/components/lab/MetricSelector";
import ChartPanel from "@/components/lab/ChartPanel";

export default function LabPage() {
  const { data } = useMetrics();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "btc_price",
    "mvrv_zscore",
  ]);

  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const removeMetric = (key: string) => {
    setSelectedMetrics((prev) => prev.filter((k) => k !== key));
  };

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <MetricSelector selected={selectedMetrics} onToggle={toggleMetric} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h1 className="font-mono text-2xl font-bold">Lab</h1>
          <p className="text-sm text-zinc-500">
            Select metrics from the sidebar to add charts. Click to toggle.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {selectedMetrics.map((key) => {
            const meta = metricCatalog.find((m) => m.key === key);
            return (
              <ChartPanel
                key={key}
                label={meta?.label ?? key}
                data={getMetricSeries(data, key)}
                onRemove={() => removeMetric(key)}
              />
            );
          })}
        </div>
        {selectedMetrics.length === 0 && (
          <div className="flex h-64 items-center justify-center text-zinc-600">
            Select a metric from the sidebar to start charting.
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 5: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000/lab — should see sidebar with metric categories, two default charts (BTC Price + MVRV Z-Score). Click metrics to add/remove panels.

**Step 6: Commit**

```bash
git add src/app/lab/ src/components/lab/ src/lib/metrics.ts
git commit -m "feat: build lab view with TradingView charts and metric selector sidebar"
```

---

## Phase 6: About Page & Polish

### Task 9: About Page

**Files:**
- Create: `src/app/about/page.tsx`

**Step 1: Create about page**

Create `src/app/about/page.tsx`:
```tsx
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-mono text-3xl font-bold">About OnChainLab</h1>

      <section className="mt-8">
        <h2 className="font-mono text-xl font-semibold text-zinc-300">What is this?</h2>
        <p className="mt-2 text-zinc-400 leading-relaxed">
          OnChainLab is a free, open-source Bitcoin on-chain analytics dashboard.
          It tracks 131 metrics derived from the public Bitcoin blockchain, with
          daily data going back to January 2009.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-xl font-semibold text-zinc-300">Data Sources</h2>
        <p className="mt-2 text-zinc-400 leading-relaxed">
          All metrics are computed from Bitcoin&apos;s UTXO set and public blockchain
          data. No proprietary data sources are used. The pipeline runs daily and
          produces a static CSV that powers this dashboard.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-xl font-semibold text-zinc-300">Methodology Notes</h2>
        <ul className="mt-2 space-y-2 text-zinc-400 text-sm">
          <li><strong className="text-zinc-300">Realized Cap:</strong> Calculated as total_mined_btc &times; price_200ma (project convention)</li>
          <li><strong className="text-zinc-300">SOPR:</strong> Spent Output Profit Ratio — values above 1 indicate coins moving at a profit</li>
          <li><strong className="text-zinc-300">MVRV:</strong> Market Value to Realized Value — high Z-scores signal overvaluation</li>
          <li><strong className="text-zinc-300">CDD:</strong> Coin Days Destroyed — measures how old the coins being spent are</li>
          <li><strong className="text-zinc-300">aSOPR:</strong> Adjusted SOPR is intentionally sparse (~88% null) — only computed on specific days</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-xl font-semibold text-zinc-300">Download Raw Data</h2>
        <div className="mt-2 flex gap-4">
          <a
            href="/data/all_metrics.csv"
            download
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors"
          >
            Download CSV (10.9 MB)
          </a>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-xl font-semibold text-zinc-300">Open Source</h2>
        <p className="mt-2 text-zinc-400 leading-relaxed">
          The full pipeline and dashboard source code is available on{" "}
          <a
            href="https://github.com/gogs1998/GN"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            GitHub
          </a>
          . Contributions welcome.
        </p>
      </section>
    </div>
  );
}
```

**Step 2: Add About link to Nav**

In `src/components/Nav.tsx`, add an About link next to the GitHub link:
```tsx
<div className="flex items-center gap-4">
  <Link
    href="/about"
    className="text-sm text-zinc-500 hover:text-zinc-300"
  >
    About
  </Link>
  <a
    href="https://github.com/gogs1998/GN"
    target="_blank"
    rel="noopener noreferrer"
    className="text-sm text-zinc-500 hover:text-zinc-300"
  >
    GitHub
  </a>
</div>
```

**Step 3: Verify in browser**

```bash
npm run dev
```

Open http://localhost:3000/about — should see methodology notes and download link.

**Step 4: Commit**

```bash
git add src/app/about/ src/components/Nav.tsx
git commit -m "feat: add about page with methodology notes and data download"
```

---

### Task 10: Build & Deploy Setup

**Files:**
- Modify: `next.config.ts` (already configured)
- Create: `.github/README.md` (optional — for repo description)

**Step 1: Verify full static build**

```bash
npm run build
```

Expected: Clean build, static export to `out/` directory with all pages.

**Step 2: Test production build locally**

```bash
npx serve out
```

Open http://localhost:3000 and verify all pages work: landing, overview, lab, about.

**Step 3: Push to GitHub**

```bash
git remote add origin https://github.com/gogs1998/GN.git
git push -u origin main
```

(Or create a new dedicated repo if preferred — the design doc mentions the monorepo but a standalone repo may be cleaner for Cloudflare Pages.)

**Step 4: Connect Cloudflare Pages**

Manual steps (done in Cloudflare dashboard):
1. Go to Cloudflare Dashboard > Pages > Create a project
2. Connect GitHub repo
3. Build settings:
   - Framework preset: Next.js (Static HTML Export)
   - Build command: `npm run build`
   - Build output directory: `out`
4. Deploy

**Step 5: Connect domain**

In Cloudflare Dashboard:
1. Buy `onchainlab.cloud` via Cloudflare Registrar
2. In Pages project settings > Custom domains > Add `onchainlab.cloud`
3. DNS is auto-configured since domain is on Cloudflare

**Step 6: Commit any final config**

```bash
git add -A
git commit -m "chore: finalize build config for Cloudflare Pages deployment"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1: Scaffolding | Tasks 1-3 | Next.js project, data loader, signal system |
| 2: Layout | Tasks 4-5 | Dark theme, nav, data context provider |
| 3: Landing | Task 6 | Hero page with stat cards and sparkline |
| 4: Overview | Task 7 | Full dashboard with 20 metric cards across 5 sections |
| 5: Lab | Task 8 | Advanced TradingView chart view with metric selector |
| 6: Polish | Tasks 9-10 | About page, build verification, deployment |

Total: **10 tasks, ~10 commits**
