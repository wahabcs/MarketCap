import type { NextRequest } from "next/server";
import { getQuote, normalizeSymbol } from "@/lib/market/finnhub";
import { errorResponse } from "@/lib/market/route-helpers";

// GET /api/quote?symbols=AAPL,MSFT
// Returns the quotes that succeeded. It only fails when every symbol fails, so one rate-limited
// or unknown symbol doesn't blank out the rest of the page.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map(normalizeSymbol).filter((s): s is string => !!s))].slice(0, 20);
  if (!symbols.length) return Response.json({ error: "Provide ?symbols=AAPL,MSFT" }, { status: 400 });

  const results = await Promise.allSettled(symbols.map(getQuote));
  const quotes = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (quotes.length) {
    const failed = results.length - quotes.length;
    return Response.json({ quotes, ...(failed ? { partial: failed } : {}) });
  }
  const firstError = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  return errorResponse(firstError?.reason);
}
