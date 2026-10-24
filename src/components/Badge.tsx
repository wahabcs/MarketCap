import { ArrowDown, ArrowUp } from "lucide-react";

export function ChangeBadge({ pct, pill = false }: { pct: number; pill?: boolean }) {
  const up = pct >= 0;
  const color = up ? "text-up" : "text-down";
  const bg = pill ? (up ? "bg-up-soft" : "bg-down-soft") : "";
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${color} ${pill ? `rounded-full px-2.5 py-1 ${bg}` : ""}`}>
      <Icon size={14} /> {Math.abs(pct).toFixed(2)}%
    </span>
  );
}

export function Logo({ symbol, color, size = 40 }: { symbol: string; color: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full ring-1 ring-white/15 text-xs font-semibold text-white"
      style={{ background: color, width: size, height: size }}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}
