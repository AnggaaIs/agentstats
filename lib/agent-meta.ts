import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";
import {
  MatchResult,
  ObservationScope,
} from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Region } from "@/lib/constants";
import { PLAYER_DATA_CONSENT_VERSION } from "@/lib/legal";
import { formatQueueName } from "@/lib/match-context";
import type { RiotMatch } from "@/lib/riot";
import type { Agent, ValorantMap } from "@/lib/valorant-api";

export interface AgentMetaRow {
  agentId: string;
  name: string;
  icon: string;
  role: string;
  roleIcon: string | null;
  picks: number;
  pickRate: number;
  wins: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  averageAcs: number;
  averageDamagePerRound: number;
  damageDeltaPerRound: number;
  headshotRate: number;
  kast: number;
  firstBloodsPerMatch: number;
  rounds: number;
}

export interface AgentMetaDataset {
  rows: AgentMetaRow[];
  totalPicks: number;
  totalMatches: number;
  trackedPlayers: number;
  lastObservedAt: Date | null;
}

export interface AgentMetaFilters {
  queueId?: string;
  rankBucket?: AgentRankBucketId;
}

export interface AgentRankBucket {
  id: AgentRankBucketId;
  label: string;
  tiers: readonly number[];
}

export type AgentRankBucketId =
  | "all"
  | "unranked"
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "ascendant"
  | "immortal"
  | "radiant";

export interface AgentRankMetaRow {
  bucketId: AgentRankBucketId;
  label: string;
  samplePicks: number;
  leaders: Array<{
    agentId: string;
    name: string;
    icon: string | null;
    picks: number;
    pickRate: number;
    wins: number;
    winRate: number;
  }>;
}

export interface PlayerAgentBenchmark {
  eligible: boolean;
  rankBucketId: AgentRankBucketId;
  rankBucketLabel: string;
  sampleMatches: number;
  trackedPlayers: number;
  minimumMatches: number;
  minimumPlayers: number;
  averageAcs: number;
  averageDamagePerRound: number;
  damageDeltaPerRound: number;
  kd: number;
  kast: number;
}

export interface MapMetaRow {
  mapId: string;
  name: string;
  image: string;
  modeId: string;
  mode: string;
  appearances: number;
  appearanceRate: number;
  rounds: number;
}

export interface MapMetaDataset {
  rows: MapMetaRow[];
  totalAppearances: number;
  totalMatches: number;
  modes: string[];
  lastObservedAt: Date | null;
}

export interface MapAgentPickRow {
  mapId: string;
  mapName: string;
  mapImage: string;
  modeId: string;
  mode: string;
  totalPicks: number;
  matches: number;
  leaders: Array<{
    agentId: string;
    name: string;
    icon: string;
    role: string;
    picks: number;
    pickRate: number;
  }>;
}

export interface MapAgentPickDataset {
  rows: MapAgentPickRow[];
  modes: string[];
  totalPicks: number;
  totalMatches: number;
  lastObservedAt: Date | null;
}

interface ParticipantObservation {
  sourceUserId: string;
  matchId: string;
  participantHash: string;
  scope: ObservationScope;
  region: Region;
  actId: string | null;
  queueId: string;
  mapId: string;
  agentId: string;
  competitiveTier: number | null;
  teamId: string;
  result: MatchResult;
  matchStartedAt: Date;
  roundsPlayed: number;
  roundsWon: number;
  roundsLost: number;
  score: number;
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
  damageReceived: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  kastRounds: number;
  firstBloods: number;
  plants: number;
  defuses: number;
  playtimeMillis: number;
}

export const AGENT_META_QUEUES = [
  { id: "competitive", label: "Competitive" },
  { id: "unrated", label: "Unrated" },
  { id: "swiftplay", label: "Swiftplay" },
  { id: "spikerush", label: "Spike Rush" },
  { id: "hurm", label: "Team Deathmatch" },
] as const;

export const MAP_AGENT_PICK_QUEUES = [
  { id: "competitive", label: "Competitive" },
  { id: "unrated", label: "Unrated" },
  { id: "swiftplay", label: "Swiftplay" },
  { id: "spikerush", label: "Spike Rush" },
  { id: "hurm", label: "Team Deathmatch" },
] as const;

export const AGENT_RANK_BUCKETS = [
  { id: "all", label: "All ranks", tiers: [] },
  { id: "unranked", label: "Unranked", tiers: [0] },
  { id: "iron", label: "Iron", tiers: [3, 4, 5] },
  { id: "bronze", label: "Bronze", tiers: [6, 7, 8] },
  { id: "silver", label: "Silver", tiers: [9, 10, 11] },
  { id: "gold", label: "Gold", tiers: [12, 13, 14] },
  { id: "platinum", label: "Platinum", tiers: [15, 16, 17] },
  { id: "diamond", label: "Diamond", tiers: [18, 19, 20] },
  { id: "ascendant", label: "Ascendant", tiers: [21, 22, 23] },
  { id: "immortal", label: "Immortal", tiers: [24, 25, 26] },
  { id: "radiant", label: "Radiant", tiers: [27] },
] as const satisfies readonly AgentRankBucket[];

function percent(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100;
}

function getRankBucket(id: AgentRankBucketId): AgentRankBucket {
  return (
    AGENT_RANK_BUCKETS.find((bucket) => bucket.id === id) ??
    AGENT_RANK_BUCKETS[0]
  );
}

function getRankBucketForTier(tier: number): AgentRankBucket {
  return (
    AGENT_RANK_BUCKETS.find(
      (bucket) =>
        bucket.id !== "all" &&
        (bucket.tiers as readonly number[]).includes(tier),
    ) ?? AGENT_RANK_BUCKETS[1]
  );
}

function buildAgentMetaWhere(
  actId?: string | null,
  filters: AgentMetaFilters = {},
): Prisma.AgentMatchObservationWhereInput {
  const queueId = filters.queueId ?? "competitive";
  const rankBucket = getRankBucket(filters.rankBucket ?? "all");
  const canFilterRank = queueId === "competitive";

  return {
    sourceUser: {
      consentVersion: PLAYER_DATA_CONSENT_VERSION,
      consentedAt: { not: null },
    },
    queueId,
    ...(actId ? { actId } : {}),
    ...(canFilterRank && rankBucket.id !== "all"
      ? { competitiveTier: { in: [...rankBucket.tiers] } }
      : {}),
  };
}

function ratio(value: number, total: number): number {
  return total === 0 ? 0 : value / total;
}

export function buildEmptyAgentMetaDataset(agents: Agent[]): AgentMetaDataset {
  return {
    rows: agents
      .map((agent) => ({
        agentId: agent.uuid,
        name: agent.displayName,
        icon: agent.displayIcon,
        role: agent.role?.displayName ?? "Agent",
        roleIcon: agent.role?.displayIcon ?? null,
        picks: 0,
        pickRate: 0,
        wins: 0,
        winRate: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        kd: 0,
        averageAcs: 0,
        averageDamagePerRound: 0,
        damageDeltaPerRound: 0,
        headshotRate: 0,
        kast: 0,
        firstBloodsPerMatch: 0,
        rounds: 0,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    totalPicks: 0,
    totalMatches: 0,
    trackedPlayers: 0,
    lastObservedAt: null,
  };
}

export function buildEmptyMapMetaDataset(maps: ValorantMap[]): MapMetaDataset {
  void maps;
  return {
    rows: [],
    totalAppearances: 0,
    totalMatches: 0,
    modes: [],
    lastObservedAt: null,
  };
}

export function buildEmptyMapAgentPickDataset(): MapAgentPickDataset {
  return {
    rows: [],
    modes: [],
    totalPicks: 0,
    totalMatches: 0,
    lastObservedAt: null,
  };
}

function hashParticipant(puuid: string): string {
  const salt = process.env.AUTH_SECRET ?? "agentstats-local-meta-salt";
  return createHash("sha256").update(`${salt}:${puuid}`).digest("hex");
}

function getParticipantObservation(
  sourceUserId: string,
  region: Region,
  match: RiotMatch,
  puuid: string,
  scope: ObservationScope,
): ParticipantObservation | null {
  const participant = match.players.find((player) => player.puuid === puuid);
  if (!participant?.stats) return null;

  const team = match.teams.find((item) => item.teamId === participant.teamId);
  const opponent = match.teams.find(
    (item) => item.teamId !== participant.teamId,
  );
  if (!team || !opponent) return null;

  const result =
    team.roundsWon === opponent.roundsWon
      ? MatchResult.DRAW
      : team.won
        ? MatchResult.WIN
        : MatchResult.LOSS;

  if (scope === ObservationScope.MATCH_CONTEXT) {
    return {
      sourceUserId,
      matchId: match.matchInfo.matchId,
      participantHash: hashParticipant(puuid),
      scope,
      region,
      actId: match.matchInfo.seasonId ?? null,
      queueId: match.matchInfo.queueId,
      mapId: match.matchInfo.mapId,
      agentId: participant.characterId,
      competitiveTier: participant.competitiveTier ?? null,
      teamId: participant.teamId,
      result,
      matchStartedAt: new Date(match.matchInfo.gameStartMillis),
      roundsPlayed: participant.stats.roundsPlayed,
      roundsWon: team.roundsWon,
      roundsLost: opponent.roundsWon,
      score: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      damageReceived: 0,
      headshots: 0,
      bodyshots: 0,
      legshots: 0,
      kastRounds: 0,
      firstBloods: 0,
      plants: 0,
      defuses: 0,
      playtimeMillis: 0,
    };
  }
  const teamByPuuid = new Map(
    match.players.map((player) => [player.puuid, player.teamId]),
  );
  let damage = 0;
  let damageReceived = 0;
  let headshots = 0;
  let bodyshots = 0;
  let legshots = 0;
  let kastRounds = 0;
  let firstBloods = 0;
  let plants = 0;
  let defuses = 0;

  for (const round of match.roundResults) {
    const allKills = round.playerStats.flatMap((stats) => stats.kills ?? []);
    const ownRound = round.playerStats.find((stats) => stats.puuid === puuid);
    const ownKills = ownRound?.kills ?? [];
    const death = allKills.find((kill) => kill.victim === puuid);
    const assisted = allKills.some((kill) => kill.assistants.includes(puuid));
    const survived = !death;
    const traded = death
      ? allKills.some(
          (kill) =>
            kill.victim === death.killer &&
            teamByPuuid.get(kill.killer) === participant.teamId &&
            (kill.timeSinceRoundStartMillis ?? Number.POSITIVE_INFINITY) >=
              (death.timeSinceRoundStartMillis ?? 0) &&
            (kill.timeSinceRoundStartMillis ?? Number.POSITIVE_INFINITY) -
              (death.timeSinceRoundStartMillis ?? 0) <=
              5_000,
        )
      : false;

    if (ownKills.length > 0 || assisted || survived || traded) kastRounds += 1;
    if (round.bombPlanter === puuid) plants += 1;
    if (round.bombDefuser === puuid) defuses += 1;

    const firstKill = allKills.reduce<(typeof allKills)[number] | null>(
      (earliest, kill) =>
        !earliest ||
        (kill.timeSinceRoundStartMillis ?? Number.POSITIVE_INFINITY) <
          (earliest.timeSinceRoundStartMillis ?? Number.POSITIVE_INFINITY)
          ? kill
          : earliest,
      null,
    );
    if (firstKill?.killer === puuid) firstBloods += 1;

    for (const hit of ownRound?.damage ?? []) {
      damage += hit.damage;
      headshots += hit.headshots;
      bodyshots += hit.bodyshots;
      legshots += hit.legshots;
    }

    for (const roundPlayer of round.playerStats) {
      for (const hit of roundPlayer.damage) {
        if (hit.receiver === puuid) damageReceived += hit.damage;
      }
    }
  }

  return {
    sourceUserId,
    matchId: match.matchInfo.matchId,
    participantHash: hashParticipant(puuid),
    scope,
    region,
    actId: match.matchInfo.seasonId ?? null,
    queueId: match.matchInfo.queueId,
    mapId: match.matchInfo.mapId,
    agentId: participant.characterId,
    competitiveTier: participant.competitiveTier ?? null,
    teamId: participant.teamId,
    result,
    matchStartedAt: new Date(match.matchInfo.gameStartMillis),
    roundsPlayed: participant.stats.roundsPlayed,
    roundsWon: team.roundsWon,
    roundsLost: opponent.roundsWon,
    score: participant.stats.score,
    kills: participant.stats.kills,
    deaths: participant.stats.deaths,
    assists: participant.stats.assists,
    damage,
    damageReceived,
    headshots,
    bodyshots,
    legshots,
    kastRounds,
    firstBloods,
    plants,
    defuses,
    playtimeMillis: participant.stats.playtimeMillis,
  };
}

export async function syncAgentMatchObservations({
  sourceUserId,
  sourcePuuid,
  region,
  matches,
}: {
  sourceUserId: string;
  sourcePuuid: string;
  region: Region;
  matches: RiotMatch[];
}): Promise<number> {
  const observations = matches
    .filter((match) => match.matchInfo.isCompleted)
    .flatMap((match) =>
    match.players.flatMap((participant) => {
      const observation = getParticipantObservation(
        sourceUserId,
        region,
        match,
        participant.puuid,
        participant.puuid === sourcePuuid
          ? ObservationScope.SELF
          : ObservationScope.MATCH_CONTEXT,
      );
      return observation ? [observation] : [];
    }),
    );
  const selfObservations = observations.filter(
    (observation) => observation.scope === ObservationScope.SELF,
  );
  const contextObservations = observations.filter(
    (observation) => observation.scope === ObservationScope.MATCH_CONTEXT,
  );

  await prisma.$transaction([
    prisma.agentMatchObservation.deleteMany({
      where: { sourceUserId },
    }),
    ...selfObservations.map((observation) =>
      prisma.agentMatchObservation.upsert({
        where: {
          matchId_participantHash: {
            matchId: observation.matchId,
            participantHash: observation.participantHash,
          },
        },
        create: observation,
        update: {
          sourceUserId: observation.sourceUserId,
          scope: observation.scope,
          region: observation.region,
          actId: observation.actId,
          queueId: observation.queueId,
          mapId: observation.mapId,
          agentId: observation.agentId,
          competitiveTier: observation.competitiveTier,
          teamId: observation.teamId,
          result: observation.result,
          matchStartedAt: observation.matchStartedAt,
          observedAt: new Date(),
          roundsPlayed: observation.roundsPlayed,
          roundsWon: observation.roundsWon,
          roundsLost: observation.roundsLost,
          score: observation.score,
          kills: observation.kills,
          deaths: observation.deaths,
          assists: observation.assists,
          damage: observation.damage,
          damageReceived: observation.damageReceived,
          headshots: observation.headshots,
          bodyshots: observation.bodyshots,
          legshots: observation.legshots,
          kastRounds: observation.kastRounds,
          firstBloods: observation.firstBloods,
          plants: observation.plants,
          defuses: observation.defuses,
          playtimeMillis: observation.playtimeMillis,
        },
      }),
    ),
    ...(contextObservations.length > 0
      ? [
          prisma.agentMatchObservation.createMany({
            data: contextObservations,
            skipDuplicates: true,
          }),
        ]
      : []),
    prisma.user.update({
      where: { id: sourceUserId },
      data: { lastProfileSyncAt: new Date() },
    }),
  ]);

  return observations.length;
}

export async function getAgentMetaDataset(
  agents: Agent[],
  actId?: string | null,
  filters: AgentMetaFilters = {},
): Promise<AgentMetaDataset> {
  const where = buildAgentMetaWhere(actId, filters);
  const performanceWhere = {
    ...where,
    scope: ObservationScope.SELF,
  };
  const [
    groups,
    performanceGroups,
    resultGroups,
    totalPicks,
    matchGroups,
    contributorGroups,
    latest,
  ] = await Promise.all([
      prisma.agentMatchObservation.groupBy({
        by: ["agentId"],
        where,
        _count: { _all: true },
      }),
      prisma.agentMatchObservation.groupBy({
        by: ["agentId"],
        where: performanceWhere,
        _count: { _all: true },
        _sum: {
          roundsPlayed: true,
          roundsWon: true,
          score: true,
          kills: true,
          deaths: true,
          assists: true,
          damage: true,
          damageReceived: true,
          headshots: true,
          bodyshots: true,
          legshots: true,
          kastRounds: true,
          firstBloods: true,
        },
      }),
      prisma.agentMatchObservation.groupBy({
        by: ["agentId", "result"],
        where,
        _count: { _all: true },
      }),
      prisma.agentMatchObservation.count({ where }),
      prisma.agentMatchObservation.groupBy({ by: ["matchId"], where }),
      prisma.agentMatchObservation.groupBy({
        by: ["sourceUserId"],
        where,
      }),
      prisma.agentMatchObservation.findFirst({
        where,
        orderBy: { observedAt: "desc" },
        select: { observedAt: true },
      }),
    ]);
  const groupByAgent = new Map(groups.map((group) => [group.agentId, group]));
  const performanceByAgent = new Map(
    performanceGroups.map((group) => [group.agentId, group]),
  );
  const winsByAgent = new Map(
    resultGroups
      .filter((group) => group.result === MatchResult.WIN)
      .map((group) => [group.agentId, group._count._all]),
  );
  const rows = buildEmptyAgentMetaDataset(agents)
    .rows.map((agent) => {
      const group = groupByAgent.get(agent.agentId);
      const picks = group?._count._all ?? 0;
      const performance = performanceByAgent.get(agent.agentId);
      const performancePicks = performance?._count._all ?? 0;
      const sums = performance?._sum;
      const rounds = sums?.roundsPlayed ?? 0;
      const kills = sums?.kills ?? 0;
      const deaths = sums?.deaths ?? 0;
      const headshots = sums?.headshots ?? 0;
      const bodyshots = sums?.bodyshots ?? 0;
      const legshots = sums?.legshots ?? 0;
      const hitTotal = headshots + bodyshots + legshots;
      const wins = winsByAgent.get(agent.agentId) ?? 0;

      return {
        ...agent,
        picks,
        pickRate: percent(picks, totalPicks),
        wins,
        winRate: percent(wins, picks),
        kills,
        deaths,
        assists: sums?.assists ?? 0,
        kd: deaths === 0 ? kills : kills / deaths,
        averageAcs: ratio(sums?.score ?? 0, rounds),
        averageDamagePerRound: ratio(sums?.damage ?? 0, rounds),
        damageDeltaPerRound: ratio(
          (sums?.damage ?? 0) - (sums?.damageReceived ?? 0),
          rounds,
        ),
        headshotRate: percent(headshots, hitTotal),
        kast: percent(sums?.kastRounds ?? 0, rounds),
        firstBloodsPerMatch: ratio(
          sums?.firstBloods ?? 0,
          performancePicks,
        ),
        rounds,
      } satisfies AgentMetaRow;
    })
    .sort((left, right) => {
      if (right.pickRate !== left.pickRate)
        return right.pickRate - left.pickRate;
      if (right.picks !== left.picks) return right.picks - left.picks;
      return left.name.localeCompare(right.name);
    });

  return {
    rows,
    totalPicks,
    totalMatches: matchGroups.length,
    trackedPlayers: contributorGroups.length,
    lastObservedAt: latest?.observedAt ?? null,
  };
}

export async function getAgentRankMetaDataset(
  agents: Agent[],
  actId?: string | null,
  queueId = "competitive",
): Promise<AgentRankMetaRow[]> {
  const where = buildAgentMetaWhere(actId, { queueId });
  const [groups, resultGroups] = await Promise.all([
    prisma.agentMatchObservation.groupBy({
      by: ["competitiveTier", "agentId"],
      where,
      _count: { _all: true },
    }),
    prisma.agentMatchObservation.groupBy({
      by: ["competitiveTier", "agentId", "result"],
      where,
      _count: { _all: true },
    }),
  ]);
  const winsByTierAgent = new Map(
    resultGroups
      .filter((group) => group.result === MatchResult.WIN)
      .map((group) => [
        `${group.competitiveTier ?? 0}:${group.agentId}`,
        group._count._all,
      ]),
  );
  const agentById = new Map(
    agents.map((agent) => [agent.uuid.toLowerCase(), agent]),
  );
  const buckets = new Map<
    AgentRankBucketId,
    {
      samplePicks: number;
      agents: Map<string, { picks: number; wins: number }>;
    }
  >(
    AGENT_RANK_BUCKETS.filter((bucket) => bucket.id !== "all").map((bucket) => [
      bucket.id,
      { samplePicks: 0, agents: new Map() },
    ]),
  );

  for (const group of groups) {
    const tier = group.competitiveTier ?? 0;
    const bucket = AGENT_RANK_BUCKETS.find((item) =>
      (item.tiers as readonly number[]).includes(tier),
    );
    if (!bucket || bucket.id === "all") continue;

    const current = buckets.get(bucket.id);
    if (!current) continue;

    const picks = group._count._all;
    const agent = current.agents.get(group.agentId) ?? { picks: 0, wins: 0 };
    current.samplePicks += picks;
    agent.picks += picks;
    agent.wins +=
      winsByTierAgent.get(`${tier}:${group.agentId}`) ?? 0;
    current.agents.set(group.agentId, agent);
  }

  return AGENT_RANK_BUCKETS.filter((bucket) => bucket.id !== "all")
    .map((bucket) => {
      const values = buckets.get(bucket.id);
      const samplePicks = values?.samplePicks ?? 0;
      const leaders = Array.from(values?.agents.entries() ?? [])
        .map(([agentId, totals]) => {
          const agent = agentById.get(agentId.toLowerCase());

          return {
            agentId,
            name: agent?.displayName ?? "Unknown agent",
            icon: agent?.displayIcon ?? null,
            picks: totals.picks,
            pickRate: percent(totals.picks, samplePicks),
            wins: totals.wins,
            winRate: percent(totals.wins, totals.picks),
          };
        })
        .sort((left, right) => {
          if (right.picks !== left.picks) return right.picks - left.picks;
          if (right.winRate !== left.winRate)
            return right.winRate - left.winRate;
          return left.name.localeCompare(right.name);
        })
        .slice(0, 2);

      return {
        bucketId: bucket.id,
        label: bucket.label,
        samplePicks,
        leaders,
      } satisfies AgentRankMetaRow;
    })
    .filter((row) => row.samplePicks > 0);
}

export async function getPlayerAgentBenchmark({
  agentId,
  competitiveTier,
  actId,
  excludeSourceUserId,
}: {
  agentId: string;
  competitiveTier: number;
  actId?: string | null;
  excludeSourceUserId?: string | null;
}): Promise<PlayerAgentBenchmark> {
  const rankBucket = getRankBucketForTier(competitiveTier);
  const minimumMatches = 10;
  const minimumPlayers = 3;
  const where: Prisma.AgentMatchObservationWhereInput = {
    sourceUser: {
      consentVersion: PLAYER_DATA_CONSENT_VERSION,
      consentedAt: { not: null },
    },
    scope: ObservationScope.SELF,
    queueId: "competitive",
    agentId,
    competitiveTier: { in: [...rankBucket.tiers] },
    ...(actId ? { actId } : {}),
    ...(excludeSourceUserId
      ? { sourceUserId: { not: excludeSourceUserId } }
      : {}),
  };
  const [aggregate, contributors] = await Promise.all([
    prisma.agentMatchObservation.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        roundsPlayed: true,
        score: true,
        kills: true,
        deaths: true,
        damage: true,
        damageReceived: true,
        kastRounds: true,
      },
    }),
    prisma.agentMatchObservation.groupBy({
      by: ["sourceUserId"],
      where,
    }),
  ]);
  const sampleMatches = aggregate._count._all;
  const trackedPlayers = contributors.length;
  const rounds = aggregate._sum.roundsPlayed ?? 0;
  const kills = aggregate._sum.kills ?? 0;
  const deaths = aggregate._sum.deaths ?? 0;

  return {
    eligible:
      sampleMatches >= minimumMatches &&
      trackedPlayers >= minimumPlayers &&
      rounds > 0,
    rankBucketId: rankBucket.id,
    rankBucketLabel: rankBucket.label,
    sampleMatches,
    trackedPlayers,
    minimumMatches,
    minimumPlayers,
    averageAcs: ratio(aggregate._sum.score ?? 0, rounds),
    averageDamagePerRound: ratio(aggregate._sum.damage ?? 0, rounds),
    damageDeltaPerRound: ratio(
      (aggregate._sum.damage ?? 0) -
        (aggregate._sum.damageReceived ?? 0),
      rounds,
    ),
    kd: deaths === 0 ? kills : kills / deaths,
    kast: percent(aggregate._sum.kastRounds ?? 0, rounds),
  };
}

function isMetaEligibleMap(map: ValorantMap): boolean {
  const mapUrl = map.mapUrl.toLowerCase();
  const name = map.displayName.toLowerCase();

  if (name === "basic training" || name === "the range") return false;
  if (mapUrl.includes("/npev2/")) return false;

  return true;
}

function buildMapLookup(maps: ValorantMap[]): Map<string, ValorantMap> {
  const lookup = new Map<string, ValorantMap>();

  for (const map of maps) {
    lookup.set(map.uuid.toLowerCase(), map);
    lookup.set(map.mapUrl.toLowerCase(), map);
  }

  return lookup;
}

export async function getMapMetaDataset(
  maps: ValorantMap[],
  actId?: string | null,
): Promise<MapMetaDataset> {
  const where = {
    sourceUser: {
      consentVersion: PLAYER_DATA_CONSENT_VERSION,
      consentedAt: { not: null },
    },
    ...(actId ? { actId } : {}),
  };
  const [matchMapGroups, latest] = await Promise.all([
    prisma.agentMatchObservation.groupBy({
      by: ["mapId", "queueId", "matchId"],
      where,
      _max: {
        roundsPlayed: true,
      },
    }),
    prisma.agentMatchObservation.findFirst({
      where,
      orderBy: { observedAt: "desc" },
      select: { observedAt: true },
    }),
  ]);
  const mapLookup = buildMapLookup(maps);
  const eligibleMatchMapGroups = matchMapGroups.filter((matchMap) => {
    const map = mapLookup.get(matchMap.mapId.toLowerCase());
    return Boolean(map && isMetaEligibleMap(map));
  });
  const baseRows = new Map(
    buildEmptyMapMetaDataset(maps).rows.map((row) => [
      `${row.modeId}:${row.mapId}`,
      row,
    ]),
  );
  const groups = new Map<
    string,
    {
      mapId: string;
      queueId: string;
      appearances: number;
      rounds: number;
    }
  >();

  for (const matchMap of eligibleMatchMapGroups) {
    const key = `${matchMap.queueId}:${matchMap.mapId}`;
    const existing = groups.get(key);

    if (existing) {
      existing.appearances += 1;
      existing.rounds += matchMap._max.roundsPlayed ?? 0;
    } else {
      groups.set(key, {
        mapId: matchMap.mapId,
        queueId: matchMap.queueId,
        appearances: 1,
        rounds: matchMap._max.roundsPlayed ?? 0,
      });
    }
  }

  const totalAppearances = eligibleMatchMapGroups.length;
  const appearancesByMode = new Map<string, number>();
  for (const matchMap of eligibleMatchMapGroups) {
    appearancesByMode.set(
      matchMap.queueId,
      (appearancesByMode.get(matchMap.queueId) ?? 0) + 1,
    );
  }
  const observedRows = Array.from(groups.values())
    .map((group) => {
      const map = mapLookup.get(group.mapId.toLowerCase());
      if (!map || !isMetaEligibleMap(map)) return null;

      return {
        mapId: map.uuid,
        name: map.displayName,
        image: map.splash ?? map.displayIcon ?? "",
        modeId: group.queueId,
        mode: formatQueueName(group.queueId),
        appearances: group.appearances,
        appearanceRate: percent(
          group.appearances,
          appearancesByMode.get(group.queueId) ?? 0,
        ),
        rounds: group.rounds,
      } satisfies MapMetaRow;
    })
    .filter((row): row is MapMetaRow => Boolean(row));
  for (const row of observedRows) {
    baseRows.set(`${row.modeId}:${row.mapId}`, row);
  }
  const rows = Array.from(baseRows.values()).sort((left, right) => {
    if (left.modeId !== right.modeId)
      return left.mode.localeCompare(right.mode);
    if (right.appearances !== left.appearances) {
      return right.appearances - left.appearances;
    }
    return left.name.localeCompare(right.name);
  });

  return {
    rows,
    totalAppearances,
    totalMatches: new Set(
      eligibleMatchMapGroups.map((group) => group.matchId),
    ).size,
    modes: Array.from(appearancesByMode.keys()).sort(),
    lastObservedAt: latest?.observedAt ?? null,
  };
}

export async function getMapAgentPickDataset(
  agents: Agent[],
  maps: ValorantMap[],
  actId?: string | null,
): Promise<MapAgentPickDataset> {
  const queueIds: string[] = MAP_AGENT_PICK_QUEUES.map((queue) => queue.id);
  const where = {
    sourceUser: {
      consentVersion: PLAYER_DATA_CONSENT_VERSION,
      consentedAt: { not: null },
    },
    queueId: { in: [...queueIds] },
    ...(actId ? { actId } : {}),
  };
  const [pickGroups, matchGroups, latest] = await Promise.all([
    prisma.agentMatchObservation.groupBy({
      by: ["mapId", "queueId", "agentId"],
      where,
      _count: { _all: true },
    }),
    prisma.agentMatchObservation.groupBy({
      by: ["mapId", "queueId", "matchId"],
      where,
    }),
    prisma.agentMatchObservation.findFirst({
      where,
      orderBy: { observedAt: "desc" },
      select: { observedAt: true },
    }),
  ]);
  const mapLookup = buildMapLookup(maps);
  const agentLookup = new Map(
    agents.map((agent) => [agent.uuid.toLowerCase(), agent]),
  );
  const matchesByMapMode = new Map<string, number>();
  const eligibleMatchGroups = matchGroups.filter((group) => {
    const map = mapLookup.get(group.mapId.toLowerCase());
    return Boolean(map && isMetaEligibleMap(map));
  });

  for (const group of eligibleMatchGroups) {
    const key = `${group.queueId}:${group.mapId}`;
    matchesByMapMode.set(key, (matchesByMapMode.get(key) ?? 0) + 1);
  }

  const grouped = new Map<
    string,
    {
      map: ValorantMap;
      modeId: string;
      totalPicks: number;
      agents: Array<{ agentId: string; picks: number }>;
    }
  >();

  for (const group of pickGroups) {
    const map = mapLookup.get(group.mapId.toLowerCase());
    const agent = agentLookup.get(group.agentId.toLowerCase());
    if (!map || !agent || !isMetaEligibleMap(map)) continue;

    const key = `${group.queueId}:${map.uuid}`;
    const current = grouped.get(key) ?? {
      map,
      modeId: group.queueId,
      totalPicks: 0,
      agents: [],
    };
    current.totalPicks += group._count._all;
    current.agents.push({
      agentId: agent.uuid,
      picks: group._count._all,
    });
    grouped.set(key, current);
  }

  const rows = Array.from(grouped.values())
    .map((group) => ({
      mapId: group.map.uuid,
      mapName: group.map.displayName,
      mapImage: group.map.splash ?? group.map.displayIcon ?? "",
      modeId: group.modeId,
      mode:
        MAP_AGENT_PICK_QUEUES.find((queue) => queue.id === group.modeId)
          ?.label ?? formatQueueName(group.modeId),
      totalPicks: group.totalPicks,
      matches:
        matchesByMapMode.get(`${group.modeId}:${group.map.uuid}`) ?? 0,
      leaders: group.agents
        .map((entry) => {
          const agent = agentLookup.get(entry.agentId.toLowerCase());

          return {
            agentId: entry.agentId,
            name: agent?.displayName ?? "Unknown agent",
            icon: agent?.displayIcon ?? "",
            role: agent?.role?.displayName ?? "Agent",
            picks: entry.picks,
            pickRate: percent(entry.picks, group.totalPicks),
          };
        })
        .sort((left, right) => {
          if (right.picks !== left.picks) return right.picks - left.picks;
          return left.name.localeCompare(right.name);
        })
        .slice(0, 5),
    }))
    .sort((left, right) => {
      const leftMode = queueIds.indexOf(left.modeId);
      const rightMode = queueIds.indexOf(right.modeId);
      if (leftMode !== rightMode) return leftMode - rightMode;
      if (right.totalPicks !== left.totalPicks) {
        return right.totalPicks - left.totalPicks;
      }
      return left.mapName.localeCompare(right.mapName);
    });

  return {
    rows,
    modes: MAP_AGENT_PICK_QUEUES.filter((queue) =>
      rows.some((row) => row.modeId === queue.id),
    ).map((queue) => queue.id),
    totalPicks: rows.reduce((total, row) => total + row.totalPicks, 0),
    totalMatches: new Set(
      eligibleMatchGroups.map((group) => group.matchId),
    ).size,
    lastObservedAt: latest?.observedAt ?? null,
  };
}
