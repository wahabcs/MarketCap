// Placeholder holdings until portfolios are stored in Supabase.
// Prices and daily change come live from /api/quote.
export type Holding = {
  symbol: string;
  name: string;
  color: string;
  shares: number;
  investDate: string;
};

export const holdings: Holding[] = [
  { symbol: "AAPL", name: "Apple Inc", color: "#111827", shares: 20, investDate: "Feb 22, 2024" },
  { symbol: "GOOGL", name: "Alphabet Inc", color: "#4285f4", shares: 15, investDate: "Feb 20, 2024" },
  { symbol: "NVDA", name: "NVIDIA Corp", color: "#76b900", shares: 12, investDate: "Feb 19, 2024" },
  { symbol: "TSLA", name: "Tesla Inc", color: "#e31937", shares: 8, investDate: "Feb 17, 2024" },
  { symbol: "MSFT", name: "Microsoft Corp", color: "#00a4ef", shares: 10, investDate: "Feb 12, 2024" },
];

// Placeholder until historical candles are wired in.
export const statistics = [
  { day: "Dec 1", value: 38000 },
  { day: "Dec 2", value: 39000 },
  { day: "Dec 3", value: 42500 },
  { day: "Dec 4", value: 43000 },
  { day: "Dec 5", value: 41000 },
  { day: "Dec 6", value: 38500 },
  { day: "Dec 7", value: 42500 },
  { day: "Dec 8", value: 45000 },
  { day: "Dec 9", value: 47500 },
  { day: "Dec 10", value: 52000 },
];

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
