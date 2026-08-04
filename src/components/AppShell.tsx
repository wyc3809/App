"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartPie,
  LayoutDashboard,
  Receipt,
  WalletCards,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: WalletCards },
  { href: "/history", label: "Ledger", icon: Receipt },
  { href: "/graphs", label: "Graphs", icon: ChartPie },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <main className="px-4 pt-5">{children}</main>

      <nav
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t px-2 pt-2"
        style={{
          background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)",
          borderColor: "var(--border)",
          backdropFilter: "blur(16px)",
          paddingBottom: "calc(10px + var(--safe-bottom))",
        }}
        aria-label="Primary"
      >
        <ul className="grid grid-cols-4 gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition"
                  style={{
                    color: active ? "var(--accent)" : "var(--fg-subtle)",
                    background: active ? "var(--accent-soft)" : "transparent",
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
