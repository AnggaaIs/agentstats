import type { Metadata } from "next";
import Image from "next/image";

import { HorizontalScroller } from "@/components/horizontal-scroller";
import { REGIONS, type Region } from "@/lib/constants";
import { getMatch, getParticipantHeadshotRate } from "@/lib/riot";
import { getAgents, getMaps } from "@/lib/valorant-api";

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ region?: string }>;
}

function isRegion(value: string | undefined): value is Region {
  return REGIONS.some((region) => region === value);
}

export async function generateMetadata({
  params,
}: MatchPageProps): Promise<Metadata> {
  return { title: `Match ${(await params).matchId}` };
}

export default async function MatchPage({
  params,
  searchParams,
}: MatchPageProps) {
  const { matchId } = await params;
  const selectedRegion = (await searchParams).region;
  const region: Region = isRegion(selectedRegion) ? selectedRegion : "ap";
  const [match, agents, maps] = await Promise.all([
    getMatch(matchId, region),
    getAgents(),
    getMaps(),
  ]);
  const map = maps.find(
    (item) => item.mapUrl.toLowerCase() === match.matchInfo.mapId.toLowerCase(),
  );
  const teams = match.teams.toSorted((a, b) => Number(b.won) - Number(a.won));
  const players = match.players.toSorted(
    (a, b) => (b.stats?.score ?? 0) - (a.stats?.score ?? 0),
  );

  return (
    <article>
      <header className="relative isolate overflow-hidden border-b border-white/8">
        {map ? (
          <Image
            src={map.splash}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover opacity-25"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1016] via-[#0b1016]/85 to-[#0b1016]/55" />
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="eyebrow">{match.matchInfo.queueId || "Custom match"}</p>
          <h1 className="mt-5 font-display text-6xl font-black uppercase tracking-[-0.06em]">
            {map?.displayName ?? "Match details"}
          </h1>
          <p className="mt-6 font-display text-5xl font-black">
            {teams[0]?.roundsWon ?? 0}
            <span className="mx-4 text-[var(--muted)]">—</span>
            {teams[1]?.roundsWon ?? 0}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <p className="eyebrow">Full scoreboard</p>
        <HorizontalScroller
          ariaLabel="Match scoreboard table"
          className="mt-7 border border-white/8"
        >
          <table className="w-full min-w-[62rem] border-collapse text-left">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-[var(--muted)]">
              <tr>
                <th className="p-4">Player</th>
                <th className="p-4">Team</th>
                <th className="p-4">Score</th>
                <th className="p-4">K</th>
                <th className="p-4">D</th>
                <th className="p-4">A</th>
                <th className="p-4">HS</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const agent = agents.find(
                  (item) =>
                    item.uuid.toLowerCase() === player.characterId.toLowerCase(),
                );
                return (
                  <tr key={player.puuid} className="border-t border-white/8">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 bg-white/5">
                          {agent ? (
                            <Image
                              src={agent.displayIcon}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-black">{player.gameName}</p>
                          <p className="text-xs text-[var(--muted)]">
                            #{player.tagLine} · {agent?.displayName ?? "Unknown agent"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{player.teamId}</td>
                    <td className="p-4 font-black">
                      {player.stats?.roundsPlayed
                        ? Math.round(player.stats.score / player.stats.roundsPlayed)
                        : 0}
                    </td>
                    <td className="p-4">{player.stats?.kills ?? 0}</td>
                    <td className="p-4">{player.stats?.deaths ?? 0}</td>
                    <td className="p-4">{player.stats?.assists ?? 0}</td>
                    <td className="p-4">
                      {Math.round(
                        getParticipantHeadshotRate(match, player.puuid),
                      )}
                      %
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </HorizontalScroller>

        <section className="mt-16">
          <p className="eyebrow">Round timeline</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {match.roundResults.map((round) => (
              <div
                key={round.roundNum}
                className="min-w-24 border border-white/8 bg-[var(--panel)] p-3 transition hover:border-white/25"
              >
                <p className="font-mono text-xs text-[var(--muted)]">
                  R{round.roundNum + 1}
                </p>
                <p className="mt-1 text-sm font-black">{round.winningTeam}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {round.roundResult}
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </article>
  );
}
