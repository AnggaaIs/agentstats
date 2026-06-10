import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Pagination } from "@/components/pagination";
import { RouteLink } from "@/components/route-link";
import { buildPlayerSummary } from "@/lib/player-stats";
import {
  getLeaderboard,
  getRecentMatches,
  getRiotAccount,
  RiotApiError,
} from "@/lib/riot";
import { playerSearchSchema } from "@/lib/schemas";
import { createMetadata } from "@/lib/seo";
import {
  getAgents,
  getCurrentAct,
  getMaps,
} from "@/lib/valorant-api";

interface PlayerPageProps {
  params: Promise<{ region: string; name: string; tag: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { region, name, tag } = await params;
  const riotId = `${decodeURIComponent(name)}#${decodeURIComponent(tag)}`;
  return createMetadata({
    title: `${riotId} Valorant Profile`,
    description: `Private Valorant profile lookup for ${riotId}. Player data is shown only where Riot permits access.`,
    path: `/player/${region}/${name}/${tag}`,
    noIndex: true,
  });
}

function formatNumber(value: number, digits = 0): string {
  return value.toFixed(digits);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export default async function PlayerPage({
  params,
  searchParams,
}: PlayerPageProps) {
  const raw = await params;
  const result = playerSearchSchema.safeParse({
    name: decodeURIComponent(raw.name),
    tag: decodeURIComponent(raw.tag),
    region: raw.region,
  });

  if (!result.success) notFound();

  const { name, tag, region } = result.data;
  const requestedPage = Number((await searchParams).page ?? "1");
  let account;

  try {
    account = await getRiotAccount(name, tag, region);
  } catch (error) {
    if (error instanceof RiotApiError && error.status === 404) notFound();
    throw error;
  }

  const [agentsResult, mapsResult, matchesResult, actResult] =
    await Promise.allSettled([
      getAgents(),
      getMaps(),
      getRecentMatches(account.puuid, region, 20),
      getCurrentAct(),
    ]);

  const agents = agentsResult.status === "fulfilled" ? agentsResult.value : [];
  const maps = mapsResult.status === "fulfilled" ? mapsResult.value : [];
  const matches =
    matchesResult.status === "fulfilled" ? matchesResult.value : [];
  const matchError =
    matchesResult.status === "rejected" &&
    matchesResult.reason instanceof RiotApiError
      ? matchesResult.reason.message
      : matchesResult.status === "rejected"
        ? "Match history could not be opened."
        : "";
  const playerPermissionRequired =
    matchesResult.status === "rejected" &&
    matchesResult.reason instanceof RiotApiError &&
    matchesResult.reason.status === 403;
  const summary = buildPlayerSummary(account.puuid, matches, agents, maps);
  const matchesPerPage = 5;
  const totalMatchPages = Math.max(
    1,
    Math.ceil(summary.matches.length / matchesPerPage),
  );
  const matchPage = Math.min(
    totalMatchPages,
    Math.max(1, Number.isInteger(requestedPage) ? requestedPage : 1),
  );
  const visibleMatches = summary.matches.slice(
    (matchPage - 1) * matchesPerPage,
    matchPage * matchesPerPage,
  );

  let ladderPlayer = null;
  let currentActName = "";
  if (actResult.status === "fulfilled") {
    currentActName = actResult.value.displayLabel;
    try {
      const leaderboard = await getLeaderboard(region, actResult.value.uuid);
      ladderPlayer =
        leaderboard.players.find((player) => player.puuid === account.puuid) ??
        null;
    } catch {
      ladderPlayer = null;
    }
  }

  const metrics = [
    ["Win rate", `${formatNumber(summary.winRate)}%`],
    ["K / D", formatNumber(summary.kd, 2)],
    ["Average score", formatNumber(summary.averageAcs)],
    ["Headshots", `${formatNumber(summary.averageHeadshotRate)}%`],
    ["Damage / round", formatNumber(summary.averageDamagePerRound)],
  ] as const;

  return (
    <article>
      <header className="grid-noise border-b border-white/8">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Player profile / {region}</p>
              <h1 className="responsive-text mt-6 font-display text-[clamp(3rem,16vw,6rem)] font-black uppercase leading-[0.85] tracking-[-0.065em]">
                {account.gameName}
                <span className="text-[var(--accent)]">#{account.tagLine}</span>
              </h1>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="border border-white/12 px-4 py-2 text-xs font-black uppercase tracking-widest">
                  Region {region}
                </span>
                <span className="border border-white/12 px-4 py-2 text-xs font-black uppercase tracking-widest">
                  {playerPermissionRequired
                    ? "Visibility unconfirmed"
                    : `${summary.games} recent matches`}
                </span>
              </div>
            </div>
            <div className="w-full min-w-0 border border-white/10 bg-[var(--panel)] p-6 sm:w-auto sm:min-w-64">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--muted)]">
                {currentActName || "Current act"}
              </p>
              {ladderPlayer ? (
                <>
                  <p className="mt-2 font-display text-4xl font-black">
                    #{ladderPlayer.leaderboardRank}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {ladderPlayer.rankedRating} rating ·{" "}
                    {ladderPlayer.numberOfWins} wins
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Not listed in the regional top 200.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        {summary.games > 0 ? (
          <>
            <div className="grid border border-white/8 sm:grid-cols-2 lg:grid-cols-5">
              {metrics.map(([label, value]) => (
                <div
                  key={label}
                  className="border-b border-white/8 p-5 last:border-b-0 sm:border-r lg:border-b-0"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                    {label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="eyebrow">Recent form</p>
                    <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.05em]">
                      Match history
                    </h2>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {summary.wins}W · {summary.losses}L · {summary.draws}D
                  </p>
                </div>
                <div className="mt-6 grid gap-3">
                  {visibleMatches.map((match) => (
                    <RouteLink
                      key={match.matchId}
                      href={`/match/${match.matchId}?region=${region}`}
                      className="grid gap-4 border border-white/8 bg-[var(--panel)] p-5 transition hover:border-white/25 hover:bg-[var(--panel-raised)] sm:grid-cols-[4rem_1fr_auto]"
                    >
                      <div className="relative size-16 bg-white/5">
                        {match.agentIcon ? (
                          <Image
                            src={match.agentIcon}
                            alt={`${match.agentName} icon`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              match.result === "WIN"
                                ? "text-sm font-black text-emerald-400"
                                : match.result === "LOSS"
                                  ? "text-sm font-black text-[var(--accent)]"
                                  : "text-sm font-black text-amber-300"
                            }
                          >
                            {match.result}
                          </span>
                          <span className="responsive-text text-sm text-[var(--muted)]">
                            {match.mapName} · {match.queue}
                          </span>
                        </div>
                        <p className="mt-1 text-lg font-black">
                          {match.kills} / {match.deaths} / {match.assists}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {formatDate(match.playedAt)}
                        </p>
                      </div>
                      <div className="min-w-0 text-left sm:text-right">
                        <p className="font-display text-3xl font-black">{match.score}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {formatNumber(match.acs)} score ·{" "}
                          {formatNumber(match.headshotRate)}% HS
                        </p>
                      </div>
                    </RouteLink>
                  ))}
                </div>
                <Pagination
                  page={matchPage}
                  totalPages={totalMatchPages}
                  makeHref={(nextPage) =>
                    `/player/${region}/${encodeURIComponent(account.gameName)}/${encodeURIComponent(account.tagLine)}?page=${nextPage}`
                  }
                />
              </section>

              <aside className="grid content-start gap-6">
                <section className="border border-white/8 p-6">
                  <p className="eyebrow">Agent report</p>
                  <div className="mt-6 grid gap-3">
                    {summary.agents.slice(0, 5).map((agent) => (
                      <div
                        key={agent.name}
                        className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-white/8 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="relative size-12 bg-white/5">
                          {agent.icon ? (
                            <Image
                              src={agent.icon}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="responsive-text font-black">
                            {agent.name}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {agent.kills}/{agent.deaths}/{agent.assists}
                          </p>
                        </div>
                        <p className="font-mono text-sm">
                          {agent.wins}/{agent.games}W
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border border-white/8 p-6">
                  <p className="eyebrow">Map report</p>
                  <div className="mt-6 grid gap-4">
                    {summary.maps.map((map) => (
                      <div key={map.name}>
                        <div className="flex justify-between text-sm">
                          <span className="font-bold">{map.name}</span>
                          <span className="text-[var(--muted)]">
                            {formatNumber((map.wins / map.games) * 100)}%
                          </span>
                        </div>
                        <progress
                          max={100}
                          value={(map.wins / map.games) * 100}
                          aria-label={`${map.name} win rate`}
                          className="mt-2 h-2 w-full accent-[var(--accent)]"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : (
          <div className="border border-white/8 bg-[var(--panel)] p-8 sm:p-10">
            <p className="eyebrow">
              {playerPermissionRequired ? "Permission required" : "Player found"}
            </p>
            <h2 className="mt-5 font-display text-4xl font-black uppercase tracking-[-0.05em]">
              {playerPermissionRequired
                ? "Player data is private on AgentStats"
                : "Match history is unavailable"}
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-[var(--muted)]">
              {playerPermissionRequired
                ? "Riot requires players to connect their own account before a third-party service can display personal statistics. This Riot ID exists, but it has not been verified as public inside AgentStats."
                : matchError ||
                  "The player was found, but no recent matches are available."}
            </p>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
              {playerPermissionRequired
                ? "A public or private setting from another tracker does not apply here. Each tracker records the player's permission separately. Riot account linking will be offered after AgentStats receives production access."
                : "Match details will appear here when they become available. AgentStats will not invent missing results."}
            </p>
            <RouteLink
              href={`/leaderboard?region=${region}`}
              className="mt-8 inline-flex min-h-12 items-center bg-[var(--accent)] px-6 text-sm font-black uppercase tracking-widest"
            >
              Open leaderboard
            </RouteLink>
          </div>
        )}
      </section>
    </article>
  );
}
