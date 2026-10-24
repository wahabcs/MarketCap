"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { money } from "@/lib/format";
import type { Priced } from "@/lib/portfolio/holdings";
import { colorFor } from "./StockCards";

export function AllocationChart({ priced }: { priced: Priced[] }) {
  const data = priced.filter((h) => h.value > 0).map((h) => ({ name: h.symbol, value: h.value }));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-medium">Allocation</h2>
      {!data.length ? (
        <p className="mt-6 text-sm text-muted">Allocation appears once live prices load.</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
          <div className="h-52 w-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none" isAnimationActive={false}>
                  {data.map((d) => <Cell key={d.name} fill={colorFor(d.name)} />)}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [`${money(Number(v))} (${((Number(v) / total) * 100).toFixed(1)}%)`, n]}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid w-full flex-1 gap-2 text-sm">
            {data.map((d) => (
              <li key={d.name} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: colorFor(d.name) }} />
                <span className="font-medium">{d.name}</span>
                <span className="ml-auto text-muted">{((d.value / total) * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
