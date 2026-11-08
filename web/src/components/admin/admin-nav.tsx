"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Ringkasan", exact: true },
  { href: "/admin/orders", label: "Order" },
  { href: "/admin/codes", label: "Kode" },
  { href: "/admin/members", label: "Member" },
  { href: "/admin/classes", label: "Kelas" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi admin"
      className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-[6px] px-3 py-2 text-[14px] font-medium transition-colors duration-150 ease-out lg:border-l-2 ${
              active
                ? "bg-surface text-ink lg:border-accent"
                : "text-ink-2 hover:bg-surface hover:text-ink lg:border-transparent"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
