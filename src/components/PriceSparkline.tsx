"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { useMetrics } from "@/components/DataProvider";
import { getLastNDays, getMetricSeries } from "@/lib/data";

export default function PriceSparkline() {
  const { data } = useMetrics();

  const series = useMemo(() => {
    if (data.length === 0) return [];
    const recent = getLastNDays(data, 90);
    return getMetricSeries(recent, "btc_price");
  }, [data]);

  if (series.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 animate-[fadeIn_2s_ease-in-out]"
        style={{ opacity: 0.06 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={series}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <YAxis domain={["dataMin", "dataMax"]} hide />
            <defs>
              <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#sparkGrad)"
              isAnimationActive={true}
              animationDuration={2500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
