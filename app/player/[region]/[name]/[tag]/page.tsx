import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { Pagination } from "@/components/pagination";
import { RouteLink } from "@/components/route-link";
import { syncAgentMatchObservations } from "@/lib/agent-meta";
import { isRsoConfigured } from "@/lib/auth-config";
import { getPlayerAccess } from "@/lib/player-access";
import { buildPlayerSummary, type MatchSummary } from "@/lib/player-stats";
import { getCompetitiveTier } from "@/lib/rank-distribution";
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
  getCompetitiveTiers,
  getCurrentAct,
  getMaps,
  getPlayerCard,
  getWeapon,
} from "@/lib/valorant-api";

interface PlayerPageProps {
  params: Promise<{ region: string; name: string; tag: string }>;
  searchParams: Promise<{ page?: string; queue?: string }>;
}

const QUEUE_FILTERS = [
  ["all", "All modes"],
  ["competitive", "Competitive"],
  ["unrated", "Unrated"],
  ["swiftplay", "Swiftplay"],
  ["spikerush", "Spike Rush"],
  ["deathmatch", "Deathmatch"],
] as const;

function formatNumber(value: number, digits = 0): string {
  return value.toFixed(digits);
}

function formatSigned(value: number, digits = 0): string {
  const formatted = value.toFixed(digits);
  return value > 0 ? `+${formatted}` : formatted;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatPlaytime(milliseconds: number): string {
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function resultClass(result: MatchSummary["result"]): string {
  if (result === "WIN") return "border-emerald-400/45 text-emerald-300";
  if (result === "LOSS") return "border-[var(--accent)]/55 text-red-300";
  return "border-amber-300/45 text-amber-200";
}

function deltaClass(value: number | null): string {
  if (value === null || value === 0) return "text-[var(--muted)]";
  return value > 0 ? "text-emerald-300" : "text-red-300";
}

function PerformanceTrend({ matches }: { matches: MatchSummary[] }) {
  const ordered = matches.toReversed();
  const max = Math.max(1, ...ordered.map((match) => match.acs));
  const points = ordered
    .map((match, index) => {
      const x =
        ordered.length === 1 ? 50 : (index / (ordered.length - 1)) * 100;
      const y = 92 - (match.acs / max) * 78;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <figure className="border border-white/10 bg-[var(--panel)]">
      <figcaption className="flex flex-col gap-2 border-b border-white/8 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
            Recent performance
          </p>
          <h3 className="mt-1 font-display text-lg font-black uppercase">
            ACS trend
          </h3>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Oldest to newest · {ordered.length} matches
        </p>
      </figcaption>
      <div className="relative h-40 overflow-hidden p-4">
        <div className="absolute inset-4 grid grid-rows-4">
          {[0, 1, 2, 3].map((line) => (
            <span key={line} className="border-t border-white/7" />
          ))}
        </div>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Average combat score trend across ${ordered.length} recent matches`}
          className="relative h-full w-full overflow-visible"
        >
          <polyline
            points={points}
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-[var(--accent)] stroke-[2.5]"
          />
          {ordered.map((match, index) => {
            const x =
              ordered.length === 1
                ? 50
                : (index / (ordered.length - 1)) * 100;
            const y = 92 - (match.acs / max) * 78;
            return (
              <circle
                key={match.matchId}
                cx={x}
                cy={y}
                r="2"
                vectorEffect="non-scaling-stroke"
                className="fill-[var(--paper)] stroke-[var(--ink)] stroke-2"
              >
                <title>
                  {match.mapName}: {formatNumber(match.acs)} ACS
                </title>
              </circle>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { region, name, tag } = await params;
  const riotId = `${name}#${tag}`;
  return createMetadata({
    title: `${riotId} Valorant Profile`,
    description: `Opt-in Valorant match history and performance profile for ${riotId} on AgentStats.`,
    path: `/player/${encodeURIComponent(region)}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
    noIndex: true,
  });
}

export default async function PlayerPage({
  params,
  searchParams,
}: PlayerPageProps) {
  const raw = await params;
  const input = playerSearchSchema.safeParse({
    name: raw.name,
    tag: raw.tag,
    region: raw.region,
  });
  if (!input.success) notFound();

  const { name, tag, region } = input.data;
  let account;
  try {
    account = await getRiotAccount(name, tag, region);
  } catch (error) {
    if (error instanceof RiotApiError && error.status === 404) notFound();
    throw error;
  }

  const access = await getPlayerAccess(account.puuid);
  if (!access.canViewStats) {
    const authReady = isRsoConfigured();
    const title = access.isLinked
      ? "This profile is private"
      : "This player has not linked AgentStats";

    return (
      <article className="grid-noise">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:px-8 lg:py-12">
          <section className="border border-white/10 bg-black/10 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              Player profile / {region}
            </p>
            <h1 className="responsive-text mt-3 font-display text-[clamp(2rem,7vw,3.25rem)] font-black uppercase leading-[0.9] tracking-[-0.05em]">
              {account.gameName}
              <span className="ml-2 text-[0.55em] text-[var(--accent)]">
                #{account.tagLine}
              </span>
            </h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="border border-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                Region {region}
              </span>
              <span className="border border-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                Stats private
              </span>
            </div>
          </section>

          <section className="border border-white/12 bg-[var(--panel)] p-5 sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              Opt-in required
            </p>
            <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.04em]">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Riot requires each player to authorize access to personal match
              data. Finding a Riot ID does not grant AgentStats permission to
              publish that player&apos;s history or derived statistics.
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {access.isLinked
                ? "The owner has connected this account but chose private visibility."
                : authReady
                  ? "If this is your account, connect through Riot Sign On. Your profile starts private and you decide whether to publish it."
                  : "The RSO flow is prepared but remains unavailable until Riot approves the production application."}
            </p>
            <RouteLink
              href={authReady ? "/login" : "/privacy"}
              className="valorant-action mt-5 inline-flex min-h-11 items-center bg-[var(--accent)] px-5 text-xs font-black uppercase tracking-[0.13em]"
            >
              {authReady ? "Connect my Riot account" : "Read privacy details"}
            </RouteLink>
          </section>
        </div>
      </article>
    );
  }

  const requested = await searchParams;
  const selectedQueue = QUEUE_FILTERS.some(
    ([value]) => value === requested.queue,
  )
    ? requested.queue ?? "all"
    : "all";
  const requestedPage = Number(requested.page ?? "1");

  const [agentsResult, mapsResult, tiersResult, matchesResult, actResult] =
    await Promise.allSettled([
      getAgents(),
      getMaps(),
      getCompetitiveTiers(),
      getRecentMatches(account.puuid, region, 20),
      getCurrentAct(),
    ]);
  const agents = agentsResult.status === "fulfilled" ? agentsResult.value : [];
  const maps = mapsResult.status === "fulfilled" ? mapsResult.value : [];
  const tiers = tiersResult.status === "fulfilled" ? tiersResult.value : [];
  if (matchesResult.status === "rejected") throw matchesResult.reason;
  const matches = matchesResult.value;
  const initialSummary = buildPlayerSummary(
    account.puuid,
    matches,
    agents,
    maps,
  );
  const weaponResults = await Promise.allSettled(
    initialSummary.weapons
      .slice(0, 12)
      .map((weapon) => getWeapon(weapon.id)),
  );
  const weapons = weaponResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const summary = buildPlayerSummary(account.puuid, matches, agents, maps, weapons);
  if (
    access.hasCurrentDataConsent &&
    access.ownerId &&
    matches.length > 0
  ) {
    after(async () => {
      await syncAgentMatchObservations({
        sourceUserId: access.ownerId!,
        sourcePuuid: account.puuid,
        region,
        matches,
      });
    });
  }
  const topAgent = summary.agents[0]
    ? agents.find((agent) => agent.displayName === summary.agents[0]?.name)
    : null;
  const playerCard = summary.playerCardId
    ? await getPlayerCard(summary.playerCardId).catch(() => null)
    : null;
  const observedRank = getCompetitiveTier(
    summary.competitiveTier ?? 0,
    tiers,
  );
  const observedPeakTierNumber = Math.max(
    0,
    ...summary.matches.map((match) => match.competitiveTier ?? 0),
  );
  const observedPeakRank = getCompetitiveTier(observedPeakTierNumber, tiers);

  let ladderPlayer = null;
  let currentActName = "Current act";
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

  const filteredMatches =
    selectedQueue === "all"
      ? summary.matches
      : summary.matches.filter((match) => match.queueId === selectedQueue);
  const matchesPerPage = 6;
  const totalMatchPages = Math.max(
    1,
    Math.ceil(filteredMatches.length / matchesPerPage),
  );
  const matchPage = Math.min(
    totalMatchPages,
    Math.max(1, Number.isInteger(requestedPage) ? requestedPage : 1),
  );
  const visibleMatches = filteredMatches.slice(
    (matchPage - 1) * matchesPerPage,
    matchPage * matchesPerPage,
  );
  const profilePath = `/player/${region}/${encodeURIComponent(account.gameName)}/${encodeURIComponent(account.tagLine)}`;
  const metrics = [
    ["Damage / round", formatNumber(summary.averageDamagePerRound), "ADR"],
    ["K / D", formatNumber(summary.kd, 2), `${summary.kills} / ${summary.deaths}`],
    ["Headshot %", `${formatNumber(summary.averageHeadshotRate, 1)}%`, `${summary.hitDistribution.head} hits`],
    ["Win rate", `${formatNumber(summary.winRate, 1)}%`, `${summary.wins} wins`],
    ["KAST", `${formatNumber(summary.kast, 1)}%`, "Round impact"],
    [
      "DDΔ / round",
      formatSigned(summary.damageDeltaPerRound),
      "Damage dealt - received",
    ],
    ["Kills", String(summary.kills), `${formatNumber(summary.killsPerRound, 2)} / round`],
    ["Deaths", String(summary.deaths), `${formatNumber(summary.deathsPerRound, 2)} / round`],
    ["Assists", String(summary.assists), `${formatNumber(summary.assistsPerRound, 2)} / round`],
    ["Average ACS", formatNumber(summary.averageAcs, 1), `${summary.rounds} rounds`],
    ["KAD ratio", formatNumber(summary.kad, 2), "Kills + assists / deaths"],
    ["Round win", `${formatNumber(summary.roundWinRate, 1)}%`, `${summary.roundWins} rounds`],
  ] as const;
  const bestMap = summary.maps.toSorted((a, b) => b.winRate - a.winRate)[0];
  const focusMap = summary.maps
    .filter((map) => map.games >= 2)
    .toSorted((a, b) => a.winRate - b.winRate)[0];
  const mainAgent = summary.agents[0];
  const previousForm = summary.recentForm.previous;
  const recentFormMetrics = [
    {
      label: "Win rate",
      recent: `${formatNumber(summary.recentForm.recent.winRate)}%`,
      previous: previousForm
        ? `${formatNumber(previousForm.winRate)}%`
        : "—",
      delta: summary.recentForm.winRateDelta,
      deltaLabel:
        summary.recentForm.winRateDelta === null
          ? "Baseline"
          : `${formatSigned(summary.recentForm.winRateDelta)} pts`,
    },
    {
      label: "K / D",
      recent: formatNumber(summary.recentForm.recent.kd, 2),
      previous: previousForm ? formatNumber(previousForm.kd, 2) : "—",
      delta: summary.recentForm.kdDelta,
      deltaLabel:
        summary.recentForm.kdDelta === null
          ? "Baseline"
          : formatSigned(summary.recentForm.kdDelta, 2),
    },
    {
      label: "ACS",
      recent: formatNumber(summary.recentForm.recent.averageAcs),
      previous: previousForm
        ? formatNumber(previousForm.averageAcs)
        : "—",
      delta: summary.recentForm.acsDelta,
      deltaLabel:
        summary.recentForm.acsDelta === null
          ? "Baseline"
          : formatSigned(summary.recentForm.acsDelta),
    },
    {
      label: "ADR",
      recent: formatNumber(summary.recentForm.recent.averageDamagePerRound),
      previous: previousForm
        ? formatNumber(previousForm.averageDamagePerRound)
        : "—",
      delta: summary.recentForm.damageDelta,
      deltaLabel:
        summary.recentForm.damageDelta === null
          ? "Baseline"
          : formatSigned(summary.recentForm.damageDelta),
    },
  ] as const;
  const reviewCues = [
    {
      label: "Agent identity",
      value: mainAgent?.name ?? "No agent sample",
      note: mainAgent
        ? `${formatNumber((mainAgent.games / summary.games) * 100)}% of matches · ${formatNumber(mainAgent.winRate)}% WR`
        : "Play more matches to establish a pattern.",
    },
    {
      label: "Strongest map sample",
      value: bestMap?.name ?? "No map sample",
      note: bestMap
        ? `${formatNumber(bestMap.winRate)}% WR · ${bestMap.games} matches`
        : "No completed map sample.",
    },
    {
      label: "Review priority",
      value: focusMap?.name ?? "More data needed",
      note: focusMap
        ? `${formatNumber(focusMap.winRate)}% WR · review ${focusMap.games} recent matches`
        : "A map needs at least two matches before it is flagged.",
    },
    {
      label: "Opening impact",
      value: summary.openingDuels.total
        ? `${formatNumber(summary.openingDuels.winRate)}% success`
        : "No opening duels",
      note: `${summary.openingDuels.wins} first kills · ${summary.openingDuels.losses} first deaths`,
    },
  ] as const;

  return (
    <article>
      <header className="relative isolate overflow-hidden border-b border-white/8">
        {playerCard?.wideArt ? (
          <Image
            src={playerCard.wideArt}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-30 object-cover object-center opacity-35"
          />
        ) : topAgent?.fullPortrait ? (
          <Image
            src={topAgent.fullPortrait}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-30 object-cover object-[75%_18%] opacity-20"
          />
        ) : null}
        <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#090e14] via-[#090e14]/92 to-[#090e14]/45" />
        <div className="grid-noise absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-[86rem] gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-9">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              Verified Riot profile / {access.isPublic ? "public" : "private"}
            </p>
            <h1 className="responsive-text mt-3 font-display text-[clamp(2.25rem,7vw,4.25rem)] font-black uppercase leading-[0.9] tracking-[-0.055em]">
              {account.gameName}
              <span className="ml-2 text-[0.55em] tracking-[-0.03em] text-[var(--accent)]">
                #{account.tagLine}
              </span>
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                {region} region
              </span>
              {summary.accountLevel !== null ? (
                <span className="border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                  Level {summary.accountLevel}
                </span>
              ) : null}
              <span className="border border-white/15 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                {summary.games} matches sampled
              </span>
            </div>
          </div>

          <section className="min-w-56 border border-white/15 bg-[#0b1016]/80 p-4 backdrop-blur-md">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Latest observed rank
            </p>
            <div className="mt-2 flex items-center gap-3">
              {observedRank.icon ? (
                <Image
                  src={observedRank.icon}
                  alt={`${observedRank.name} rank`}
                  width={48}
                  height={48}
                  className="size-12 object-contain"
                />
              ) : null}
              <div>
                <p className="font-display text-xl font-black uppercase">
                  {summary.competitiveTier
                    ? observedRank.name
                    : "Unrated"}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {ladderPlayer
                    ? `#${ladderPlayer.leaderboardRank} · ${ladderPlayer.rankedRating} RR`
                    : "From the latest available match"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </header>

      <nav
        aria-label="Player profile sections"
        className="sticky top-14 z-30 border-b border-white/8 bg-[color:var(--ink)/.94] backdrop-blur-xl"
      >
        <div className="tactical-scrollbar mx-auto flex max-w-[86rem] overflow-x-auto px-4 sm:px-6 lg:px-8">
          {[
            ["#overview", "Overview"],
            ["#matches", "Matches"],
            ["#agents", "Agents"],
            ["#maps", "Maps"],
            ["#weapons", "Weapons"],
            ...(access.isOwner
              ? ([["#encounters", "Encounters"]] as const)
              : []),
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="valorant-action flex min-h-11 shrink-0 items-center border-x border-transparent px-4 text-[10px] font-black uppercase tracking-[0.13em] text-[var(--muted)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-[86rem] px-4 py-6 sm:px-6 lg:px-8">
        {summary.games === 0 ? (
          <section className="border border-white/10 bg-[var(--panel)] p-5 sm:p-6">
            <p className="eyebrow">No match sample</p>
            <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.05em]">
              Recent history is empty
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The account is authorized, but Riot did not return completed
              matches for this sample. AgentStats will not fill missing data
              with estimates.
            </p>
          </section>
        ) : (
          <>
            <div className="grid items-start gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
              <aside className="grid gap-4 xl:sticky xl:top-32">
                <section className="border border-white/10 bg-[var(--panel)]">
                  <div className="border-b border-white/8 p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                      Current rating
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      {observedRank.icon ? (
                        <Image
                          src={observedRank.icon}
                          alt=""
                          width={44}
                          height={44}
                          className="size-11 object-contain"
                        />
                      ) : null}
                      <div>
                        <p className="font-black">{observedRank.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {ladderPlayer
                            ? `${ladderPlayer.rankedRating} RR · #${ladderPlayer.leaderboardRank}`
                            : "Latest match observation"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-[10px]">
                      <span className="uppercase text-[var(--muted)]">
                        Peak observed
                      </span>
                      <span className="font-black">{observedPeakRank.name}</span>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-px bg-white/8">
                    {[
                      ["Record", `${summary.wins}W ${summary.losses}L`],
                      ["Playtime", formatPlaytime(summary.playtimeMillis)],
                      ["Rounds", String(summary.rounds)],
                      ["Sample", `${summary.games} matches`],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-[var(--panel)] p-3">
                        <dt className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
                          {label}
                        </dt>
                        <dd className="mt-1 text-sm font-black">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="border border-white/10 bg-[var(--panel)] p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-[0.13em]">
                      Hit distribution
                    </h2>
                    <span className="text-[10px] text-[var(--muted)]">
                      {summary.hitDistribution.total} hits
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {[
                      ["Head", summary.hitDistribution.headPercent, summary.hitDistribution.head],
                      ["Body", summary.hitDistribution.bodyPercent, summary.hitDistribution.body],
                      ["Leg", summary.hitDistribution.legPercent, summary.hitDistribution.leg],
                    ].map(([label, percent, count]) => (
                      <div key={String(label)}>
                        <div className="flex justify-between text-[10px]">
                          <span className="font-bold uppercase">{label}</span>
                          <span className="text-[var(--muted)]">
                            {formatNumber(Number(percent), 1)}% · {count}
                          </span>
                        </div>
                        <progress
                          max={100}
                          value={Number(percent)}
                          aria-label={`${label} hit percentage`}
                          className="community-progress mt-1.5 h-1.5 w-full"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border border-white/10 bg-[var(--panel)] p-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.13em]">
                    Queue split
                  </h2>
                  <div className="mt-3 grid gap-2">
                    {summary.queues.map((queue) => (
                      <div
                        key={queue.id}
                        className="flex items-center justify-between gap-3 border-t border-white/8 pt-2 text-xs"
                      >
                        <span className="responsive-text font-bold">{queue.name}</span>
                        <span className="shrink-0 text-[var(--muted)]">
                          {queue.games} · {formatNumber(queue.winRate)}% WR
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>

              <div className="min-w-0">
            <section id="overview" className="scroll-mt-32">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Competitive overview</p>
                  <h2 className="mt-1.5 font-display text-2xl font-black uppercase tracking-[-0.035em] sm:text-3xl">
                    {currentActName}
                  </h2>
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Derived from the latest {summary.games} accessible matches
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 border-l border-t border-white/10 md:grid-cols-3 lg:grid-cols-4">
                {metrics.map(([label, value, note]) => (
                  <div
                    key={label}
                    className="min-w-0 border-b border-r border-white/10 bg-[var(--panel)] p-3.5"
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[var(--muted)]">
                      {label}
                    </p>
                    <p className="responsive-text mt-1 font-display text-[clamp(1.35rem,3vw,1.8rem)] font-black">
                      {value}
                    </p>
                    <p className="responsive-text mt-0.5 text-[9px] text-white/45">
                      {note}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.38fr]">
                <PerformanceTrend matches={summary.matches} />
                <section className="border border-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                    Form line
                  </p>
                  <h3 className="mt-1 font-display text-lg font-black uppercase">
                    Last {Math.min(10, summary.matches.length)}
                  </h3>
                  <div className="mt-4 grid grid-cols-5 gap-1.5">
                    {summary.matches.slice(0, 10).map((match) => (
                      <span
                        key={match.matchId}
                        title={`${match.result} on ${match.mapName}`}
                        className={`grid aspect-square place-items-center border text-[10px] font-black ${resultClass(match.result)}`}
                      >
                        {match.result.at(0)}
                      </span>
                    ))}
                  </div>
                  <dl className="mt-4 grid gap-2.5 border-t border-white/8 pt-4 text-xs">
                    <div className="flex justify-between gap-4">
                      <dt className="text-sm text-[var(--muted)]">Record</dt>
                      <dd className="font-black">
                        {summary.wins}W {summary.losses}L {summary.draws}D
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-sm text-[var(--muted)]">Best agent</dt>
                      <dd className="responsive-text text-right font-black">
                        {summary.agents[0]?.name ?? "Unavailable"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-sm text-[var(--muted)]">Best map</dt>
                      <dd className="responsive-text text-right font-black">
                        {summary.maps.toSorted((a, b) => b.winRate - a.winRate)[0]
                          ?.name ?? "Unavailable"}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="border border-white/10 bg-[var(--panel)]">
                  <div className="flex flex-col gap-2 border-b border-white/8 p-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                        Form comparison
                      </p>
                      <h3 className="mt-1 font-display text-lg font-black uppercase">
                        Latest {summary.recentForm.recent.games} vs previous{" "}
                        {previousForm?.games ?? 0}
                      </h3>
                    </div>
                    <p className="text-[10px] text-[var(--muted)]">
                      {previousForm
                        ? "Direction, not a global rating"
                        : "Needs more than five matches"}
                    </p>
                  </div>
                  <div className="grid gap-px bg-white/8 sm:grid-cols-2">
                    {recentFormMetrics.map((metric) => (
                      <article
                        key={metric.label}
                        className="grid grid-cols-[1fr_auto] gap-4 bg-[var(--panel)] p-4"
                      >
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[var(--muted)]">
                            {metric.label}
                          </p>
                          <p className="mt-1 font-display text-2xl font-black">
                            {metric.recent}
                          </p>
                          <p className="mt-1 text-[9px] text-white/45">
                            Latest {summary.recentForm.recent.games} matches
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-mono text-xs font-black ${deltaClass(metric.delta)}`}
                          >
                            {metric.deltaLabel}
                          </p>
                          <p className="mt-2 text-[9px] uppercase tracking-wider text-[var(--muted)]">
                            Previous
                          </p>
                          <p className="mt-0.5 font-mono text-xs">
                            {metric.previous}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="border border-white/10 bg-[var(--panel)] p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                    Round impact
                  </p>
                  <h3 className="mt-1 font-display text-lg font-black uppercase">
                    Openings and trades
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-px bg-white/8">
                    <div className="bg-[var(--panel)] p-3">
                      <p className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
                        Opening success
                      </p>
                      <p className="mt-1 font-display text-2xl font-black">
                        {formatNumber(summary.openingDuels.winRate)}%
                      </p>
                      <p className="mt-1 text-[9px] text-white/45">
                        {summary.openingDuels.wins} won /{" "}
                        {summary.openingDuels.losses} lost
                      </p>
                    </div>
                    <div className="bg-[var(--panel)] p-3">
                      <p className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
                        Opening net
                      </p>
                      <p
                        className={`mt-1 font-display text-2xl font-black ${deltaClass(summary.openingDuels.net)}`}
                      >
                        {formatSigned(summary.openingDuels.net)}
                      </p>
                      <p className="mt-1 text-[9px] text-white/45">
                        First kills minus first deaths
                      </p>
                    </div>
                    <div className="col-span-2 bg-[var(--panel)] p-3">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
                            Deaths traded
                          </p>
                          <p className="mt-1 font-display text-2xl font-black">
                            {summary.trades.tradedDeaths}
                          </p>
                        </div>
                        <p className="font-mono text-sm font-black">
                          {formatNumber(summary.trades.tradeRate)}%
                        </p>
                      </div>
                      <progress
                        max={100}
                        value={summary.trades.tradeRate}
                        aria-label="Percentage of deaths traded within five seconds"
                        className="community-progress mt-3 h-1.5 w-full"
                      />
                      <p className="mt-2 text-[9px] leading-4 text-white/45">
                        {summary.trades.tradedDeaths} of{" "}
                        {summary.trades.trackedDeaths} timeline deaths were
                        answered by a teammate within five seconds.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <section className="mt-4 border border-white/10 bg-[var(--panel)]">
                <div className="flex flex-col gap-2 border-b border-white/8 p-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                      Result context
                    </p>
                    <h3 className="mt-1 font-display text-lg font-black uppercase">
                      Performance when winning and losing
                    </h3>
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">
                    Separates output from match outcome
                  </p>
                </div>
                <div className="grid gap-px bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.resultSplits.map((split) => (
                    <article
                      key={split.result}
                      className="bg-[var(--panel)] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`border px-2 py-1 text-[9px] font-black ${resultClass(split.result)}`}
                        >
                          {split.result}
                        </span>
                        <span className="text-[10px] text-[var(--muted)]">
                          {split.games} matches
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-3 gap-3">
                        {[
                          ["ACS", formatNumber(split.averageAcs)],
                          ["K/D", formatNumber(split.kd, 2)],
                          [
                            "ADR",
                            formatNumber(split.averageDamagePerRound),
                          ],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
                              {label}
                            </dt>
                            <dd className="mt-1 font-display text-xl font-black">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              </section>

              <div className="mt-4 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["First bloods", summary.firstBloods, `${summary.plants} plants`],
                  ["Flawless rounds", summary.flawlessRounds, `${summary.defuses} defuses`],
                  [
                    "Multi-kills",
                    summary.multiKills.doubles +
                      summary.multiKills.triples +
                      summary.multiKills.quads +
                      summary.multiKills.aces,
                    `${summary.multiKills.triples} triples · ${summary.multiKills.aces} aces`,
                  ],
                  [
                    "ACS deviation",
                    formatNumber(summary.consistency, 1),
                    "Lower is more consistent",
                  ],
                  [
                    "Avg loadout",
                    formatNumber(summary.averageLoadoutValue),
                    "Credits each round",
                  ],
                  [
                    "Avg spend",
                    formatNumber(summary.averageCreditsSpent),
                    "Credits each round",
                  ],
                  [
                    "Best ACS",
                    summary.bestMatch ? formatNumber(summary.bestMatch.acs) : "—",
                    summary.bestMatch?.mapName ?? "No match",
                  ],
                  [
                    "Best KDA",
                    summary.bestMatch
                      ? `${summary.bestMatch.kills}/${summary.bestMatch.deaths}/${summary.bestMatch.assists}`
                      : "—",
                    summary.bestMatch?.agentName ?? "No match",
                  ],
                ].map(([label, value, note]) => (
                  <div key={String(label)} className="bg-[var(--panel)] p-3.5">
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[var(--muted)]">
                      {label}
                    </p>
                    <p className="mt-1 font-display text-xl font-black">{value}</p>
                    <p className="mt-0.5 text-[9px] text-white/45">{note}</p>
                  </div>
                ))}
              </div>

              <section className="mt-4 border border-white/10 bg-[var(--panel)]">
                <div className="flex flex-col gap-2 border-b border-white/8 p-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                      Personal review cues
                    </p>
                    <h3 className="mt-1 font-display text-lg font-black uppercase">
                      What this sample says
                    </h3>
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">
                    No hidden score or global percentile
                  </p>
                </div>
                <div className="grid gap-px bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
                  {reviewCues.map((cue) => (
                    <article key={cue.label} className="bg-[var(--panel)] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[var(--muted)]">
                        {cue.label}
                      </p>
                      <p className="responsive-text mt-1.5 font-black">
                        {cue.value}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-white/45">
                        {cue.note}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            </section>

            <section id="matches" className="scroll-mt-32 pt-10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Match archive</p>
                  <h2 className="mt-1.5 font-display text-2xl font-black uppercase tracking-[-0.035em] sm:text-3xl">
                    Recent matches
                  </h2>
                </div>
                <div
                  role="group"
                  aria-label="Filter matches by mode"
                  className="tactical-scrollbar flex max-w-full overflow-x-auto border border-white/10"
                >
                  {QUEUE_FILTERS.map(([value, label]) => (
                    <RouteLink
                      key={value}
                      href={`${profilePath}?queue=${value}#matches`}
                      current={selectedQueue === value}
                      className="valorant-action flex min-h-11 shrink-0 items-center px-4 text-[10px] font-black uppercase tracking-[0.12em]"
                    >
                      {label}
                    </RouteLink>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {visibleMatches.length ? (
                  visibleMatches.map((match) => (
                    <RouteLink
                      key={match.matchId}
                      href={`/match/${match.matchId}?region=${region}`}
                      className="group grid min-w-0 gap-3 border border-white/9 bg-[var(--panel)] p-3 transition hover:border-white/30 sm:grid-cols-[3.5rem_1fr_auto] sm:items-center"
                    >
                      <div className="relative size-14 overflow-hidden bg-white/5">
                        {match.agentIcon ? (
                          <Image
                            src={match.agentIcon}
                            alt={`${match.agentName} icon`}
                            fill
                            sizes="56px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`border px-2 py-1 text-[10px] font-black ${resultClass(match.result)}`}
                          >
                            {match.result}
                          </span>
                          <span className="responsive-text font-black">
                            {match.mapName}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {match.queue}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-black">
                          {match.kills} / {match.deaths} / {match.assists}
                          <span className="ml-3 font-normal text-[var(--muted)]">
                            {formatNumber(match.acs)} ACS ·{" "}
                            {formatNumber(match.headshotRate)}% HS
                          </span>
                        </p>
                        <p className="mt-1 text-[11px] text-white/45">
                          {formatDate(match.playedAt)} ·{" "}
                          {formatNumber(match.damagePerRound)} ADR ·{" "}
                          {formatSigned(match.damageDelta)} DDΔ
                        </p>
                      </div>
                      <div className="flex items-end justify-between gap-5 border-t border-white/8 pt-4 sm:block sm:border-0 sm:pt-0 sm:text-right">
                        <p className="font-display text-2xl font-black">
                          {match.score}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {match.firstBloods} FB · {match.firstDeaths} FD
                        </p>
                      </div>
                    </RouteLink>
                  ))
                ) : (
                  <div className="border border-white/10 p-5 text-sm text-[var(--muted)]">
                    No matches in this mode are present in the current sample.
                  </div>
                )}
              </div>
              <Pagination
                page={matchPage}
                totalPages={totalMatchPages}
                makeHref={(page) =>
                  `${profilePath}?queue=${selectedQueue}&page=${page}#matches`
                }
              />
            </section>

            <section id="agents" className="scroll-mt-32 pt-10">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Agent report</p>
              <h2 className="mt-1.5 font-display text-2xl font-black uppercase tracking-[-0.035em] sm:text-3xl">
                Agent performance
              </h2>
              <div
                role="region"
                aria-label="Agent performance table"
                tabIndex={0}
                className="tactical-scrollbar mt-4 overflow-x-auto border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <table className="w-full min-w-[52rem] border-collapse text-left">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    <tr>
                      <th className="p-3">Agent</th>
                      <th className="p-3">Matches</th>
                      <th className="p-3">Win rate</th>
                      <th className="p-3">K / D</th>
                      <th className="p-3">ACS</th>
                      <th className="p-3">ADR</th>
                      <th className="p-3">DDΔ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.agents.map((agent) => (
                      <tr key={agent.name} className="border-t border-white/8">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative size-9 shrink-0 bg-white/5">
                              {agent.icon ? (
                                <Image
                                  src={agent.icon}
                                  alt=""
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <span className="font-black">{agent.name}</span>
                          </div>
                        </td>
                        <td className="p-3">{agent.games}</td>
                        <td className="p-3 font-black">
                          {formatNumber(agent.winRate)}%
                        </td>
                        <td className="p-3">{formatNumber(agent.kd, 2)}</td>
                        <td className="p-3">
                          {formatNumber(agent.averageAcs)}
                        </td>
                        <td className="p-3">
                          {formatNumber(agent.averageDamagePerRound)}
                        </td>
                        <td className="p-3">
                          {formatSigned(agent.damageDeltaPerRound)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="maps" className="scroll-mt-32 pt-10">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Map report</p>
              <h2 className="mt-1.5 font-display text-2xl font-black uppercase tracking-[-0.035em] sm:text-3xl">
                Battleground form
              </h2>
              <div className="mt-4 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
                {summary.maps.map((map) => (
                  <article key={map.name} className="bg-[var(--panel)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-lg font-black uppercase">
                          {map.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {map.games} matches · {map.wins}W {map.losses}L{" "}
                          {map.draws}D
                        </p>
                      </div>
                      <p className="font-display text-2xl font-black text-[var(--accent)]">
                        {formatNumber(map.winRate)}%
                      </p>
                    </div>
                    <progress
                      max={100}
                      value={map.winRate}
                      aria-label={`${map.name} win rate`}
                      className="community-progress mt-4 h-1.5 w-full"
                    />
                    <p className="mt-3 text-[10px] text-[var(--muted)]">
                      {formatNumber(map.averageAcs)} average ACS across{" "}
                      {map.rounds} rounds
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section id="weapons" className="scroll-mt-32 pt-10">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Finishing weapons</p>
              <h2 className="mt-1.5 font-display text-2xl font-black uppercase tracking-[-0.035em] sm:text-3xl">
                Confirmed kill tools
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--muted)]">
                Riot match data identifies the finishing item for kills. These
                totals do not claim shots fired or per-weapon accuracy, because
                those values are not present in the official match payload.
              </p>
              <div className="mt-4 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
                {summary.weapons.slice(0, 9).map((weapon, index) => (
                  <article
                    key={weapon.id}
                    className="grid min-h-32 grid-cols-[1fr_auto] gap-3 bg-[var(--panel)] p-4"
                  >
                    <div>
                      <p className="font-mono text-xs text-white/35">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className="responsive-text mt-1.5 font-display text-lg font-black uppercase">
                        {weapon.name}
                      </h3>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {weapon.kills} kills in {weapon.matches} matches
                      </p>
                      <p className="mt-2 font-display text-2xl font-black text-[var(--accent)]">
                        {formatNumber(weapon.killsPerMatch, 1)}
                        <span className="ml-2 text-xs uppercase text-[var(--muted)]">
                          K / match
                        </span>
                      </p>
                    </div>
                    {weapon.icon ? (
                      <div className="relative h-16 w-24 self-center">
                        <Image
                          src={weapon.icon}
                          alt={`${weapon.name} weapon`}
                          fill
                          sizes="96px"
                          className="object-contain"
                        />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            {access.isOwner ? (
              <section id="encounters" className="scroll-mt-32 py-10">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                  Recurring players
                </p>
                <h2 className="mt-1.5 font-display text-2xl font-black uppercase tracking-[-0.035em] sm:text-3xl">
                  Encounters
                </h2>
                <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--muted)]">
                  Players appearing repeatedly in this match sample.
                </p>
                <div
                  role="region"
                  aria-label="Recurring player encounters"
                  tabIndex={0}
                  className="tactical-scrollbar mt-4 overflow-x-auto border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <table className="w-full min-w-[48rem] border-collapse text-left text-xs">
                    <thead className="bg-white/5 text-[9px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      <tr>
                        <th className="p-3">Player</th>
                        <th className="p-3">With</th>
                        <th className="p-3">Against</th>
                        <th className="p-3">Wins together</th>
                        <th className="p-3">Losses against</th>
                        <th className="p-3">Duel K / D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.encounters.map((encounter) => (
                        <tr
                          key={encounter.puuid}
                          className="border-t border-white/8"
                        >
                          <td className="p-3">
                            <RouteLink
                              href={`/player/${region}/${encodeURIComponent(encounter.gameName)}/${encodeURIComponent(encounter.tagLine)}`}
                              className="font-black hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                            >
                              {encounter.gameName}
                              <span className="text-[var(--muted)]">
                                #{encounter.tagLine}
                              </span>
                            </RouteLink>
                          </td>
                          <td className="p-3">{encounter.teammateMatches}</td>
                          <td className="p-3">{encounter.opponentMatches}</td>
                          <td className="p-3">{encounter.winsWith}</td>
                          <td className="p-3">{encounter.lossesAgainst}</td>
                          <td className="p-3 font-black">
                            {encounter.kills} / {encounter.deaths}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
