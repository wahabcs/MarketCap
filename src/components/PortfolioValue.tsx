"use client";

import { useState } from "react";
import { ChevronRight, MoreVertical, Sparkles } from "lucide-react";
import { holdings, money } from "@/lib/mock";
import { useQuotes } from "@/lib/useQuotes";
import { ChangeBadge } from "./Badge";

export function PortfolioValue() {
  const [mode, setMode] = useState<"worst" | "top">("top");
  const { quotes } = useQuotes();
  const ready = holdings.every((h) => quotes[h.symbol]);
  const value = holdings.reduce((sum, h) => sum + h.shares * (quotes[h.symbol]?.price ?? 0), 0);
  const prev = holdings.reduce((sum, h) => sum + h.shares * (quotes[h.symbol]?.prevClose ?? 0), 0);
  const dayChange = value - prev;
  const dayPct = prev ? (dayChange / prev) * 100 : 0;
  const ranked = holdings
    .filter((h) => quotes[h.symbol])
    .sort((a, b) => quotes[b.symbol].changePct - quotes[a.symbol].changePct);
  const featured = mode === "top" ? ranked[0] : ranked[ranked.length - 1];
  const tab = (id: "worst" | "top", label: string) => (
    <button
      onClick={() => setMode(id)}
      className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition ${
        mode === id ? "bg-brand text-white" : "border border-border text-foreground"
      }`}
    >
      {label}
    </button>
  );
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Portfolio Values</h2>
        <MoreVertical size={18} className="text-muted" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-4xl font-semibold">{ready ? money(value) : "—"}</span>
        <ChangeBadge pct={dayPct} pill />
      </div>
      <p className="mt-4 text-sm text-muted">
        {ready ? (
          <>
            Your portfolio {dayChange >= 0 ? "gained" : "lost"} {money(Math.abs(dayChange))} today.
            <br />
            {featured && `${mode === "top" ? "Top" : "Worst"} performer: ${featured.symbol} (${quotes[featured.symbol].changePct.toFixed(2)}%).`}
          </>
        ) : (
          "Loading live prices…"
        )}
      </p>
      <div className="mt-5 flex gap-3">
        {tab("worst", "Worst Performance")}
        {tab("top", "Top Performance")}
      </div>
      <a href="#" className="mt-4 flex items-center gap-3 rounded-2xl bg-brand-soft p-3 text-sm text-brand">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface/60">
          <Sparkles size={18} />
        </span>
        <span className="flex-1">Here&apos;s how to improve your portfolio and understand how investing works.</span>
        <ChevronRight size={18} />
      </a>
    </section>
  );
}
