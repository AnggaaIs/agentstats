import Image from "next/image";

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
      className="mt-7 grid border border-white/10 bg-[var(--panel)] lg:grid-cols-[minmax(0,1fr)_15rem]"
    >
      <div className="p-5 sm:p-6">
        <p className="eyebrow">Ladder composition</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="rank-distribution-heading"
              className="font-display text-2xl font-black uppercase tracking-[-0.045em] sm:text-3xl"
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

        {distribution.length ? (
          <div className="mt-6 space-y-4">
            {distribution.map((item) => (
            <div key={item.tier}>
              <div className="mb-2 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  {item.icon ? (
                    <Image
                      src={item.icon}
                      alt=""
                      width={28}
                      height={28}
                      className="size-7 shrink-0 object-contain"
                    />
                  ) : null}
                  <p className="responsive-text text-xs font-black uppercase tracking-[0.12em]">
                    {item.shortName}
                  </p>
                </div>
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
        ) : (
          <p className="mt-6 border border-white/10 p-4 text-sm leading-6 text-[var(--muted)]">
            Riot did not return tier boundaries for this leaderboard.
          </p>
        )}
      </div>

      <aside className="grid-noise border-t border-white/10 p-5 lg:border-l lg:border-t-0 lg:p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
          Tracked ladder
        </p>
        <p className="mt-2 font-display text-4xl font-black tracking-[-0.06em]">
          {numberFormatter.format(totalPlayers)}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Ranked players included in Riot&apos;s official leaderboard for this
          region and Act.
        </p>
        <div className="mt-5 border-l-2 border-[var(--accent)] pl-4">
          <p className="text-xs font-bold leading-5 text-white/75">
            This is the high-rank competitive ladder, so it covers Immortal and
            Radiant rather than every ranked player.
          </p>
        </div>
      </aside>
    </section>
  );
}
