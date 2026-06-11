import type { Metadata } from "next";
import Image from "next/image";
import { ActSelector } from "@/components/act-selector";
import { Pagination } from "@/components/pagination";
import { PageHeading } from "@/components/page-heading";
import { RankDistribution } from "@/components/rank-distribution";
import { RouteLink } from "@/components/route-link";
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
  const totalPages = Math.ceil(leaderboard.players.length / perPage);
  const page = Math.min(
    totalPages,
    Math.max(1, Number.isInteger(requestedPage) ? requestedPage : 1),
  );
  const players = leaderboard.players.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading
        eyebrow={`${act.displayLabel} / ${region}`}
        title="Leaderboard"
        description="Explore the official competitive ladder by region and Act, with exact Immortal and Radiant distribution."
      />
      <ActSelector
        acts={visibleActs}
        selectedActId={act.uuid}
        region={region}
      />
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Leaderboard region">
        {REGIONS.map((item) => (
          <RouteLink
            key={item}
            href={`/leaderboard?region=${item}&act=${act.uuid}&page=1`}
            current={item === region}
            className={
              item === region
                ? "min-h-10 border border-[var(--accent)] bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-widest"
                : "valorant-action min-h-10 border border-white/10 px-4 text-[11px] font-black uppercase tracking-widest hover:border-white/30"
            }
          >
            {item}
          </RouteLink>
        ))}
      </nav>
      <RankDistribution
        distribution={distribution}
        totalPlayers={leaderboard.totalPlayers}
        region={region}
      />
      <div
        role="region"
        aria-label="Competitive leaderboard table"
        tabIndex={0}
        className="tactical-scrollbar mt-6 overflow-x-auto border border-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
            {players.map((player) => {
              const tier = getCompetitiveTier(
                player.competitiveTier,
                competitiveTiers,
              );

              return (
                <tr
                  key={player.puuid}
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
            })}
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
