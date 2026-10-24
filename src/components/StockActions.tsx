"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuotes } from "@/lib/useQuotes";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { WatchButton } from "./WatchButton";

export function StockActions({ symbol, price }: { symbol: string; price: number }) {
  const { user, loading } = useAuth();
  const { quotes } = useQuotes();
  const [open, setOpen] = useState(false);
  const live = quotes[symbol]?.price ?? price;
  const base = "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition";

  return (
    <div className="flex flex-wrap items-start justify-end gap-2">
      {!loading &&
        (user ? (
          <button onClick={() => setOpen(true)} className={`${base} border-brand bg-brand text-white hover:opacity-90`}>
            <Plus size={16} /> Add to portfolio
          </button>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(`/stocks/${symbol}`)}`} className={`${base} border-border hover:border-brand`}>
            <Plus size={16} /> Sign in to add to portfolio
          </Link>
        ))}
      <WatchButton symbol={symbol} />
      {open && <AddTransactionDialog symbol={symbol} defaultPrice={live} onClose={() => setOpen(false)} />}
    </div>
  );
}
