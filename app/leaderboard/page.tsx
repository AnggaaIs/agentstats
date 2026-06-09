import type { Metadata } from "next";
import { Pagination } from "@/components/pagination";
import { PageHeading } from "@/components/page-heading";
import { RouteLink } from "@/components/route-link";
import { REGIONS, type Region } from "@/lib/constants";
import { getLeaderboard } from "@/lib/riot";
import { getCurrentAct } from "@/lib/valorant-api";

export const metadata: Metadata = {
  title: "Leaderboard",
};

interface LeaderboardPageProps {
  searchParams: Promise<{ region?: string; page?: string }>;
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
  const act = await getCurrentAct();
  const leaderboard = await getLeaderboard(region, act.uuid);
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
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <PageHeading
        eyebrow={`${act.displayName} / ${region}`}
        title="Leaderboard"
        description="The top 200 players in each region, ordered by competitive rating."
      />
      <nav className="mt-12 flex flex-wrap gap-2" aria-label="Leaderboard region">
        {REGIONS.map((item) => (
          <RouteLink
            key={item}
            href={`/leaderboard?region=${item}&page=1`}
            current={item === region}
            className={
              item === region
                ? "min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-xs font-black uppercase tracking-widest"
                : "valorant-action min-h-11 border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-widest hover:border-white/30"
            }
          >
            {item}
          </RouteLink>
        ))}
      </nav>
      <div className="mt-6 overflow-x-auto border border-white/8">
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
            {players.map((player) => (
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
                <td className="p-5 font-mono text-sm">{player.competitiveTier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        makeHref={(nextPage) =>
          `/leaderboard?region=${region}&page=${nextPage}`
        }
      />
    </section>
  );
}
