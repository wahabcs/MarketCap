"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { money, shares } from "@/lib/format";
import { usePortfolio } from "@/lib/portfolio";

export function TransactionsView() {
  const { user, loading: authLoading } = useAuth();
  const { loading, portfolios, selectedId, select, transactions, deleteTransaction } = usePortfolio();
  const [error, setError] = useState<string | null>(null);
  const list = [...transactions].reverse();

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-medium">Transactions</h1>
        {portfolios.length > 1 && (
          <select aria-label="Portfolio" value={selectedId ?? ""} onChange={(e) => select(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
            {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}
      {authLoading || loading ? (
        <p className="mt-6 text-sm text-muted">Loading…</p>
      ) : !user ? (
        <p className="mt-6 text-sm text-muted"><Link href="/login?next=/transactions" className="text-brand">Sign in</Link> to see your transactions.</p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No transactions yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                {["Date", "Type", "Symbol", "Shares", "Price", "Fees", ""].map((h) => <th key={h} className="pb-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="py-3">{t.executedAt}</td>
                  <td className="py-3 capitalize">{t.type}</td>
                  <td className="py-3 font-semibold"><Link href={`/stocks/${t.symbol}`} className="hover:text-brand">{t.symbol}</Link></td>
                  <td className="py-3">{shares(t.shares)}</td>
                  <td className="py-3">{money(t.price)}</td>
                  <td className="py-3">{money(t.fees)}</td>
                  <td className="py-3 text-right">
                    <button
                      aria-label={`Delete ${t.type} of ${t.symbol} on ${t.executedAt}`}
                      onClick={async () => {
                        if (!confirm(`Delete this ${t.type} of ${t.symbol}?`)) return;
                        setError(await deleteTransaction(t.id));
                      }}
                      className="rounded-full p-2 text-muted hover:bg-muted-surface hover:text-down"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
