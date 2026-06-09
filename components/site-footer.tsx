import { APP_NAME } from "@/lib/constants";
import { LEGAL_LINKS } from "@/lib/legal";

import { RouteLink } from "@/components/route-link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-xs text-[var(--muted)] lg:grid-cols-[1fr_auto] lg:px-8">
        <div className="max-w-2xl leading-6">
          <p className="font-bold text-white">{APP_NAME}</p>
          <p className="mt-2">
            An independent project created under Riot Games&apos; Legal Jibber
            Jabber policy using assets owned by Riot Games. Not endorsed by
            Riot Games.
          </p>
        </div>

        <nav
          aria-label="Legal"
          className="flex max-w-xl flex-wrap gap-x-5 gap-y-3 lg:justify-end"
        >
          {LEGAL_LINKS.map((item) => (
            <RouteLink
              key={item.href}
              href={item.href}
              className="font-bold transition hover:text-white"
            >
              {item.label}
            </RouteLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}
