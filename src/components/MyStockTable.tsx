"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { money, shares as fmtShares } from "@/lib/format";
import type { Priced } from "@/lib/portfolio/holdings";
import { ChangeBadge, Logo } from "./Badge";
import { colorFor } from "./StockCards";

type Key = "symbol" | "firstBuy" | "shares" | "avgCost" | "price" | "value" | "gainPct";
const cols: { key: Key; label: string }[] = [
  { key: "symbol", label: "Name Stock" },
  { key: "firstBuy", label: "First Buy" },
  { key: "shares", label: "Shares" },
  { key: "avgCost", label: "Avg Cost" },
  { key: "price", label: "Price" },
  { key: "value", label: "Value" },
  { key: "gainPct", label: "Gain / Loss" },
];

export function MyStockTable({ priced, live }: { priced: Priced[]; live: Record<string, number> }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 } | null>({ key: "value", dir: -1 });
  const rows = useMemo(() => {
    if (!sort) return priced;
    return [...priced].sort((a, b) => (a[sort.key] < b[sort.key] ? -1 : a[sort.key] > b[sort.key] ? 1 : 0) * sort.dir);
  }, [priced, sort]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-medium">My Stock</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-border text-sm text-muted">
              {cols.map((c) => (
                <th key={c.key} className="pb-3 font-medium">
                  <button onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))} className="inline-flex items-center gap-1.5">
                    {c.label} <ArrowUpDown size={13} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => {
              const isLive = h.symbol in live;
              return (
                <tr key={h.symbol} className="border-b border-border last:border-0">
                  <td className="py-4">
                    <Link href={`/stocks/${h.symbol}`} className="flex items-center gap-3 hover:text-brand">
                      <Logo symbol={h.symbol} color={colorFor(h.symbol)} />
                      <span className="font-semibold">{h.symbol}</span>
                    </Link>
                  </td>
                  <td className="py-4 font-medium">{h.firstBuy}</td>
                  <td className="py-4 font-medium">{fmtShares(h.shares)}</td>
                  <td className="py-4 font-medium">{money(h.avgCost)}</td>
                  <td className="py-4 font-medium">{isLive ? money(h.price) : "—"}</td>
                  <td className="py-4 font-medium">{isLive ? money(h.value) : "—"}</td>
                  <td className="py-4">
                    {isLive ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <ChangeBadge pct={h.gainPct} pill />
                        <span className={`text-xs ${h.gain >= 0 ? "text-up" : "text-down"}`}>{h.gain >= 0 ? "+" : "−"}{money(Math.abs(h.gain))}</span>
                      </div>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
