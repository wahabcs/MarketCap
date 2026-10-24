import "server-only";
import { cacheLife } from "next/cache";
import { MarketDataError } from "./finnhub";
import type { Bar, Range } from "./ranges";

const BASE = "https://api.twelvedata.com";

type TdResponse = {
  status?: string;
  code?: number;
  message?: string;
  values?: { datetime: string; close: string }[];
};

import { fail, type Result } from "./result";

// Free plan: 8 requests/minute, 800/day. Every call below is cached, so repeat views cost nothing.
async function fetchSeries(symbol: string, params: Record<string, string>): Promise<Result<Bar[]>> {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) return fail(503, "TWELVEDATA_API_KEY is not set. Add it to .env.local.");

  const url = `${BASE}/time_series?${new URLSearchParams({ symbol, order: "asc", ...params })}`;
  const res = await fetch(url, { headers: { Authorization: `apikey ${key}` } });

  // Twelve Data answers unknown symbols with HTTP 404 and other errors with a JSON body.
  let body: TdResponse = {};
  try {
    body = (await res.json()) as TdResponse;
  } catch {
    /* fall through to status handling */
  }
  const code = body.status === "error" ? body.code : res.ok ? undefined : res.status;
  if (code === 429) return fail(429, "Chart data rate limit reached. Try again in a minute.");
  if (code === 400 || code === 404) return fail(404, `No chart data found for ${symbol}.`);
  if (code) return fail(502, "Chart data is unavailable right now.");

  const bars = (body.values ?? []).map((v) => ({ t: v.datetime, c: Number(v.close) })).filter((b) => Number.isFinite(b.c));
  return { ok: true, data: bars };
}

const SHORT = { stale: 0, revalidate: 2, expire: 10 };

async function intraday(symbol: string, interval: string, outputsize: string): Promise<Result<Bar[]>> {
  "use cache";
  const r = await fetchSeries(symbol, { interval, outputsize });
  cacheLife(r.ok ? { stale: 60, revalidate: 300, expire: 1800 } : SHORT);
  return r;
}

async function daily(symbol: string, params: Record<string, string>): Promise<Result<Bar[]>> {
  "use cache";
  if (params.start_date === "YTD") {
    params = { ...params, start_date: `${new Date().getUTCFullYear()}-01-01` };
  }
  const r = await fetchSeries(symbol, params);
  cacheLife(r.ok ? { stale: 300, revalidate: 3600, expire: 86400 } : SHORT);
  return r;
}

async function unwrap(r: Promise<Result<Bar[]>>): Promise<Bar[]> {
  const res = await r;
  if (!res.ok) throw new MarketDataError(res.message, res.status);
  return res.data;
}

export async function getHistory(symbol: string, range: Range): Promise<Bar[]> {
  switch (range) {
    case "1D": {
      const bars = await unwrap(intraday(symbol, "5min", "120"));
      const lastDay = bars.at(-1)?.t.slice(0, 10); // keep only the most recent session
      return bars.filter((b) => b.t.startsWith(lastDay ?? ""));
    }
    case "5D": {
      const bars = await unwrap(intraday(symbol, "30min", "80"));
      const days = [...new Set(bars.map((b) => b.t.slice(0, 10)))].slice(-5);
      return bars.filter((b) => days.includes(b.t.slice(0, 10)));
    }
    case "1M": return unwrap(daily(symbol, { interval: "1day", outputsize: "23" }));
    case "6M": return unwrap(daily(symbol, { interval: "1day", outputsize: "127" }));
    case "YTD": return unwrap(daily(symbol, { interval: "1day", start_date: "YTD" }));
    case "1Y": return unwrap(daily(symbol, { interval: "1day", outputsize: "253" }));
    case "5Y": return unwrap(daily(symbol, { interval: "1week", outputsize: "262" }));
  }
}
