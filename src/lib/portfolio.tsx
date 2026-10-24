"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { summarize, type Tx, type TxType } from "@/lib/portfolio/holdings";

export type Portfolio = { id: string; name: string };
export type StoredTx = Tx & { portfolioId: string; notes: string | null };

export type NewTx = {
  portfolioId: string;
  symbol: string;
  type: TxType;
  shares: number;
  price: number;
  fees: number;
  executedAt: string;
  notes: string;
};

type State = {
  loading: boolean;
  error: string | null;
  portfolios: Portfolio[];
  selectedId: string | null;
  select: (id: string) => void;
  /** Transactions in the selected portfolio. */
  transactions: StoredTx[];
  createPortfolio: (name: string) => Promise<{ id: string } | { error: string }>;
  /** Creates "My Portfolio" if the user has none yet; returns its id. */
  ensurePortfolio: () => Promise<{ id: string } | { error: string }>;
  addTransaction: (t: NewTx) => Promise<string | null>;
  deleteTransaction: (id: string) => Promise<string | null>;
};

const Ctx = createContext<State | null>(null);

type Loaded = { uid: string; portfolios: Portfolio[]; all: StoredTx[] };

const SYMBOL_RE = /^[A-Z0-9.\-]{1,12}$/;

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const supabase = createClient();
    Promise.all([
      supabase.from("portfolios").select("id, name").order("created_at", { ascending: true }),
      supabase.from("transactions").select("*").order("executed_at", { ascending: true }).order("created_at", { ascending: true }),
    ]).then(([p, t]) => {
      if (!alive) return;
      if (p.error) return setError(p.error.message);
      if (t.error) return setError(t.error.message);
      setError(null);
      setLoaded({
        uid,
        portfolios: p.data,
        all: t.data.map((r) => ({
          id: r.id, portfolioId: r.portfolio_id, symbol: r.symbol, type: r.type as TxType,
          shares: Number(r.shares), price: Number(r.price), fees: Number(r.fees),
          executedAt: r.executed_at, createdAt: r.created_at, notes: r.notes,
        })),
      });
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  const mine = uid && loaded?.uid === uid ? loaded : null;
  const portfolios = useMemo(() => mine?.portfolios ?? [], [mine]);
  const all = useMemo(() => mine?.all ?? [], [mine]);
  const selectedId = portfolios.find((p) => p.id === picked)?.id ?? portfolios[0]?.id ?? null;
  const transactions = useMemo(() => all.filter((t) => t.portfolioId === selectedId), [all, selectedId]);
  const loading = !!uid && !mine && !error;

  const createPortfolio = useCallback<State["createPortfolio"]>(
    async (name) => {
      const clean = name.trim();
      if (!uid) return { error: "Sign in first." };
      if (!clean || clean.length > 60) return { error: "Portfolio name must be 1-60 characters." };
      const { data, error } = await createClient().from("portfolios").insert({ name: clean }).select("id, name").single();
      if (error) return { error: error.message };
      setLoaded((l) => (l && l.uid === uid ? { ...l, portfolios: [...l.portfolios, data] } : { uid, portfolios: [data], all: [] }));
      setPicked(data.id);
      return { id: data.id };
    },
    [uid],
  );

  const ensurePortfolio = useCallback<State["ensurePortfolio"]>(async () => {
    return portfolios[0] ? { id: portfolios[0].id } : createPortfolio("My Portfolio");
  }, [portfolios, createPortfolio]);

  const addTransaction = useCallback<State["addTransaction"]>(
    async (t) => {
      if (!uid) return "Sign in first.";
      const symbol = t.symbol.trim().toUpperCase();
      if (!SYMBOL_RE.test(symbol)) return "Enter a valid ticker symbol.";
      if (!(t.shares > 0)) return "Shares must be greater than 0.";
      if (!(t.price >= 0)) return "Price can't be negative.";
      if (!(t.fees >= 0)) return "Fees can't be negative.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(t.executedAt)) return "Pick a valid date.";

      if (t.type === "sell") {
        const candidate: StoredTx = { id: "new", portfolioId: t.portfolioId, symbol, type: t.type, shares: t.shares, price: t.price, fees: t.fees, executedAt: t.executedAt, createdAt: "z", notes: null };
        const inPortfolio = all.filter((x) => x.portfolioId === t.portfolioId);
        if (summarize([...inPortfolio, candidate]).oversold.includes(symbol)) {
          return `You can't sell more ${symbol} than you held on that date.`;
        }
      }

      const { data, error } = await createClient()
        .from("transactions")
        .insert({
          portfolio_id: t.portfolioId, symbol, type: t.type, shares: t.shares, price: t.price,
          fees: t.fees, executed_at: t.executedAt, notes: t.notes.trim() || null,
        })
        .select("*")
        .single();
      if (error) return error.message;

      const saved: StoredTx = {
        id: data.id, portfolioId: data.portfolio_id, symbol: data.symbol, type: data.type as TxType,
        shares: Number(data.shares), price: Number(data.price), fees: Number(data.fees),
        executedAt: data.executed_at, createdAt: data.created_at, notes: data.notes,
      };
      setLoaded((l) => (l && l.uid === uid ? { ...l, all: [...l.all, saved] } : l));
      setPicked(t.portfolioId);
      return null;
    },
    [uid, all],
  );

  const deleteTransaction = useCallback<State["deleteTransaction"]>(
    async (id) => {
      const { error } = await createClient().from("transactions").delete().eq("id", id);
      if (error) return error.message;
      setLoaded((l) => (l ? { ...l, all: l.all.filter((x) => x.id !== id) } : l));
      return null;
    },
    [],
  );

  const value: State = {
    loading, error, portfolios, selectedId, select: setPicked, transactions,
    createPortfolio, ensurePortfolio, addTransaction, deleteTransaction,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePortfolio() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortfolio must be used inside <PortfolioProvider>");
  return v;
}
