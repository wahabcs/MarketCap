"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";

// The quote API accepts at most 20 symbols per request.
export const WATCHLIST_LIMIT = 20;

type Loaded = { uid: string; symbols: string[] };
type WatchlistState = {
  symbols: string[];
  loading: boolean;
  error: string | null;
  has: (symbol: string) => boolean;
  add: (symbol: string) => Promise<void>;
  remove: (symbol: string) => Promise<void>;
};

const Ctx = createContext<WatchlistState>({
  symbols: [], loading: false, error: null, has: () => false, add: async () => {}, remove: async () => {},
});

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    createClient()
      .from("watchlist_items")
      .select("symbol")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setError(error.message);
        else {
          setError(null);
          setLoaded({ uid, symbols: data.map((r) => r.symbol) });
        }
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  // Ignore anything loaded for a different (or no) user, e.g. right after sign-out.
  const symbols = useMemo(() => (uid && loaded?.uid === uid ? loaded.symbols : []), [uid, loaded]);
  const loading = !!uid && loaded?.uid !== uid && !error;

  const update = useCallback(
    (fn: (s: string[]) => string[]) => setLoaded((l) => (uid ? { uid, symbols: fn(l?.uid === uid ? l.symbols : []) } : l)),
    [uid],
  );

  const add = useCallback(
    async (symbol: string) => {
      if (!uid || symbols.includes(symbol)) return;
      if (symbols.length >= WATCHLIST_LIMIT) {
        setError(`Your watchlist is full (${WATCHLIST_LIMIT} stocks max).`);
        return;
      }
      setError(null);
      update((s) => [...s, symbol]);
      const { error } = await createClient().from("watchlist_items").insert({ symbol });
      if (error && error.code !== "23505") {
        update((s) => s.filter((x) => x !== symbol));
        setError(error.message);
      }
    },
    [uid, symbols, update],
  );

  const remove = useCallback(
    async (symbol: string) => {
      if (!uid) return;
      setError(null);
      update((s) => s.filter((x) => x !== symbol));
      const { error } = await createClient().from("watchlist_items").delete().eq("symbol", symbol);
      if (error) {
        update((s) => (s.includes(symbol) ? s : [...s, symbol]));
        setError(error.message);
      }
    },
    [uid, update],
  );

  return (
    <Ctx.Provider value={{ symbols, loading, error, has: (s) => symbols.includes(s), add, remove }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWatchlist = () => useContext(Ctx);
