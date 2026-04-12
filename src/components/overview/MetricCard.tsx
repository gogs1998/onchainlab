"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { getSignalZone, getSignalColor } from "@/lib/signals";

interface MetricCardProps {
  label: string;
  metric: string;
  value: number | null;
  description: string;
  sparkData: { date: string; value: number }[];
  format?: (v: number) => string;
}

const defaultFormat = (v: number) => v.toFixed(2);

export default function MetricCard({
  label,
  metric,
  value,
  description,
  sparkData,
  format = defaultFormat,
}: MetricCardProps) {
  const zone = value != null ? getSignalZone(metric, value) : null;
  const color = getSignalColor(zone);

  // Unique gradient ID to avoid SVG collisions
  const gradientId = useMemo(
    () => `spark-${metric}-${Math.random().toString(36).slice(2, 8)}`,
    [metric],
  );

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-[var(--bg-card)] px-5 pt-4 pb-0 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg"
      style={{
        borderLeft: `3px solid ${color}`,
        boxShadow: `inset 0 0 30px -15px ${color}10`,
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-20 w-20 opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.12]"
        style={{
          background: `radial-gradient(circle at top right, ${color}, transparent 70%)`,
        }}
      />

      {/* Label */}
      <p className="mb-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--text-secondary)]">
        {label}
      </p>

      {/* Value */}
      <p
        className="font-[family-name:var(--font-mono)] text-2xl font-bold leading-tight tracking-tight"
        style={{ color: zone ? color : "var(--text-primary)" }}
      >
        {value != null ? format(value) : "---"}
      </p>

      {/* Zone badge */}
      {zone && (
        <span
          className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            color,
            backgroundColor: `${color}15`,
          }}
        >
          {zone}
        </span>
      )}

      {/* Description */}
      <p className="mt-2 text-[11px] leading-relaxed text-[var(--text-secondary)]/70">
        {description}
      </p>

      {/* 90-day sparkline at bottom */}
      <div className="mt-3 -mx-5 h-10">
        {sparkData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sparkData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-[var(--bg-secondary)]/30" />
        )}
      </div>
    </div>
  );
}
