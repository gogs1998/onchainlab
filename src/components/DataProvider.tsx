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
