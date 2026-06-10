import { HorizontalScroller } from "@/components/horizontal-scroller";
import { RouteLink } from "@/components/route-link";
import type { Region } from "@/lib/constants";
import type { CompetitiveAct } from "@/lib/valorant-api";

interface ActSelectorProps {
  acts: CompetitiveAct[];
  selectedActId: string;
  region: Region;
}

export function ActSelector({
  acts,
  selectedActId,
  region,
}: ActSelectorProps) {
  return (
    <nav aria-label="Leaderboard act" className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
            Competitive archive
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Choose an Act to inspect its competitive ladder.
          </p>
        </div>
        <span className="hidden font-mono text-xs text-white/40 sm:block">
          {acts.length} acts
        </span>
      </div>
      <HorizontalScroller
        ariaLabel="Competitive Acts"
        viewportClassName="flex snap-x gap-2"
      >
        {acts.map((act) => (
          <RouteLink
            key={act.uuid}
            href={`/leaderboard?region=${region}&act=${act.uuid}&page=1`}
            current={act.uuid === selectedActId}
            className="valorant-action min-h-16 min-w-40 snap-start border border-white/12 px-4 py-3"
          >
            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-current opacity-65">
              {act.seasonDisplayName ?? "Competitive"}
              {act.isCurrent ? " / Current" : ""}
            </span>
            <span className="mt-1 block font-display text-xl font-black uppercase">
              {act.displayName}
            </span>
          </RouteLink>
        ))}
      </HorizontalScroller>
    </nav>
  );
}
