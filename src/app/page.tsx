import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { MarketNews } from "@/components/MarketNews";
import { MarketOverview } from "@/components/MarketOverview";

export default function Overview() {
  return (
    <AppShell>
      <MarketOverview
        news={
          <Suspense fallback={<div className="mt-4 h-40 animate-pulse rounded-xl bg-muted-surface" />}>
            <MarketNews />
          </Suspense>
        }
      />
    </AppShell>
  );
}
