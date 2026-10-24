import { describe, expect, it } from "vitest";
import { priceHoldings, sharesHeld, summarize, type Tx } from "./holdings";

let n = 0;
const tx = (type: Tx["type"], symbol: string, shares: number, price: number, executedAt: string, fees = 0): Tx => ({
  id: String(++n), symbol, type, shares, price, fees, executedAt, createdAt: String(n).padStart(4, "0"),
});

describe("summarize", () => {
  it("averages cost across buys, including fees", () => {
    const s = summarize([tx("buy", "AAPL", 10, 100, "2024-01-01", 5), tx("buy", "AAPL", 10, 200, "2024-02-01")]);
    expect(s.holdings).toHaveLength(1);
    expect(s.holdings[0].shares).toBe(10 + 10);
    expect(s.holdings[0].costBasis).toBeCloseTo(1005 + 2000);
    expect(s.holdings[0].avgCost).toBeCloseTo(3005 / 20);
  });

  it("realizes P/L on a partial sell and shrinks cost basis proportionally", () => {
    const s = summarize([tx("buy", "AAPL", 10, 100, "2024-01-01"), tx("sell", "AAPL", 4, 150, "2024-02-01", 1)]);
    // proceeds 600 - fee 1 - cost 400 = 199
    expect(s.realizedPnl.AAPL).toBeCloseTo(199);
    expect(s.holdings[0].shares).toBe(6);
    expect(s.holdings[0].costBasis).toBeCloseTo(600);
    expect(s.holdings[0].avgCost).toBeCloseTo(100);
  });

  it("closes the position when everything is sold", () => {
    const s = summarize([tx("buy", "TSLA", 5, 100, "2024-01-01"), tx("sell", "TSLA", 5, 80, "2024-02-01")]);
    expect(s.holdings).toHaveLength(0);
    expect(s.realizedPnl.TSLA).toBeCloseTo(-100);
  });

  it("processes by date, not entry order", () => {
    const s = summarize([tx("sell", "MSFT", 5, 120, "2024-03-01"), tx("buy", "MSFT", 10, 100, "2024-01-01")]);
    expect(s.oversold).toEqual([]);
    expect(s.holdings[0].shares).toBe(5);
  });

  it("flags oversells and never goes negative", () => {
    const s = summarize([tx("buy", "NVDA", 2, 100, "2024-01-01"), tx("sell", "NVDA", 5, 100, "2024-02-01")]);
    expect(s.oversold).toEqual(["NVDA"]);
    expect(s.holdings).toHaveLength(0);
  });

  it("counts dividends as income without changing holdings", () => {
    const s = summarize([tx("buy", "KO", 100, 60, "2024-01-01"), tx("dividend", "KO", 100, 0.5, "2024-04-01", 1)]);
    expect(s.dividends.KO).toBeCloseTo(49);
    expect(s.holdings[0].shares).toBe(100);
  });

  it("keeps symbols separate", () => {
    const s = summarize([tx("buy", "A", 1, 10, "2024-01-01"), tx("buy", "B", 2, 20, "2024-01-01")]);
    expect(s.holdings.map((h) => h.symbol).sort()).toEqual(["A", "B"]);
  });

  it("re-buying after a full exit starts a fresh cost basis", () => {
    const s = summarize([
      tx("buy", "X", 10, 100, "2024-01-01"), tx("sell", "X", 10, 100, "2024-02-01"), tx("buy", "X", 5, 50, "2024-03-01"),
    ]);
    expect(s.holdings[0].avgCost).toBeCloseTo(50);
    expect(s.holdings[0].firstBuy).toBe("2024-03-01");
  });
});

describe("sharesHeld", () => {
  it("returns shares held for one symbol", () => {
    const list = [tx("buy", "AAPL", 10, 1, "2024-01-01"), tx("sell", "AAPL", 3, 1, "2024-01-02"), tx("buy", "MSFT", 9, 1, "2024-01-01")];
    expect(sharesHeld(list, "AAPL")).toBe(7);
    expect(sharesHeld(list, "NOPE")).toBe(0);
  });
});

describe("priceHoldings", () => {
  it("computes value, gain and day change from live quotes", () => {
    const { holdings } = summarize([tx("buy", "AAPL", 10, 100, "2024-01-01")]);
    const [p] = priceHoldings(holdings, { AAPL: { price: 150, prevClose: 148 } });
    expect(p.value).toBe(1500);
    expect(p.gain).toBe(500);
    expect(p.gainPct).toBeCloseTo(50);
    expect(p.dayChange).toBeCloseTo(20);
  });

  it("does not invent a loss when no quote is available yet", () => {
    const { holdings } = summarize([tx("buy", "AAPL", 10, 100, "2024-01-01")]);
    const [p] = priceHoldings(holdings, {});
    expect(p.gain).toBe(0);
    expect(p.dayChange).toBe(0);
  });
});
