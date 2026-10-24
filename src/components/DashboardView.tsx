"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LineChart, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { priceHoldings, summarize } from "@/lib/portfolio/holdings";
import { QuotesProvider, useQuotes } from "@/lib/useQuotes";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { AllocationChart } from "./AllocationChart";
import { MyStockTable } from "./MyStockTable";
import { PortfolioValue } from "./PortfolioValue";
import { StockCards } from "./StockCards";

function Body({ summary }: { summary: ReturnType<typeof summarize> }) {
  const { quotes, error } = useQuotes();
  const priced = useMemo(() => priceHoldings(summary.holdings, quotes), [summary.holdings, quotes]);
  const live = useMemo(() => Object.fromEntries(Object.keys(quotes).map((k) => [k, quotes[k].price])), [quotes]);
  const ready = priced.every((h) => h.symbol in live);
  const realized = Object.values(summary.realizedPnl).reduce((a, b) => a + b, 0);
  const dividends = Object.values(summary.dividends).reduce((a, b) => a + b, 0);

  return (
    <>
      {error && <p role="alert" className="rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}
      {summary.oversold.length > 0 && (
        <p role="alert" className="rounded-xl bg-down-soft px-4 py-2 text-sm text-down">
          Your sells for {summary.oversold.join(", ")} exceed the shares you held. Check your transactions.
        </p>
      )}
      {priced.length > 0 && (
        <>
          <StockCards priced={priced} live={live} />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <PortfolioValue priced={priced} ready={ready} realized={realized} dividends={dividends} />
            <AllocationChart priced={priced} />
          </div>
          <MyStockTable priced={priced} live={live} />
        </>
      )}
    </>
  );
}

export function DashboardView() {
  const { user, loading: authLoading } = useAuth();
  const { loading, error, portfolios, selectedId, select, transactions } = usePortfolio();
  const [dialog, setDialog] = useState(false);
  const summary = useMemo(() => summarize(transactions), [transactions]);
  const symbols = summary.holdings.map((h) => h.symbol).slice(0, 20);

  if (authLoading || loading) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;

  if (!user) {
    return (
      <section className="grid place-items-center gap-3 rounded-2xl border border-border bg-surface p-10 text-center">
        <LineChart size={32} className="text-brand" />
        <h1 className="text-xl font-semibold">Track your investments</h1>
        <p className="max-w-sm text-sm text-muted">Sign in to build your portfolio, record trades and see live gains and losses.</p>
        <Link href="/login" className="mt-2 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white">Sign in</Link>
      </section>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {portfolios.length > 0 && (
          <select
            aria-label="Portfolio" value={selectedId ?? ""} onChange={(e) => select(e.target.value)}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium outline-none focus:border-brand"
          >
            {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <button onClick={() => setDialog(true)} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
          <Plus size={16} /> Add transaction
        </button>
        {transactions.length > 0 && (
          <Link href="/transactions" className="text-sm text-muted hover:text-foreground">View all transactions →</Link>
        )}
      </div>

      {error && <p role="alert" className="rounded-xl bg-down-soft px-4 py-2 text-sm text-down">{error}</p>}

      {transactions.length === 0 ? (
        <section className="grid place-items-center gap-3 rounded-2xl border border-border bg-surface p-10 text-center">
          <LineChart size={32} className="text-brand" />
          <h1 className="text-xl font-semibold">Your portfolio is empty</h1>
          <p className="max-w-sm text-sm text-muted">Record your first buy to see live value and gains. You can also open any stock page and tap “Add to portfolio”.</p>
        </section>
      ) : (
        <QuotesProvider symbols={symbols}>
          <Body summary={summary} />
        </QuotesProvider>
      )}

      {dialog && <AddTransactionDialog onClose={() => setDialog(false)} />}
    </>
  );
}
