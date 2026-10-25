"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Quote } from "@/lib/market/types";

type State = { quotes: Record<string, Quote>; error: string | null; loading: boolean };
const Ctx = createContext<State>({ quotes: {}, error: null, loading: true });

const DEFAULT_POLL_MS = 30_000;

// Browser-wide memory of recent quotes. Navigating between pages remounts the provider; without this,
// every navigation would re-request every symbol and burn through the free-tier rate limit.
const recent = new Map<string, { quote: Quote; at: number }>();

const snapshot = (symbols: string[]) => {
  const quotes: Record<string, Quote> = {};
  for (const s of symbols) {
    const hit = recent.get(s);
    if (hit) quotes[s] = hit.quote;
  }
  return quotes;
};

export function QuotesProvider({
  symbols,
  intervalMs = DEFAULT_POLL_MS,
  children,
}: {
  symbols: string[];
  intervalMs?: number;
  children: ReactNode;
}) {
  const key = symbols.join(",");
  const [state, setState] = useState<State>(() => {
    const quotes = snapshot(symbols);
    return { quotes, error: null, loading: symbols.some((s) => !quotes[s]) };
  });

  useEffect(() => {
    if (!key) return;
    const wanted = key.split(",");
    let alive = true;

    const load = async () => {
      await Promise.resolve(); // keep every state update asynchronous
      const cutoff = Date.now() - intervalMs * 0.8;
      const stale = wanted.filter((s) => (recent.get(s)?.at ?? 0) < cutoff);
      if (!stale.length) {
        if (alive) setState({ quotes: snapshot(wanted), error: null, loading: false });
        return;
      }
      try {
        const res = await fetch(`/api/quote?symbols=${stale.join(",")}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to load prices");
        const now = Date.now();
        for (const q of body.quotes as Quote[]) recent.set(q.symbol, { quote: q, at: now });
        if (alive) setState({ quotes: snapshot(wanted), error: null, loading: false });
      } catch (e) {
        // Keep showing whatever we already have; only surface the error.
        if (alive) setState({ quotes: snapshot(wanted), error: (e as Error).message, loading: false });
      }
    };

    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [key, intervalMs]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export const useQuotes = () => useContext(Ctx);
