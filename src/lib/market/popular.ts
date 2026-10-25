// Finnhub's free plan has no "top movers" endpoint, so movers are ranked within this fixed set.
export const INDEX_FUNDS = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "Nasdaq 100" },
  { symbol: "DIA", name: "Dow Jones" },
  { symbol: "IWM", name: "Russell 2000" },
] as const;

export const POPULAR = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "JPM", name: "JPMorgan" },
  { symbol: "V", name: "Visa" },
  { symbol: "BA", name: "Boeing" },
] as const;

export const OVERVIEW_SYMBOLS: string[] = [...INDEX_FUNDS, ...POPULAR].map((s) => s.symbol);
