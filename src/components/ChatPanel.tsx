"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMetrics } from "@/components/DataProvider";
import { metricCatalog } from "@/lib/metrics";
import { getLatestValue } from "@/lib/data";
import { getSignalZone } from "@/lib/signals";

/* ── Types ────────────────────────────────────────────────── */

interface Message {
  role: "user" | "assistant";
  content: string;
}

/* ── Build data context for the LLM ──────────────────────── */

const KEY_METRICS = [
  "btc_price", "mvrv_zscore", "nupl", "sopr", "asopr", "rsi_14",
  "reserve_risk", "puell_multiple", "supply_in_profit_pct",
  "price_200ma_ratio", "sth_sopr_proxy", "lth_sopr_proxy",
  "mvrv", "capitulation", "euphoria", "dormancy_flow",
  "liveliness", "velocity", "accumulation_signal", "onchain_signal",
];

function buildContext(data: import("@/lib/types").MetricRow[]): string {
  if (!data || data.length === 0) return "";

  const lines: string[] = [`Data as of ${data[data.length - 1].date} (${data.length} days of history)`];

  for (const key of KEY_METRICS) {
    const meta = metricCatalog.find((m) => m.key === key);
    const latest = getLatestValue(data, key);
    if (!latest || !meta) continue;
    const zone = getSignalZone(key, latest.value);
    const zoneLabel = zone ? ` [${zone}]` : "";
    lines.push(`${meta.label}: ${latest.value.toFixed(key === "btc_price" ? 0 : 4)}${zoneLabel}`);
  }

  return lines.join("\n");
}

/* ── Component ────────────────────────────────────────────── */

export default function ChatPanel() {
  const { data } = useMetrics();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const context = buildContext(data);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context,
          history: newMessages.slice(-6),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setMessages([...newMessages, { role: "assistant", content: json.response }]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Error: ${errMsg}. The AI assistant requires Cloudflare Workers AI to be enabled.` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, data]);

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-500"
        title="Ask AI about on-chain data"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[480px] w-[380px] flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-zinc-200">OnChainLab AI</span>
            <span className="ml-auto text-[10px] text-zinc-600">Llama 3.1 via Cloudflare</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm text-zinc-500">Ask me about Bitcoin on-chain metrics</p>
                <div className="mt-3 space-y-1">
                  {[
                    "Is BTC overvalued right now?",
                    "What signals are bearish?",
                    "Explain MVRV Z-Score",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="block w-full rounded-lg border border-zinc-800 px-3 py-1.5 text-left text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 bg-zinc-900 px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about on-chain data..."
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-600"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
