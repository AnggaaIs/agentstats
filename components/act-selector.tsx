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
    <nav aria-label="Leaderboard act" className="mt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
            Competitive archive
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Choose an Act to inspect its competitive ladder.
          </p>
        </div>
        <span className="hidden font-mono text-xs text-white/40 sm:block">
          {acts.length} acts
        </span>
      </div>
      <div
        role="region"
        aria-label="Competitive Acts"
        tabIndex={0}
        className="tactical-scrollbar flex snap-x gap-2 overflow-x-auto pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {acts.map((act) => (
          <RouteLink
            key={act.uuid}
            href={`/leaderboard?region=${region}&act=${act.uuid}&page=1`}
            current={act.uuid === selectedActId}
            className="valorant-action grid min-h-16 min-w-44 snap-start grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-white/12 px-4 py-3"
          >
            <span className="min-w-0">
              <span className="block text-[9px] font-black uppercase leading-4 tracking-[0.14em] text-current opacity-65">
                {act.seasonDisplayName ?? "Competitive"}
              </span>
              {act.isCurrent ? (
                <span className="mt-0.5 block text-[9px] font-black uppercase tracking-[0.14em] text-current opacity-65">
                  Current
                </span>
              ) : null}
            </span>
            <span className="flex items-center gap-3">
              <span aria-hidden="true" className="text-xl text-white/25">
                /
              </span>
              <span className="font-display text-lg font-black uppercase leading-none">
                {act.displayName}
              </span>
            </span>
          </RouteLink>
        ))}
      </div>
    </nav>
  );
}
