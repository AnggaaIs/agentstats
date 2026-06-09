"use client";

import { usePathname } from "next/navigation";

import { RouteLink } from "@/components/route-link";
import { LEGAL_LINKS } from "@/lib/legal";

export function LegalNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Legal pages"
      className="mt-5 grid grid-cols-2 border-l border-t border-white/10 sm:grid-cols-3 lg:grid-cols-1"
    >
      {LEGAL_LINKS.map((item) => {
        const current = pathname === item.href;

        return (
          <RouteLink
            key={item.href}
            href={item.href}
            current={current}
            className="valorant-action flex min-h-12 items-center border-b border-r border-white/10 px-4 text-xs font-black uppercase tracking-[0.08em] text-[var(--muted)] hover:text-white lg:min-h-14"
          >
            <span
              aria-hidden="true"
              className={`mr-3 h-1.5 w-1.5 shrink-0 ${
                current ? "bg-white" : "bg-white/20"
              }`}
            />
            {item.label}
          </RouteLink>
        );
      })}
    </nav>
  );
}
