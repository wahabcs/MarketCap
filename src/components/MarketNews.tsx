import { getMarketNews } from "@/lib/market/finnhub";
import type { NewsItem } from "@/lib/market/types";
import { NewsList } from "./NewsList";

export async function MarketNews() {
  let items: NewsItem[];
  try {
    items = await getMarketNews();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Couldn't load news.";
    return <p role="alert" className="mt-4 text-sm text-down">{message}</p>;
  }
  return <NewsList items={items} />;
}
