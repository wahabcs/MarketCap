"use client";

import Link from "next/link";
import { Star, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/mock";
import { useQuotes, QuotesProvider } from "@/lib/useQuotes";
import { useWatchlist, WATCHLIST_LIMIT } from "@/lib/watchlist";
import { ChangeBadge } from "./Badge";

function Rows() {
  const { symbols, remove } = useWatchlist();
  const { quotes, error } = useQuotes();
  return (
    <>
      {error && <p className="mb-3 rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}
      <ul className="divide-y divide-border">
        {symbols.map((s) => {
          const q = quotes[s];
          return (
            <li key={s} className="flex items-center gap-4 py-4">
              <Link href={`/stocks/${s}`} className="flex flex-1 items-center gap-4 hover:text-brand">
                <span className="w-20 font-semibold">{s}</span>
                <span className="flex-1 font-medium">{q ? money(q.price) : "—"}</span>
                <span className="w-28">{q ? <ChangeBadge pct={q.changePct} pill /> : null}</span>
              </Link>
              <button
                onClick={() => remove(s)}
                aria-label={`Remove ${s} from watchlist`}
                className="rounded-full p-2 text-muted hover:bg-muted-surface hover:text-down"
              >
                <X size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function WatchlistView() {
  const { user, loading: authLoading } = useAuth();
  const { symbols, loading, error } = useWatchlist();

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-medium">My Watchlist</h1>
        <span className="text-sm text-muted">{symbols.length}/{WATCHLIST_LIMIT}</span>
      </div>
      {authLoading || loading ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : !user ? (
        <p className="mt-6 text-sm text-muted">
          <Link href="/login?next=/watchlist" className="text-brand">Sign in</Link> to see your watchlist.
        </p>
      ) : (
        <>
          {error && <p role="alert" className="mt-4 rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}
          {symbols.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-2 pb-6 text-center text-muted">
              <Star size={28} />
              <p>No stocks yet. Search for one and tap “Add to watchlist”.</p>
            </div>
          ) : (
            <div className="mt-2">
              <QuotesProvider symbols={symbols}>
                <Rows />
              </QuotesProvider>
            </div>
          )}
        </>
      )}
    </section>
  );
}
