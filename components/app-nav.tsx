"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useT } from "@/components/prefs";

/**
 * Navigation.
 *
 * A thumb reaches the bottom of a phone, not the top, so the primary tabs
 * live there. On a wider screen they move into the header where there is room.
 */

type Item = { href: string; label: string; icon: ReactNode };

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" aria-hidden="true">
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5",
  orders: "M5 3h11l3 3v15H5zM9 8h6M9 12h6M9 16h4",
  customers:
    "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.2a3.5 3.5 0 0 1 0 6.6",
  income: "M4 19h16M7 16V9m5 7V5m5 11v-5",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 8 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H2a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3.7 8a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
};

export function useNavItems(): Item[] {
  const t = useT();
  return [
    { href: "/dashboard", label: t.navHome, icon: <Icon d={PATHS.home} /> },
    { href: "/orders", label: t.navOrders, icon: <Icon d={PATHS.orders} /> },
    { href: "/customers", label: t.navCustomers, icon: <Icon d={PATHS.customers} /> },
    { href: "/income", label: t.navIncome, icon: <Icon d={PATHS.income} /> },
    { href: "/settings", label: t.navSettings, icon: <Icon d={PATHS.settings} /> },
  ];
}

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function DesktopNav() {
  const items = useNavItems();
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
            isActive(pathname, item.href)
              ? "bg-green-wash text-green-deep"
              : "text-soft hover:bg-green-wash hover:text-green"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const items = useNavItems();
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-raised/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-3xl">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] font-medium transition-colors ${
                  active ? "text-green" : "text-faint"
                }`}
              >
                {item.icon}
                <span className="latin">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
