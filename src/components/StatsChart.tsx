"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { statistics } from "@/lib/mock";

export function StatsChart() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-medium">Statistics</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={statistics} margin={{ left: -10, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="5 5" stroke="var(--border)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 80000]}
              ticks={[0, 20000, 40000, 60000, 80000]}
              tickFormatter={(v) => (v ? `${v / 1000}k` : "0")}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ stroke: "var(--foreground)", strokeDasharray: "4 4" }}
              formatter={(v) => [`$${Number(v).toLocaleString()}`, "Value"]}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}
            />
            <Area type="monotone" dataKey="value" isAnimationActive={false}stroke="#f472b6" strokeWidth={1.5} fill="url(#fill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
