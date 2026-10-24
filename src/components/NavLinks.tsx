"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Globe, Home, Receipt, Star } from "lucide-react";

const nav = [
  { label: "Overview", icon: Home, href: "/" },
  { label: "Portfolio", icon: BarChart3, href: "/portfolio" },
  { label: "Watchlist", icon: Star, href: "/watchlist" },
  { label: "Transactions", icon: Receipt, href: "/transactions" },
  { label: "News", icon: Globe, href: "/news" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {nav.map(({ label, icon: Icon, href }) => {
        const active = href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] ${active ? "bg-muted-surface font-medium" : "text-muted hover:bg-muted-surface"}`}
          >
            <Icon size={18} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
