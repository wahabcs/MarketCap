"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import {
  BarChart3, Boxes, FolderClosed, Globe, Home, LayoutGrid, LogIn, LogOut, Moon, Plus, Star, Sun, User,
} from "lucide-react";

const nav = [
  { label: "Overview", icon: Home, href: "/" },
  { label: "My Stock", icon: LayoutGrid },
  { label: "Watchlist", icon: Star, href: "/watchlist" },
  { label: "Portfolio", icon: BarChart3, active: true },
  { label: "Analytic", icon: BarChart3 },
  { label: "News", icon: Globe },
  { label: "Account", icon: User },
];
const files = [{ label: "Transactions", href: "/transactions" }];

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

      <nav className="flex flex-col gap-1">
        {nav.map(({ label, icon: Icon, active, href }) => (
          <a
            key={label}
            href={href ?? "#"}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] ${
              active ? "bg-muted-surface font-medium" : "text-muted hover:bg-muted-surface"
            }`}
          >
            <Icon size={18} /> {label}
          </a>
        ))}
      </nav>

      <hr className="my-5 border-border" />
      <div className="mb-2 flex items-center justify-between px-3">
        <span className="font-medium">Files</span>
        <Plus size={16} className="text-muted" />
      </div>
      <div className="flex flex-col gap-1">
        {files.map((f) => (
          <a key={f.label} href={f.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-muted hover:bg-muted-surface">
            <FolderClosed size={18} /> {f.label}
          </a>
        ))}
      </div>

      <div className="mt-auto">
        <AccountBox />
        <ThemeToggle />
      </div>
    </aside>
  );
}
