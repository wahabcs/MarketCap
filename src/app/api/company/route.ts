import type { NextRequest } from "next/server";
import { getCompany, normalizeSymbol } from "@/lib/market/finnhub";
import { errorResponse } from "@/lib/market/route-helpers";

// GET /api/company?symbol=AAPL
export async function GET(req: NextRequest) {
  const symbol = normalizeSymbol(req.nextUrl.searchParams.get("symbol") ?? "");
  if (!symbol) return Response.json({ error: "Provide ?symbol=AAPL" }, { status: 400 });
  try {
    return Response.json({ company: await getCompany(symbol) });
  } catch (e) {
    return errorResponse(e);
  }
}
