import type { NextRequest } from "next/server";
import { getQuote, normalizeSymbol } from "@/lib/market/finnhub";
import { errorResponse } from "@/lib/market/route-helpers";

// GET /api/quote?symbols=AAPL,MSFT
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map(normalizeSymbol).filter((s): s is string => !!s))].slice(0, 20);
  if (!symbols.length) return Response.json({ error: "Provide ?symbols=AAPL,MSFT" }, { status: 400 });
  try {
    const quotes = await Promise.all(symbols.map(getQuote));
    return Response.json({ quotes });
  } catch (e) {
    return errorResponse(e);
  }
}
