import type { NextRequest } from "next/server";
import { normalizeSymbol } from "@/lib/market/finnhub";
import { isRange } from "@/lib/market/ranges";
import { errorResponse } from "@/lib/market/route-helpers";
import { getHistory } from "@/lib/market/twelvedata";

// GET /api/history?symbol=AAPL&range=1M
export async function GET(req: NextRequest) {
  const symbol = normalizeSymbol(req.nextUrl.searchParams.get("symbol") ?? "");
  const range = req.nextUrl.searchParams.get("range");
  if (!symbol || !isRange(range)) return Response.json({ error: "Provide ?symbol=AAPL&range=1M" }, { status: 400 });
  try {
    return Response.json({ symbol, range, bars: await getHistory(symbol, range) });
  } catch (e) {
    return errorResponse(e);
  }
}
