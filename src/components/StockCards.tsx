"use client";

import Link from "next/link";
import { holdings, money } from "@/lib/mock";
import { useQuotes } from "@/lib/useQuotes";
import { ChangeBadge, Logo } from "./Badge";

export function StockCards() {
  const { quotes, error } = useQuotes();
  return (
    <div>
      {error && <p className="mb-2 rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}
      <div className="flex gap-4 overflow-x-auto pb-1">
        {holdings.slice(0, 4).map((s) => {
          const q = quotes[s.symbol];
          return (
            <Link href={`/stocks/${s.symbol}`} key={s.symbol} className="min-w-64 flex-1 rounded-2xl border border-border bg-surface p-5 transition hover:border-brand">
              <div className="flex items-center gap-3">
                <Logo symbol={s.symbol} color={s.color} />
                <div>
                  <div className="font-semibold">{s.symbol}</div>
                  <div className="text-sm text-muted">{s.name}</div>
                </div>
              </div>
              <div className="mt-6 text-2xl font-semibold">{q ? money(q.price) : "—"}</div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                {q ? <ChangeBadge pct={q.changePct} /> : <span>Loading…</span>} today
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
