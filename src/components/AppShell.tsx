"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  Receipt,
  WalletCards,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n";
import { hapticTap } from "@/lib/haptic";

const NAV = [
  { href: "/", labelKey: "nav.home" as TranslationKey, icon: LayoutDashboard },
  { href: "/accounts", labelKey: "nav.accounts" as TranslationKey, icon: WalletCards },
  { href: "/history", labelKey: "nav.ledger" as TranslationKey, icon: Receipt },
  { href: "/graphs", labelKey: "nav.insights" as TranslationKey, icon: ChartNoAxesColumnIncreasing },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="app-shell">
      {/* Only this region scrolls — tab bar stays pinned (no rubber-band black gaps). */}
      <main className="app-main px-4">{children}</main>

      <nav className="app-tabbar z-40" aria-label="Primary">
        <ul className="grid grid-cols-4 gap-1">
          {NAV.map(({ href, labelKey, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            const label = t(labelKey);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold uppercase tracking-wide transition"
                  style={{
                    color: active ? "var(--accent)" : "var(--fg-subtle)",
                    background: active ? "var(--accent-soft)" : "transparent",
                  }}
                  aria-current={active ? "page" : undefined}
                  onClick={() => hapticTap()}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
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
