import type { ReactNode } from "react";
import { SearchBar } from "./SearchBar";
import { Sidebar, ThemeToggle } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-sidebar">
      <Sidebar />
      <main className="min-w-0 flex-1 p-3 lg:py-3 lg:pr-3 lg:pl-0">
        <div className="flex min-h-full flex-col gap-4 rounded-3xl bg-background p-4 sm:p-5">
          <SearchBar />
          {children}
        </div>
      </main>
      <div className="fixed bottom-4 left-4 z-50 w-40 rounded-2xl border border-border bg-sidebar shadow-lg lg:hidden">
        <ThemeToggle />
      </div>
    </div>
  );
}
