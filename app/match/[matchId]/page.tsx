import type { Metadata } from "next";
import Image from "next/image";

import { REGIONS, type Region } from "@/lib/constants";
import {
  formatQueueName,
  getEventAt,
  resolveGameMode,
} from "@/lib/match-context";
import { getMatch, getParticipantHeadshotRate } from "@/lib/riot";
import {
  getAgents,
  getEvents,
  getGameModes,
  getMaps,
} from "@/lib/valorant-api";
import { createMetadata } from "@/lib/seo";

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ region?: string }>;
}

function isRegion(value: string | undefined): value is Region {
  return REGIONS.some((region) => region === value);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatDuration(milliseconds: number): string {
  const minutes = Math.max(0, Math.round(milliseconds / 60_000));
  return `${minutes} min`;
}

export async function generateMetadata({
  params,
}: MatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  return createMetadata({
    title: "Valorant Match Details",
    description:
      "Private Valorant match scoreboard, player performance, map, game mode, duration, and event context.",
    path: `/match/${matchId}`,
    noIndex: true,
  });
}

export default async function MatchPage({
  params,
  searchParams,
}: MatchPageProps) {
  const { matchId } = await params;
  const selectedRegion = (await searchParams).region;
  const region: Region = isRegion(selectedRegion) ? selectedRegion : "ap";
  const [match, agents, maps, gameModes, events] = await Promise.all([
    getMatch(matchId, region),
    getAgents(),
    getMaps(),
    getGameModes(),
    getEvents(),
  ]);
  const agentById = new Map(
    agents.map((agent) => [agent.uuid.toLowerCase(), agent]),
  );
  const map = maps.find(
    (item) => item.mapUrl.toLowerCase() === match.matchInfo.mapId.toLowerCase(),
  );
  const queueName = formatQueueName(match.matchInfo.queueId);
  const gameMode = resolveGameMode(
    gameModes,
    match.matchInfo.queueId,
    match.matchInfo.gameMode,
  );
  const event = getEventAt(events, match.matchInfo.gameStartMillis);
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
          <p className="eyebrow">{queueName}</p>
          <h1 className="responsive-text mt-5 font-display text-[clamp(3rem,14vw,6rem)] font-black uppercase leading-[0.9] tracking-[-0.06em]">
            {map?.displayName ?? "Match details"}
          </h1>
          <p className="mt-6 font-display text-5xl font-black">
            {teams[0]?.roundsWon ?? 0}
            <span className="mx-4 text-[var(--muted)]">—</span>
            {teams[1]?.roundsWon ?? 0}
          </p>
          <div className="mt-9 grid max-w-4xl border border-white/10 bg-[#0b1016]/55 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex min-w-0 items-center gap-3 border-b border-white/10 p-4 sm:border-r lg:border-b-0">
              {gameMode?.displayIcon ? (
                <Image
                  src={gameMode.displayIcon}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 object-contain"
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  Game mode
                </p>
                <p className="responsive-text mt-1 text-sm font-black uppercase">
                  {gameMode?.displayName ?? queueName}
                </p>
              </div>
            </div>
            <div className="min-w-0 border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                Played
              </p>
              <p className="responsive-text mt-1 text-sm font-black">
                {formatDate(match.matchInfo.gameStartMillis)}
              </p>
            </div>
            <div className="min-w-0 border-b border-white/10 p-4 sm:border-b-0 sm:border-r">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                Duration
              </p>
              <p className="mt-1 text-sm font-black">
                {formatDuration(match.matchInfo.gameLengthMillis)}
              </p>
              {gameMode?.duration ? (
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/45">
                  Typical {gameMode.duration}
                </p>
              ) : null}
            </div>
            <div className="min-w-0 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                Event window
              </p>
              <p className="responsive-text mt-1 text-sm font-black uppercase">
                {event?.shortDisplayName || event?.displayName || "Standard season"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <p className="eyebrow">Full scoreboard</p>
        <div
          role="region"
          aria-label="Match scoreboard table"
          tabIndex={0}
          className="tactical-scrollbar mt-7 overflow-x-auto border border-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
                const agent = agentById.get(player.characterId.toLowerCase());
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
        </div>

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
