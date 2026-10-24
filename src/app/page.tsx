import { AppShell } from "@/components/AppShell";
import { MyStockTable } from "@/components/MyStockTable";
import { PortfolioValue } from "@/components/PortfolioValue";
import { StatsChart } from "@/components/StatsChart";
import { StockCards } from "@/components/StockCards";
import { holdings } from "@/lib/mock";
import { QuotesProvider } from "@/lib/useQuotes";

export default function Dashboard() {
  return (
    <AppShell>
      <QuotesProvider symbols={holdings.map((h) => h.symbol)}>
        <StockCards />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <PortfolioValue />
          <StatsChart />
        </div>
        <MyStockTable />
      </QuotesProvider>
    </AppShell>
  );
}
