"use client";

import { useMetrics } from "@/components/DataProvider";

export default function Home() {
  const { data } = useMetrics();

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="font-mono text-4xl font-bold">
          OnChain<span className="text-blue-500">Lab</span>
        </h1>
        <p className="mt-4 text-zinc-400">
          {data.length > 0
            ? `Loaded ${data.length.toLocaleString()} days of on-chain data`
            : "No data loaded"}
        </p>
      </div>
    </div>
  );
}
