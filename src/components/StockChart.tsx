"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";
import { RANGES, type Bar, type Range } from "@/lib/market/ranges";
import { ChangeBadge } from "./Badge";

type Entry = { bars: Bar[] } | { error: string };

const isIntraday = (r: Range) => r === "1D" || r === "5D";

function label(t: string, range: Range, long = false) {
  // t is "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss" in the exchange's time zone; format without Date math.
  const [d, time] = t.split(" ");
  const [y, m, day] = d.split("-").map(Number);
  const mon = new Date(Date.UTC(2000, m - 1, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  if (isIntraday(range)) {
    const hm = time.slice(0, 5);
    return range === "1D" ? hm : long ? `${mon} ${day}, ${hm}` : `${mon} ${day}`;
  }
  return range === "5Y" || range === "1Y" ? `${mon} ${long ? `${day}, ` : ""}${y}` : `${mon} ${day}${long ? `, ${y}` : ""}`;
}

export function StockChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<Range>("1M");
  const [results, setResults] = useState<Partial<Record<Range, Entry>>>({});
  const entry = results[range];

  useEffect(() => {
    if (results[range]) return;
    const ctrl = new AbortController();
    fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load the chart.");
        setResults((r) => ({ ...r, [range]: { bars: body.bars as Bar[] } }));
      })
      .catch((e: Error) => {
        // Errors are not remembered, so switching tabs back retries.
        if (e.name !== "AbortError") setResults((r) => ({ ...r, [range]: { error: e.message } }));
      });
    return () => ctrl.abort();
  }, [symbol, range, results]);

  const bars = entry && "bars" in entry ? entry.bars : null;
  const first = bars?.[0]?.c;
  const last = bars?.at(-1)?.c;
  const up = first !== undefined && last !== undefined ? last >= first : true;
  const color = up ? "var(--up)" : "var(--down)";
  const changePct = first && last ? ((last - first) / first) * 100 : 0;
  const domain = useMemo<[number, number]>(() => {
    if (!bars?.length) return [0, 1];
    const vals = bars.map((b) => b.c);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.08 || hi * 0.01;
    return [lo - pad, hi + pad];
  }, [bars]);

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium">Price history</h2>
          {bars && bars.length > 1 && <ChangeBadge pct={changePct} pill />}
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-muted-surface p-1" role="tablist" aria-label="Chart range">
          {RANGES.map((r) => (
            <button
              key={r} role="tab" aria-selected={r === range} onClick={() => setRange(r)}
              className={`shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-medium sm:px-3 ${r === range ? "bg-surface shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-72">
        {!entry ? (
          <div className="h-full animate-pulse rounded-xl bg-muted-surface" />
        ) : "error" in entry ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p role="alert" className="text-sm text-down">{entry.error}</p>
              <button onClick={() => setResults((r) => ({ ...r, [range]: undefined }))} className="mt-3 rounded-full border border-border px-4 py-1.5 text-sm hover:border-brand">
                Try again
              </button>
            </div>
          </div>
        ) : !bars?.length ? (
          <p className="grid h-full place-items-center text-sm text-muted">No data for this range.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bars} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id={`fill-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="5 5" stroke="var(--border)" />
              <XAxis dataKey="t" axisLine={false} tickLine={false} minTickGap={48} tickFormatter={(t: string) => label(t, range)} tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <YAxis orientation="right" domain={domain} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => `$${v.toFixed(0)}`} tick={{ fill: "var(--muted)", fontSize: 12 }} />
              <Tooltip
                cursor={{ stroke: "var(--foreground)", strokeDasharray: "4 4" }}
                labelFormatter={(t) => label(String(t), range, true)}
                formatter={(v) => [money(Number(v)), "Price"]}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}
              />
              <Area type="monotone" dataKey="c" stroke={color} strokeWidth={1.75} fill={`url(#fill-${symbol})`} isAnimationActive={false} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">Daily closes{`, `}intraday for 1D/5D. Times are US market time. Data may be delayed.</p>
    </section>
  );
}
