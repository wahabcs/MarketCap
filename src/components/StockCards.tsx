import Link from "next/link";
import { money } from "@/lib/format";
import type { Priced } from "@/lib/portfolio/holdings";
import { ChangeBadge, Logo } from "./Badge";

const COLORS = ["#7c3aed", "#0ea5e9", "#16a34a", "#f59e0b", "#e11d48", "#14b8a6"];
export const colorFor = (symbol: string) => COLORS[[...symbol].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export function StockCards({ priced, live }: { priced: Priced[]; live: Record<string, number> }) {
  const top = [...priced].sort((a, b) => b.value - a.value).slice(0, 4);
  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      {top.map((h) => {
        const isLive = h.symbol in live;
        const dayPct = h.prevClose ? ((h.price - h.prevClose) / h.prevClose) * 100 : 0;
        return (
          <Link key={h.symbol} href={`/stocks/${h.symbol}`} className="min-w-64 flex-1 rounded-2xl border border-border bg-surface p-5 transition hover:border-brand">
            <div className="flex items-center gap-3">
              <Logo symbol={h.symbol} color={colorFor(h.symbol)} />
              <div>
                <div className="font-semibold">{h.symbol}</div>
                <div className="text-sm text-muted">{h.shares} shares</div>
              </div>
            </div>
            <div className="mt-6 text-2xl font-semibold">{isLive ? money(h.value) : "—"}</div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              {isLive ? <ChangeBadge pct={dayPct} /> : <span>Loading…</span>} today
            </div>
          </Link>
        );
      })}
    </div>
  );
}
