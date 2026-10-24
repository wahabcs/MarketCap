import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LivePrice } from "@/components/LivePrice";
import { NewsList } from "@/components/NewsList";
import { StockActions } from "@/components/StockActions";
import { StockChart } from "@/components/StockChart";
import { getCompany, getCompanyNews, getQuote, MarketDataError, normalizeSymbol } from "@/lib/market/finnhub";
import { QuotesProvider } from "@/lib/useQuotes";
import { money } from "@/lib/format";

const compact = (n: number | null) =>
  n === null ? "—" : "$" + new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
const fixed = (n: number | null, suffix = "") => (n === null ? "—" : `${n.toFixed(2)}${suffix}`);

export default function StockPage({ params }: PageProps<"/stocks/[symbol]">) {
  return (
    <AppShell>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
        <StockContent params={params} />
      </Suspense>
    </AppShell>
  );
}

async function StockContent({ params }: { params: PageProps<"/stocks/[symbol]">["params"] }) {
  const symbol = normalizeSymbol(decodeURIComponent((await params).symbol));
  if (!symbol) notFound();

  let data;
  try {
    const [quote, company, news] = await Promise.all([
      getQuote(symbol),
      getCompany(symbol),
      getCompanyNews(symbol).catch(() => []),
    ]);
    data = { quote, company, news };
  } catch (e) {
    if (e instanceof MarketDataError && e.status === 404) notFound();
    const message = e instanceof MarketDataError ? e.message : "Something went wrong loading this stock.";
    return <p className="rounded-2xl bg-down-soft p-5 text-down">{message}</p>;
  }

  const { quote, company, news } = data;
  const stats: [string, string][] = [
    ["Open", money(quote.open)],
    ["Day high", money(quote.high)],
    ["Day low", money(quote.low)],
    ["Previous close", money(quote.prevClose)],
    ["Market cap", compact(company.marketCap)],
    ["P/E ratio", fixed(company.stats.peRatio)],
    ["52-week high", company.stats.week52High === null ? "—" : money(company.stats.week52High)],
    ["52-week low", company.stats.week52Low === null ? "—" : money(company.stats.week52Low)],
    ["Dividend yield", fixed(company.stats.dividendYield, "%")],
    ["Beta", fixed(company.stats.beta)],
  ];

  return (
    <>
      <QuotesProvider symbols={[symbol]}>
        <section className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center gap-4">
            {company.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo} alt="" className="h-12 w-12 rounded-full bg-white object-contain p-1 ring-1 ring-border" />
            )}
            <div className="min-w-40 flex-1">
              <h1 className="text-2xl font-semibold">{company.name}</h1>
              <p className="text-sm text-muted">
                {symbol}
                {company.exchange && ` · ${company.exchange.split(" ")[0]}`}
                {company.industry && ` · ${company.industry}`}
              </p>
            </div>
            <StockActions symbol={symbol} price={quote.price} />
          </div>
          <div className="mt-5">
            <LivePrice initial={quote} />
            <p className="mt-1 text-xs text-muted">Prices may be delayed. Not financial advice.</p>
          </div>
        </section>
      </QuotesProvider>

      <StockChart symbol={symbol} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-medium">Key stats</h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
            {stats.map(([k, v]) => (
              <div key={k} className="border-b border-border pb-3">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-brand">
              {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
            </a>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-lg font-medium">Latest news</h2>
          <NewsList items={news} />
        </section>
      </div>
    </>
  );
}
