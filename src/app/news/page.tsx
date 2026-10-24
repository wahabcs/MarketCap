import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { MarketNews } from "@/components/MarketNews";

export default function NewsPage() {
  return (
    <AppShell>
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-lg font-medium">Market news</h1>
        <Suspense fallback={<div className="mt-4 h-40 animate-pulse rounded-xl bg-muted-surface" />}>
          <MarketNews />
        </Suspense>
      </section>
    </AppShell>
  );
}
