"use client";

import { groupedMetrics, categoryLabels } from "@/lib/metrics";
import type { MetricCategory } from "@/lib/types";

interface MetricSelectorProps {
  selected: string[];
  onToggle: (key: string) => void;
}

const METRIC_COLORS: Record<string, string> = {
  price: "#3b82f6",
  sopr: "#a78bfa",
  mvrv: "#22c55e",
  cdd: "#f59e0b",
  liveliness: "#06b6d4",
  hodl: "#ec4899",
  age: "#8b5cf6",
  holder: "#14b8a6",
  network: "#f97316",
  profit: "#10b981",
  whale: "#ef4444",
  valuation: "#6366f1",
};

export default function MetricSelector({
  selected,
  onToggle,
}: MetricSelectorProps) {
  const groups = groupedMetrics();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="border-b border-zinc-800/60 px-4 py-3">
        <h2 className="font-[family-name:var(--font-mono)] text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-400">
          Metrics
        </h2>
        <p className="mt-0.5 text-[10px] text-zinc-600">
          {selected.length} selected
        </p>
      </div>

      {/* Scrollable metric list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {Object.entries(groups).map(([category, metrics]) => {
          const catColor =
            METRIC_COLORS[category] ?? "var(--text-secondary)";

          return (
            <div key={category} className="mb-3">
              {/* Category header */}
              <p
                className="mb-1 px-2 text-[9px] font-bold tracking-[0.18em] uppercase"
                style={{ color: catColor, opacity: 0.7 }}
              >
                {categoryLabels[category as MetricCategory] ?? category}
              </p>

              {/* Metric buttons */}
              <div className="flex flex-col gap-px">
                {metrics.map((m) => {
                  const isActive = selected.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      onClick={() => onToggle(m.key)}
                      title={m.description}
                      className={`group relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-all duration-150 ${
                        isActive
                          ? "text-white"
                          : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300"
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: `${catColor}18`,
                              color: catColor,
                            }
                          : undefined
                      }
                    >
                      {/* Active indicator dot */}
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-150 ${
                          isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        }`}
                        style={{ backgroundColor: catColor }}
                      />
                      <span
                        className={`transition-transform duration-150 ${
                          isActive ? "translate-x-0" : "-translate-x-3.5"
                        }`}
                      >
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
