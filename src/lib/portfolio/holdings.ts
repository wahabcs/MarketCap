export type TxType = "buy" | "sell" | "dividend";

export type Tx = {
  id: string;
  symbol: string;
  type: TxType;
  shares: number;
  price: number; // per share
  fees: number;
  executedAt: string; // YYYY-MM-DD
  createdAt?: string;
};

export type Holding = {
  symbol: string;
  shares: number;
  costBasis: number; // total cost of the shares still held (average-cost method)
  avgCost: number;
  firstBuy: string;
};

export type PositionSummary = {
  holdings: Holding[]; // open positions only
  realizedPnl: Record<string, number>; // per symbol, from sells
  dividends: Record<string, number>; // per symbol
  oversold: string[]; // symbols where sells exceeded shares held
};

const EPS = 1e-9;

// Oldest first; ties keep entry order so a same-day buy is processed before its sell.
const byDate = (a: Tx, b: Tx) =>
  a.executedAt.localeCompare(b.executedAt) || (a.createdAt ?? "").localeCompare(b.createdAt ?? "");

/**
 * Average-cost accounting:
 *  - buy: shares and cost basis increase (fees are added to cost)
 *  - sell: cost basis shrinks proportionally; realized P/L = proceeds - fees - cost of shares sold
 *  - dividend: income = shares * per-share amount - fees (does not change holdings)
 */
export function summarize(transactions: Tx[]): PositionSummary {
  const open = new Map<string, { shares: number; cost: number; firstBuy: string }>();
  const realizedPnl: Record<string, number> = {};
  const dividends: Record<string, number> = {};
  const oversold = new Set<string>();

  for (const t of [...transactions].sort(byDate)) {
    const pos = open.get(t.symbol) ?? { shares: 0, cost: 0, firstBuy: t.executedAt };

    if (t.type === "buy") {
      if (pos.shares <= EPS) pos.firstBuy = t.executedAt;
      pos.shares += t.shares;
      pos.cost += t.shares * t.price + t.fees;
    } else if (t.type === "sell") {
      const sold = Math.min(t.shares, pos.shares);
      if (t.shares > pos.shares + EPS) oversold.add(t.symbol);
      const avg = pos.shares > EPS ? pos.cost / pos.shares : 0;
      const costOut = avg * sold;
      realizedPnl[t.symbol] = (realizedPnl[t.symbol] ?? 0) + (sold * t.price - t.fees - costOut);
      pos.shares -= sold;
      pos.cost -= costOut;
    } else {
      dividends[t.symbol] = (dividends[t.symbol] ?? 0) + (t.shares * t.price - t.fees);
    }
    open.set(t.symbol, pos);
  }

  const holdings: Holding[] = [];
  for (const [symbol, p] of open) {
    if (p.shares > EPS) {
      holdings.push({ symbol, shares: p.shares, costBasis: p.cost, avgCost: p.cost / p.shares, firstBuy: p.firstBuy });
    }
  }
  return { holdings, realizedPnl, dividends, oversold: [...oversold] };
}

/** Shares currently held of one symbol, optionally as of a transaction list excluding one id (for edits). */
export function sharesHeld(transactions: Tx[], symbol: string): number {
  return summarize(transactions.filter((t) => t.symbol === symbol)).holdings[0]?.shares ?? 0;
}

export type Priced = Holding & { price: number; prevClose: number; value: number; gain: number; gainPct: number; dayChange: number };

export function priceHoldings(
  holdings: Holding[],
  quotes: Record<string, { price: number; prevClose: number } | undefined>,
): Priced[] {
  return holdings.map((h) => {
    const q = quotes[h.symbol];
    const price = q?.price ?? 0;
    const prevClose = q?.prevClose ?? 0;
    const value = h.shares * price;
    const gain = q ? value - h.costBasis : 0;
    return {
      ...h, price, prevClose, value, gain,
      gainPct: q && h.costBasis > 0 ? (gain / h.costBasis) * 100 : 0,
      dayChange: q ? h.shares * (price - prevClose) : 0,
    };
  });
}
