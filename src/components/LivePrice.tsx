"use client";

import { money } from "@/lib/format";
import { useQuotes } from "@/lib/useQuotes";
import type { Quote } from "@/lib/market/types";
import { ChangeBadge } from "./Badge";

export function LivePrice({ initial }: { initial: Quote }) {
  const { quotes } = useQuotes();
  const q = quotes[initial.symbol] ?? initial;
  const up = q.change >= 0;
  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span className="text-4xl font-semibold">{money(q.price)}</span>
      <ChangeBadge pct={q.changePct} pill />
      <span className={`text-sm font-medium ${up ? "text-up" : "text-down"}`}>
        {up ? "+" : "−"}{money(Math.abs(q.change))} today
      </span>
    </div>
  );
}
