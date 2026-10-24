"use client";

import Link from "next/link";
import { money } from "@/lib/format";
import { INDEX_FUNDS, OVERVIEW_SYMBOLS, POPULAR } from "@/lib/market/popular";
import { QuotesProvider, useQuotes } from "@/lib/useQuotes";
import { ChangeBadge } from "./Badge";

function Indices() {
  const { quotes, error } = useQuotes();
  return (
    <div>
      {error && <p role="alert" className="mb-2 rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}
      <div className="flex gap-4 overflow-x-auto pb-1">
        {INDEX_FUNDS.map((i) => {
          const q = quotes[i.symbol];
          return (
            <Link key={i.symbol} href={`/stocks/${i.symbol}`} className="min-w-52 flex-1 rounded-2xl border border-border bg-surface p-5 transition hover:border-brand">
              <div className="font-semibold">{i.name}</div>
              <div className="text-sm text-muted">{i.symbol} ETF</div>
              <div className="mt-4 text-2xl font-semibold">{q ? money(q.price) : "—"}</div>
              <div className="mt-1 text-sm">{q ? <ChangeBadge pct={q.changePct} /> : <span className="text-muted">Loading…</span>}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MoverList({ title, rows }: { title: string; rows: { symbol: string; name: string; price: number; changePct: number }[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-medium">{title}</h2>
      {!rows.length ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {rows.map((r) => (
            <li key={r.symbol}>
              <Link href={`/stocks/${r.symbol}`} className="flex items-center gap-3 py-3 hover:text-brand">
                <span className="w-16 font-semibold">{r.symbol}</span>
                <span className="flex-1 truncate text-sm text-muted">{r.name}</span>
                <span className="font-medium">{money(r.price)}</span>
                <span className="w-24 text-right"><ChangeBadge pct={r.changePct} pill /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Movers() {
  const { quotes } = useQuotes();
  const rows = POPULAR.filter((p) => quotes[p.symbol]).map((p) => ({ ...p, price: quotes[p.symbol].price, changePct: quotes[p.symbol].changePct }));
  const sorted = [...rows].sort((a, b) => b.changePct - a.changePct);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MoverList title="Top gainers" rows={sorted.slice(0, 5)} />
      <MoverList title="Top losers" rows={sorted.slice(-5).reverse()} />
    </div>
  );
}

export function MarketOverview({ news }: { news: React.ReactNode }) {
  return (
    <QuotesProvider symbols={OVERVIEW_SYMBOLS}>
      <Indices />
      <Movers />
      <p className="-mt-2 text-xs text-muted">Movers are ranked among {POPULAR.length} widely held large-cap stocks. Prices may be delayed. Not financial advice.</p>
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-lg font-medium">Market news</h2>
        {news}
      </section>
    </QuotesProvider>
  );
}
