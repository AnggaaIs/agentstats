import type { RankDistributionItem } from "@/lib/rank-distribution";

interface RankDistributionProps {
  distribution: RankDistributionItem[];
  totalPlayers: number;
  region: string;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function RankDistribution({
  distribution,
  totalPlayers,
  region,
}: RankDistributionProps) {
  const largestCount = Math.max(...distribution.map((item) => item.count), 1);

  return (
    <section
      aria-labelledby="rank-distribution-heading"
      className="mt-10 grid border border-white/10 bg-[var(--panel)] lg:grid-cols-[minmax(0,1fr)_17rem]"
    >
      <div className="p-6 sm:p-8">
        <p className="eyebrow">Ladder composition</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="rank-distribution-heading"
              className="font-display text-3xl font-black uppercase tracking-[-0.045em] sm:text-4xl"
            >
              Rank distribution
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Exact tier boundaries across the competitive leaderboard, not
              only the 200 rows shown below.
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-white/50">
            Region {region}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {distribution.map((item) => (
            <div key={item.tier}>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <p className="text-xs font-black uppercase tracking-[0.12em]">
                  {item.shortName}
                </p>
                <p className="font-mono text-xs text-[var(--muted)]">
                  {numberFormatter.format(item.count)} players ·{" "}
                  {item.percentage.toFixed(1)}%
                </p>
              </div>
              <div
                className="h-3 overflow-hidden bg-white/[0.06]"
                role="img"
                aria-label={`${item.name}: ${numberFormatter.format(item.count)} players, ${item.percentage.toFixed(1)} percent`}
              >
                <div
                  className="h-full min-w-1"
                  style={{
                    width: `${(item.count / largestCount) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="grid-noise border-t border-white/10 p-6 lg:border-l lg:border-t-0 lg:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
          Tracked ladder
        </p>
        <p className="mt-3 font-display text-5xl font-black tracking-[-0.06em]">
          {numberFormatter.format(totalPlayers)}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Ranked players included in Riot&apos;s official leaderboard for this
          region and Act.
        </p>
        <div className="mt-8 border-l-2 border-[var(--accent)] pl-4">
          <p className="text-xs font-bold leading-5 text-white/75">
            This is the high-rank competitive ladder, so it covers Immortal and
            Radiant rather than every ranked player.
          </p>
        </div>
      </aside>
    </section>
  );
}
