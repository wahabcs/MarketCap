"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { holdings, money } from "@/lib/mock";
import { useQuotes } from "@/lib/useQuotes";
import { ChangeBadge, Logo } from "./Badge";

type Key = "symbol" | "investDate" | "shares" | "changePct" | "price" | "value";
const cols: { key: Key; label: string }[] = [
  { key: "symbol", label: "Name Stock" },
  { key: "investDate", label: "Invest Date" },
  { key: "shares", label: "Shares" },
  { key: "changePct", label: "Change" },
  { key: "price", label: "Price/stock" },
  { key: "value", label: "Value" },
];

export function MyStockTable() {
  const { quotes } = useQuotes();
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 } | null>(null);

  const rows = useMemo(() => {
    const base = holdings.map((h) => {
      const q = quotes[h.symbol];
      return { ...h, price: q?.price ?? 0, changePct: q?.changePct ?? 0, value: h.shares * (q?.price ?? 0), live: !!q };
    });
    if (!sort) return base;
    const val = (r: (typeof base)[number]) => (sort.key === "investDate" ? new Date(r.investDate).getTime() : r[sort.key]);
    return [...base].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * sort.dir);
  }, [quotes, sort]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-medium">My Stock</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-border text-sm text-muted">
              {cols.map((c) => (
                <th key={c.key} className="pb-3 font-medium">
                  <button
                    onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))}
                    className="inline-flex items-center gap-1.5"
                  >
                    {c.label} <ArrowUpDown size={13} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.symbol} className="border-b border-border last:border-0">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <Logo symbol={s.symbol} color={s.color} />
                    <Link href={`/stocks/${s.symbol}`} className="hover:text-brand">
                      <div className="font-semibold">{s.symbol}</div>
                      <div className="text-sm text-muted">{s.name}</div>
                    </Link>
                  </div>
                </td>
                <td className="py-4 font-medium">{s.investDate}</td>
                <td className="py-4 font-medium">{s.shares}</td>
                <td className="py-4">{s.live ? <ChangeBadge pct={s.changePct} pill /> : "—"}</td>
                <td className="py-4 font-medium">{s.live ? money(s.price) : "—"}</td>
                <td className="py-4 font-medium">{s.live ? money(s.value) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
