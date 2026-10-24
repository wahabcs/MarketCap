import { MarketDataError } from "./finnhub";

export function errorResponse(e: unknown) {
  if (e instanceof MarketDataError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Unexpected server error." }, { status: 500 });
}
