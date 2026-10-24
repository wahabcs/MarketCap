"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWatchlist } from "@/lib/watchlist";

export function WatchButton({ symbol }: { symbol: string }) {
  const { user, loading: authLoading } = useAuth();
  const { has, add, remove, loading, error } = useWatchlist();
  const base = "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition";

  if (authLoading) return <span className={`${base} border-border text-muted`}>…</span>;
  if (!user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/stocks/${symbol}`)}`} className={`${base} border-border hover:border-brand`}>
        <Star size={16} /> Sign in to watch
      </Link>
    );
  }
  const watching = has(symbol);
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled={loading}
        onClick={() => (watching ? remove(symbol) : add(symbol))}
        aria-pressed={watching}
        className={`${base} ${watching ? "border-brand bg-brand-soft text-brand" : "border-border hover:border-brand"}`}
      >
        <Star size={16} fill={watching ? "currentColor" : "none"} />
        {watching ? "Watching" : "Add to watchlist"}
      </button>
      {error && <span role="alert" className="text-xs text-down">{error}</span>}
    </div>
  );
}
