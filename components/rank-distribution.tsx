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
  return (
    <section
      aria-labelledby="rank-distribution-heading"
      className="min-w-0 max-w-full overflow-hidden border border-white/10 bg-[var(--panel)]"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Ladder composition</p>
            <h2
              id="rank-distribution-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[-0.04em] sm:text-2xl"
            >
              Rank distribution
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)] sm:text-sm">
              Exact Immortal and Radiant ladder boundaries for this Act.
            </p>
          </div>
          <div className="grid gap-1 text-left sm:text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/50">
              Region {region}
            </p>
            <p className="font-mono text-sm text-white/80">
              {numberFormatter.format(totalPlayers)} tracked
            </p>
          </div>
        </div>

        {distribution.length ? (
          <div className="mt-4">
            <div
              className="flex h-4 overflow-hidden bg-white/[0.06]"
              role="img"
              aria-label="Leaderboard rank distribution"
            >
              {distribution.map((item) => (
                <div
                  key={item.tier}
                  className="h-full min-w-1"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                  aria-label={`${item.name}: ${numberFormatter.format(item.count)} players, ${item.percentage.toFixed(1)} percent`}
                  title={`${item.name}: ${numberFormatter.format(item.count)} players`}
                />
              ))}
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
              {distribution.map((item) => (
                <div
                  key={item.tier}
                  className="grid min-w-0 grid-cols-1 gap-2 border border-white/8 bg-black/10 px-3 py-2.5 min-[420px]:grid-cols-[minmax(0,1fr)_minmax(5.75rem,auto)] min-[420px]:items-center 2xl:grid-cols-1 2xl:items-start"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-3 shrink-0"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    {item.icon ? (
                      <Image
                        src={item.icon}
                        alt=""
                        width={22}
                        height={22}
                        className="size-5 shrink-0 object-contain"
                      />
                    ) : null}
                    <p className="min-w-0 whitespace-nowrap text-[10px] font-black leading-none uppercase tracking-[0.08em] min-[420px]:text-[11px]">
                      {item.shortName}
                    </p>
                  </div>
                  <p className="whitespace-nowrap pl-10 text-left font-mono text-[10px] leading-none text-[var(--muted)] min-[420px]:pl-0 min-[420px]:text-right min-[420px]:text-[11px] 2xl:pl-10 2xl:text-left">
                    {numberFormatter.format(item.count)} · {item.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 border border-white/10 p-4 text-sm leading-6 text-[var(--muted)]">
            Riot did not return tier boundaries for this leaderboard.
          </p>
        )}
      </div>
    </section>
  );
}
