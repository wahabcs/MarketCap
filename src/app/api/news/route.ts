import type { NextRequest } from "next/server";
import { getCompanyNews, getMarketNews, normalizeSymbol } from "@/lib/market/finnhub";
import { errorResponse } from "@/lib/market/route-helpers";

// GET /api/news            -> general market news
// GET /api/news?symbol=AAPL -> company news
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbol");
  try {
    if (raw) {
      const symbol = normalizeSymbol(raw);
      if (!symbol) return Response.json({ error: "Invalid symbol." }, { status: 400 });
      return Response.json({ news: await getCompanyNews(symbol) });
    }
    return Response.json({ news: await getMarketNews() });
  } catch (e) {
    return errorResponse(e);
  }
}
