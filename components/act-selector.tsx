import { RouteSelect } from "@/components/route-select";
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
      <RouteSelect
        label="Competitive Act"
        selectedValue={selectedActId}
        className="max-w-xl"
        options={acts.map((act) => ({
          value: act.uuid,
          label: act.displayLabel,
          href: `/leaderboard?region=${region}&act=${act.uuid}&page=1`,
          note: act.isCurrent
            ? "Current"
            : (act.seasonDisplayName ?? undefined),
        }))}
      />
    </nav>
  );
}
