"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/market/types";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const query = q.trim();

  useEffect(() => {
    if (!query) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Search failed");
        setResults(body.results);
        setError(null);
        setActive(0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (symbol: string) => {
    setOpen(false);
    setQ("");
    router.push(`/stocks/${encodeURIComponent(symbol)}`);
  };

  const shown = query ? results : [];

  return (
    <div ref={box} className="relative w-full max-w-md">
      <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, shown.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          else if (e.key === "Escape") setOpen(false);
          else if (e.key === "Enter") {
            if (shown[active]) go(shown[active].symbol);
            else if (query) go(query.toUpperCase());
          }
        }}
        placeholder="Search stocks, e.g. AAPL or Tesla"
        aria-label="Search stocks"
        className="w-full rounded-2xl border border-border bg-surface py-3 pr-4 pl-11 text-[15px] outline-none placeholder:text-muted focus:border-brand"
      />
      {open && query && (
        <ul className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          {error && <li className="px-4 py-3 text-sm text-down">{error}</li>}
          {!error && !shown.length && <li className="px-4 py-3 text-sm text-muted">No matches</li>}
          {shown.map((r, i) => (
            <li key={r.symbol}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.symbol)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${i === active ? "bg-muted-surface" : ""}`}
              >
                <span className="w-16 font-semibold">{r.symbol}</span>
                <span className="truncate text-sm text-muted">{r.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
