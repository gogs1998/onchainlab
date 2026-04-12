"use client";

import { getSignalZone, getSignalColor } from "@/lib/signals";

interface StatCardProps {
  label: string;
  value: number | null;
  metric?: string;
  format?: (v: number) => string;
}

const defaultFormat = (v: number) => v.toLocaleString();

export default function StatCard({
  label,
  value,
  metric,
  format = defaultFormat,
}: StatCardProps) {
  const zone = metric && value != null ? getSignalZone(metric, value) : null;
  const borderColor = getSignalColor(zone);

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-[var(--bg-card)] px-5 py-5 transition-transform duration-200 hover:translate-y-[-2px]"
      style={{
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 h-16 w-16 opacity-[0.04]"
        style={{
          background: `radial-gradient(circle at top right, ${borderColor}, transparent 70%)`,
        }}
      />

      <p className="mb-1 text-xs font-medium tracking-widest uppercase text-[var(--text-secondary)]">
        {label}
      </p>
      <p
        className="font-[family-name:var(--font-mono)] text-2xl font-bold tracking-tight"
        style={{ color: zone ? borderColor : "var(--text-primary)" }}
      >
        {value != null ? format(value) : "---"}
      </p>
      {zone && (
        <span
          className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: borderColor,
            backgroundColor: `${borderColor}15`,
          }}
        >
          {zone}
        </span>
      )}
    </div>
  );
}
