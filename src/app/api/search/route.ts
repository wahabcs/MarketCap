import type { NextRequest } from "next/server";
import { searchSymbols } from "@/lib/market/finnhub";
import { errorResponse } from "@/lib/market/route-helpers";

// GET /api/search?q=apple
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 40);
  if (!q) return Response.json({ results: [] });
  try {
    return Response.json({ results: await searchSymbols(q) });
  } catch (e) {
    return errorResponse(e);
  }
}
