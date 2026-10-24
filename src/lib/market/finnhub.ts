import "server-only";
import { cacheLife } from "next/cache";
import type { Company, NewsItem, Quote, SearchResult } from "./types";

const BASE = "https://finnhub.io/api/v1";

export class MarketDataError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// Cache Components: results are cached in memory for `revalidate` seconds.
// Errors thrown here (rate limits, bad key) are never cached.
async function get<T>(path: string, params: Record<string, string>, revalidate: number): Promise<T> {
  "use cache";
  cacheLife({ stale: Math.min(revalidate, 30), revalidate, expire: revalidate * 4 });

  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new MarketDataError("FINNHUB_API_KEY is not set. Add it to .env.local.", 503);

  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { "X-Finnhub-Token": key } });
  if (res.status === 429) throw new MarketDataError("Market data rate limit reached. Try again shortly.", 429);
  if (!res.ok) throw new MarketDataError(`Market data request failed (${res.status}).`, 502);
  return res.json() as Promise<T>;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function normalizeSymbol(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  return /^[A-Z0-9.\-]{1,12}$/.test(s) ? s : null;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const q = await get<{ c: number; d: number | null; dp: number | null; h: number; l: number; o: number; pc: number; t: number }>(
    "/quote", { symbol }, 15,
  );
  // Finnhub returns all zeros for unknown symbols.
  if (!q.c && !q.pc) throw new MarketDataError(`No quote found for ${symbol}.`, 404);
  return {
    symbol, price: q.c, change: q.d ?? 0, changePct: q.dp ?? 0,
    high: q.h, low: q.l, open: q.o, prevClose: q.pc, timestamp: q.t,
  };
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const r = await get<{ result: { symbol: string; description: string; type: string }[] }>(
    "/search", { q: query }, 3600,
  );
  return r.result
    .filter((x) => x.type === "Common Stock" || x.type === "ETP")
    .filter((x) => !x.symbol.includes("."))
    .slice(0, 8)
    .map((x) => ({ symbol: x.symbol, name: x.description, type: x.type }));
}

export async function getCompany(symbol: string): Promise<Company> {
  const [p, m] = await Promise.all([
    get<Record<string, unknown>>("/stock/profile2", { symbol }, 86400),
    get<{ metric?: Record<string, unknown> }>("/stock/metric", { symbol, metric: "all" }, 86400),
  ]);
  if (!p.name) throw new MarketDataError(`No company found for ${symbol}.`, 404);
  const metric = m.metric ?? {};
  const mc = num(p.marketCapitalization);
  return {
    symbol,
    name: String(p.name),
    logo: (p.logo as string) || null,
    industry: (p.finnhubIndustry as string) || null,
    exchange: (p.exchange as string) || null,
    country: (p.country as string) || null,
    website: (p.weburl as string) || null,
    marketCap: mc === null ? null : mc * 1_000_000, // Finnhub reports millions
    shares: num(p.shareOutstanding) === null ? null : num(p.shareOutstanding)! * 1_000_000,
    stats: {
      peRatio: num(metric.peTTM) ?? num(metric.peBasicExclExtraTTM),
      week52High: num(metric["52WeekHigh"]),
      week52Low: num(metric["52WeekLow"]),
      dividendYield: num(metric.currentDividendYieldTTM),
      beta: num(metric.beta),
    },
  };
}

type RawNews = { id: number; headline: string; summary: string; source: string; url: string; image: string; datetime: number };
const toNews = (n: RawNews): NewsItem => ({
  id: n.id, headline: n.headline, summary: n.summary, source: n.source,
  url: n.url, image: n.image || null, datetime: n.datetime,
});

export async function getMarketNews(): Promise<NewsItem[]> {
  const r = await get<RawNews[]>("/news", { category: "general" }, 300);
  return r.slice(0, 12).map(toNews);
}

export async function getCompanyNews(symbol: string): Promise<NewsItem[]> {
  "use cache";
  cacheLife("minutes");
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const to = new Date();
  const from = new Date(Date.now() - 7 * 86400_000);
  const r = await get<RawNews[]>("/company-news", { symbol, from: day(from), to: day(to) }, 300);
  return r.slice(0, 10).map(toNews);
}
