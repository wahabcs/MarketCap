export type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  timestamp: number;
};

export type SearchResult = { symbol: string; name: string; type: string };

export type Company = {
  symbol: string;
  name: string;
  logo: string | null;
  industry: string | null;
  exchange: string | null;
  country: string | null;
  website: string | null;
  marketCap: number | null; // USD
  shares: number | null;
  stats: {
    peRatio: number | null;
    week52High: number | null;
    week52Low: number | null;
    dividendYield: number | null;
    beta: number | null;
  };
};

export type NewsItem = {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string | null;
  datetime: number; // unix seconds
};
