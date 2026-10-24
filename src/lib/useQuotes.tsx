"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Quote } from "@/lib/market/types";

type State = { quotes: Record<string, Quote>; error: string | null; loading: boolean };
const Ctx = createContext<State>({ quotes: {}, error: null, loading: true });

const DEFAULT_POLL_MS = 30_000;

export function QuotesProvider({ symbols, intervalMs = DEFAULT_POLL_MS, children }: { symbols: string[]; intervalMs?: number; children: ReactNode }) {
  const [state, setState] = useState<State>({ quotes: {}, error: null, loading: true });
  const key = symbols.join(",");

  useEffect(() => {
    if (!key) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/quote?symbols=${key}`);
        const body = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(body.error ?? "Failed to load prices");
        const quotes = Object.fromEntries((body.quotes as Quote[]).map((q) => [q.symbol, q]));
        setState({ quotes, error: null, loading: false });
      } catch (e) {
        if (alive) setState((s) => ({ ...s, error: (e as Error).message, loading: false }));
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
