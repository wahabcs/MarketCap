"use client";

import type { NewsItem } from "@/lib/market/types";

const ago = (unix: number) => {
  const h = Math.max(1, Math.round((Date.now() / 1000 - unix) / 3600));
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

export function NewsList({ items }: { items: NewsItem[] }) {
  if (!items.length) return <p className="mt-4 text-sm text-muted">No news right now.</p>;
  return (
    <ul className="mt-2 divide-y divide-border">
      {items.map((n) => (
        <li key={n.id}>
          <a href={n.url} target="_blank" rel="noopener noreferrer" className="block py-3 hover:opacity-80">
            <p className="font-medium">{n.headline}</p>
            <p className="mt-1 text-sm text-muted">
              {n.source} · <span suppressHydrationWarning>{ago(n.datetime)}</span>
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
