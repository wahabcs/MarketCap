"use client";

import { useState } from "react";
import { money } from "@/lib/format";
import type { Priced } from "@/lib/portfolio/holdings";
import { ChangeBadge } from "./Badge";

const sign = (n: number) => (n >= 0 ? "+" : "−") + money(Math.abs(n));

export function PortfolioValue({
  priced, ready, realized, dividends,
}: {
  priced: Priced[]; ready: boolean; realized: number; dividends: number;
}) {
  const [mode, setMode] = useState<"worst" | "top">("top");
  const value = priced.reduce((s, h) => s + h.value, 0);
  const cost = priced.reduce((s, h) => s + h.costBasis, 0);
  const gain = value - cost;
  const gainPct = cost ? (gain / cost) * 100 : 0;
  const day = priced.reduce((s, h) => s + h.dayChange, 0);
  const prev = value - day;
  const ranked = [...priced].sort((a, b) => b.gainPct - a.gainPct);
  const featured = mode === "top" ? ranked[0] : ranked[ranked.length - 1];

  const tab = (id: "worst" | "top", text: string) => (
    <button
      onClick={() => setMode(id)}
      className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition ${mode === id ? "bg-brand text-white" : "border border-border text-foreground"}`}
    >
      {text}
    </button>
  );

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-medium">Portfolio Value</h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-4xl font-semibold">{ready ? money(value) : "—"}</span>
        {ready && <ChangeBadge pct={gainPct} pill />}
        <span className="text-sm text-muted">total return</span>
      </div>

      {ready ? (
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div><dt className="text-muted">Today</dt><dd className={`font-medium ${day >= 0 ? "text-up" : "text-down"}`}>{sign(day)}{prev ? ` (${((day / prev) * 100).toFixed(2)}%)` : ""}</dd></div>
          <div><dt className="text-muted">Unrealized gain/loss</dt><dd className={`font-medium ${gain >= 0 ? "text-up" : "text-down"}`}>{sign(gain)}</dd></div>
          <div><dt className="text-muted">Realized gain/loss</dt><dd className={`font-medium ${realized >= 0 ? "text-up" : "text-down"}`}>{sign(realized)}</dd></div>
          <div><dt className="text-muted">Dividends received</dt><dd className="font-medium">{money(dividends)}</dd></div>
        </dl>
      ) : (
        <p className="mt-5 text-sm text-muted">Loading live prices…</p>
      )}

      <div className="mt-5 flex gap-3">
        {tab("worst", "Worst Performer")}
        {tab("top", "Top Performer")}
      </div>
      {ready && featured && (
        <p className="mt-4 rounded-2xl bg-brand-soft p-4 text-sm text-brand">
          {mode === "top" ? "Best" : "Weakest"} position: <strong>{featured.symbol}</strong> ({featured.gainPct >= 0 ? "+" : ""}{featured.gainPct.toFixed(2)}% since you bought).
        </p>
      )}
    </section>
  );
}
