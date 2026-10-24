"use client";

import Link from "next/link";
import { Suspense, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import { NavLinks } from "./NavLinks";
import { Boxes, LogIn, LogOut, Moon, Sun } from "lucide-react";


export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const current = mounted ? theme : "light";
  const btn = (id: "light" | "dark", Icon: typeof Sun, label: string) => (
    <button
      onClick={() => setTheme(id)}
      aria-pressed={current === id}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition ${
        current === id ? "bg-surface text-foreground shadow-sm" : "text-muted"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
  return (
    <div className="flex gap-1 rounded-2xl bg-muted-surface p-1">
      {btn("light", Sun, "Light")}
      {btn("dark", Moon, "Dark")}
    </div>
  );
}

function AccountBox() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <div className="mb-3 h-12" />;
  if (!user) {
    return (
      <Link href="/login" className="mb-3 flex items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-medium text-white">
        <LogIn size={16} /> Sign in
      </Link>
    );
  }
  return (
    <div className="mb-3 flex items-center gap-2 rounded-2xl bg-muted-surface px-3 py-2.5">
      <span className="min-w-0 flex-1 truncate text-sm" title={user.email ?? ""}>{user.email}</span>
      <button onClick={signOut} aria-label="Sign out" className="text-muted hover:text-foreground">
        <LogOut size={16} />
      </button>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar px-5 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
          <Boxes size={20} />
        </div>
        <span className="text-xl font-semibold">MarketCap</span>
      </div>

      <Suspense fallback={<div className="h-56" />}>
        <NavLinks />
      </Suspense>

      <div className="mt-auto">
        <AccountBox />
        <ThemeToggle />
      </div>
    </aside>
  );
}
