import type { Metadata } from "next";
import Image from "next/image";
import { Pagination } from "@/components/pagination";
import { RankDistribution } from "@/components/rank-distribution";
import { RouteLink } from "@/components/route-link";
import { RouteSelect } from "@/components/route-select";
import { REGIONS, type Region } from "@/lib/constants";
import {
  buildRankDistribution,
  getCompetitiveTier,
} from "@/lib/rank-distribution";
import { getLeaderboard } from "@/lib/riot";
import { createMetadata } from "@/lib/seo";
import {
  getCompetitiveActs,
  getCompetitiveTiers,
} from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Valorant Ranked Leaderboard",
  description:
    "Browse the official Valorant ranked leaderboard by region and Act, including competitive tier icons, rating, wins, and rank distribution.",
  path: "/leaderboard",
});

interface LeaderboardPageProps {
  searchParams: Promise<{ region?: string; act?: string; page?: string }>;
}

function isRegion(value: string | undefined): value is Region {
  return REGIONS.some((region) => region === value);
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const query = await searchParams;
  const selected = query.region;
  const region: Region = isRegion(selected) ? selected : "ap";
  const requestedPage = Number(query.page ?? "1");
  const [acts, competitiveTiers] = await Promise.all([
    getCompetitiveActs(),
    getCompetitiveTiers(),
  ]);
  const visibleActs = acts.slice(0, 12);
  const currentAct = acts.find((item) => item.isCurrent);
  const requestedAct = acts.find((item) => item.uuid === query.act);
  const act = requestedAct ?? currentAct;

  if (!act) {
    throw new Error("The competitive Act list is unavailable.");
  }

  const leaderboard = await getLeaderboard(region, act.uuid);
  const distribution = buildRankDistribution(leaderboard, competitiveTiers);
  const perPage = 25;
  const totalPages = Math.max(
    1,
    Math.ceil(leaderboard.players.length / perPage),
  );
  const page = Math.min(
    totalPages,
    Math.max(1, Number.isInteger(requestedPage) ? requestedPage : 1),
  );
  const players = leaderboard.players.slice(
    (page - 1) * perPage,
    page * perPage,
  );
  const averageRating =
    leaderboard.players.length > 0
      ? leaderboard.players.reduce(
          (total, player) => total + player.rankedRating,
          0,
        ) / leaderboard.players.length
      : 0;
  const averageWins =
    leaderboard.players.length > 0
      ? leaderboard.players.reduce(
          (total, player) => total + player.numberOfWins,
          0,
        ) / leaderboard.players.length
      : 0;
  const topRating = Math.max(
    0,
    ...leaderboard.players.map((player) => player.rankedRating),
  );
  const leaderboardStats = [
    ["Visible", String(leaderboard.players.length)],
    ["Top RR", String(topRating)],
    ["Avg RR", averageRating.toFixed(0)],
    ["Avg Wins", averageWins.toFixed(1)],
    ["Radiant Cutoff", String(leaderboard.topTierRRThreshold)],
  ] as const;

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="border border-white/10 bg-[var(--panel)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">{act.displayLabel} / {region}</p>
            <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] font-black uppercase leading-[0.92] tracking-[-0.05em]">
              Leaderboard
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Official competitive ladder snapshot with Immortal and Radiant breakdown.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-3 xl:min-w-[32rem] xl:grid-cols-5">
            {leaderboardStats.map(([label, value]) => (
              <article
                key={label}
                className="bg-[var(--panel)] px-3 py-3 last:col-span-2 sm:last:col-span-1"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-1 font-display text-2xl font-black tracking-[-0.05em]">
                  {value}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem] xl:items-start">
          <div className="min-w-0">
            <RouteSelect
              label="Competitive Act"
              selectedValue={act.uuid}
              className="mb-3 sm:max-w-[30rem]"
              options={visibleActs.map((item) => ({
                value: item.uuid,
                label: item.displayLabel,
                href: `/leaderboard?region=${region}&act=${item.uuid}&page=1`,
                note: item.isCurrent ? "Current" : undefined,
              }))}
            />
            <RankDistribution
              distribution={distribution}
              totalPlayers={leaderboard.totalPlayers}
              region={region}
            />
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Leaderboard region">
            {REGIONS.map((item) => (
              <RouteLink
                key={item}
                href={`/leaderboard?region=${item}&act=${act.uuid}&page=1`}
                current={item === region}
                className={`valorant-action inline-flex min-h-11 min-w-16 items-center justify-center border px-4 text-center text-[11px] font-black leading-none uppercase tracking-widest ${
                  item === region
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                {item}
              </RouteLink>
            ))}
          </nav>
        </div>
      </div>
      <div
        role="region"
        aria-label="Competitive leaderboard table"
        tabIndex={0}
        className="tactical-scrollbar mt-4 overflow-x-auto border border-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <table className="w-full min-w-[48rem] border-collapse text-left">
          <thead className="bg-white/5 text-xs uppercase tracking-widest text-[var(--muted)]">
            <tr>
              <th className="p-5">Rank</th>
              <th className="p-5">Player</th>
              <th className="p-5">Rating</th>
              <th className="p-5">Wins</th>
              <th className="p-5">Tier</th>
            </tr>
          </thead>
          <tbody>
            {players.length ? players.map((player) => {
              const tier = getCompetitiveTier(
                player.competitiveTier,
                competitiveTiers,
              );

              return (
                <tr
                  key={`${player.leaderboardRank}:${player.puuid}`}
                  className="group border-t border-white/8 transition hover:bg-[var(--accent)]/10"
                >
                <td className="p-5 font-mono text-[var(--accent)]">
                  {String(player.leaderboardRank).padStart(3, "0")}
                </td>
                <td className="p-5">
                  {player.gameName && player.tagLine ? (
                    <RouteLink
                      href={`/player/${region}/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`}
                      className="font-black transition group-hover:text-white"
                    >
                      {player.gameName}
                      <span className="text-[var(--muted)]">#{player.tagLine}</span>
                    </RouteLink>
                  ) : (
                    <span className="text-[var(--muted)]">Anonymous player</span>
                  )}
                </td>
                <td className="p-5 text-lg font-black">{player.rankedRating}</td>
                <td className="p-5">{player.numberOfWins}</td>
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    {tier.icon ? (
                      <Image
                        src={tier.icon}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 shrink-0 object-contain"
                      />
                    ) : null}
                    <span className="font-mono text-sm">{tier.name}</span>
                  </div>
                </td>
              </tr>
              );
            }) : (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-sm text-[var(--muted)]"
                >
                  Riot returned no ranked players for this region and Act.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        makeHref={(nextPage) =>
          `/leaderboard?region=${region}&act=${act.uuid}&page=${nextPage}`
        }
      />
    </section>
  );
}
