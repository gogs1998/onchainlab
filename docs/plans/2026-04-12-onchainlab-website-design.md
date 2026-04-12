# OnChainLab Website Design

## Overview

A free, public Bitcoin on-chain analytics dashboard serving two audiences: crypto-native analysts who want raw interactive charts, and general users who want a clean summary of market conditions. 131 metrics, 17 years of daily data, open-source.

## Stack & Infrastructure

| Component | Choice | Notes |
|-----------|--------|-------|
| Domain | onchainlab.cloud | Buy via Cloudflare Registrar (~$5/yr first year, ~$20/yr renewal) |
| Hosting | Cloudflare Pages (free tier) | Auto-deploys from GitHub on push |
| Framework | Next.js (static export) | `output: 'export'` — no server, pure static site on CDN |
| Charting (advanced) | Lightweight Charts (TradingView) | Time-series, crosshairs, dark theme |
| Charting (overview) | Recharts | Area charts, bar charts, clean cards |
| Styling | Tailwind CSS | Dark theme default |
| Data format | CSV (10.9 MB) loaded client-side | Parsed with PapaParse, cached in memory |

## Data Flow

1. Run Python pipeline locally, producing `all_metrics.csv`
2. CSV lives in repo under `/public/data/`
3. `git push` triggers Cloudflare Pages rebuild
4. Site loads CSV client-side on first visit, parses and caches in memory

## Page Structure

### Landing Page

- "OnChainLab" header in monospace/tech font (JetBrains Mono or Space Grotesk)
- Tagline: "Open-source Bitcoin on-chain analytics" or "131 metrics. 17 years of data. Zero cost."
- Subtle animated BTC price line (last 90 days, faded background)
- Three stat cards: current BTC price, MVRV Z-score, NUPL (color-coded zones)
- Two CTA buttons: "Dashboard" (Overview view) and "Lab" (advanced view)
- Brief "What is this?" paragraph (2-3 sentences)
- Footer: GitHub link, "Data last updated: YYYY-MM-DD", builder credit

### Overview View (general audience)

Clean dashboard cards with big numbers and sparklines. Color-coded signals (green/yellow/red). Each card has a one-sentence plain-English explanation.

**Sections:**
- **Market Pulse** — BTC price, RSI, momentum, MA cross signal
- **Cycle Position** — MVRV Z-score, NUPL, Puell Multiple, Reserve Risk
- **Smart Money** — STH/LTH ratio, whale awakening, accumulation signal
- **Network Health** — velocity, UTXO growth, congestion
- **Signals** — capitulation/euphoria flags, composite onchain signal

### Lab View (analysts/advanced)

Full TradingView-style dark interface:
- Large main chart area with metric selector dropdown
- Multi-panel layout — pin 2-4 charts side by side
- Raw values on hover, crosshairs synced across panels
- Metric categories as sidebar tabs (SOPR, MVRV, CDD, etc.)
- No explanations — just data, charts, labels

### About Page

- What metrics are included and where they come from
- Methodology notes (e.g., realized_cap = total_mined_btc * price_200ma)
- Download links for raw CSV/JSON data

## Signal & Color System (Overview View)

Each Overview card maps a metric to a zone:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| NUPL | > 0.5 (Belief) | 0.25 - 0.5 (Optimism) | < 0 (Capitulation) |
| MVRV Z-Score | < 2 (undervalued) | 2 - 7 (fair) | > 7 (overheated) |
| SOPR | > 1.05 (profit-taking) | 0.95 - 1.05 (neutral) | < 0.95 (loss-taking) |
| Reserve Risk | < 0.005 (accumulate) | 0.005 - 0.02 (hold) | > 0.02 (take profit) |
| Puell Multiple | < 0.5 (undervalued) | 0.5 - 4 (fair) | > 4 (overheated) |

Boolean flags (`capitulation`, `euphoria`) drive banner alerts at the top of the Overview.

`onchain_signal` composite metric powers a "market health" gauge on the landing page.

Thresholds stored in a JSON config file for easy tuning.

## View Toggle

Nav bar includes a toggle between "Overview" and "Lab" views. Shared navigation, different layouts.

## Data Notes

- 6,304 rows (2009-01-03 to 2026-04-12), 132 columns
- Early data (2009-2010) has NaN for price-dependent columns — btc_price starts ~2010-07-18
- `asopr` is intentionally sparse (~88% null)
- Use `btc_price` or `price_close`, not `price`
- All values are daily granularity, UTC close
