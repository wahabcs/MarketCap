import "server-only";
import { cacheLife } from "next/cache";
import type { Company, NewsItem, Quote, SearchResult } from "./types";

const BASE = "https://finnhub.io/api/v1";

export class MarketDataError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

import { fail, type Result } from "./result";

// Cache Components: successful responses are cached for `revalidate` seconds. Failures (rate limit,
// bad key, outage) are cached for ~2s only, so one bad response never sticks around.
async function cachedGet<T>(path: string, params: Record<string, string>, revalidate: number): Promise<Result<T>> {
  "use cache";
  const failed = (status: number, message: string) => {
    cacheLife({ stale: 0, revalidate: 2, expire: 10 });
    return fail(status, message);
  };

  const key = process.env.FINNHUB_API_KEY;
  if (!key) return failed(503, "FINNHUB_API_KEY is not set. Add it to .env.local.");

  const url = `${BASE}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { "X-Finnhub-Token": key } });
  if (res.status === 429) return failed(429, "Market data rate limit reached. Try again shortly.");
  if (!res.ok) return failed(502, `Market data request failed (${res.status}).`);

  const data = (await res.json()) as T;
  cacheLife({ stale: Math.min(revalidate, 30), revalidate, expire: revalidate * 4 });
  return { ok: true, data };
}

async function get<T>(path: string, params: Record<string, string>, revalidate: number): Promise<T> {
  const r = await cachedGet<T>(path, params, revalidate);
  if (!r.ok) throw new MarketDataError(r.message, r.status);
  return r.data;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function normalizeSymbol(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  return /^[A-Z0-9.\-]{1,12}$/.test(s) ? s : null;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const q = await get<{ c: number; d: number | null; dp: number | null; h: number; l: number; o: number; pc: number; t: number }>(
    "/quote", { symbol }, 30,
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

// Dates are computed inside the cache scope, which is the allowed place for "now".
async function cachedCompanyNews(symbol: string): Promise<Result<RawNews[]>> {
  "use cache";
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const to = new Date();
  const from = new Date(Date.now() - 7 * 86400_000);
  const r = await cachedGet<RawNews[]>("/company-news", { symbol, from: day(from), to: day(to) }, 300);
  cacheLife(r.ok ? { stale: 30, revalidate: 300, expire: 1200 } : { stale: 0, revalidate: 2, expire: 10 });
  return r;
}

export async function getCompanyNews(symbol: string): Promise<NewsItem[]> {
  const r = await cachedCompanyNews(symbol);
  if (!r.ok) throw new MarketDataError(r.message, r.status);
  return r.data.slice(0, 10).map(toNews);
}
