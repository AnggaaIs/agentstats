import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";
import { MatchResult } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Region } from "@/lib/constants";
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
  picks: number;
  pickRate: number;
  wins: number;
  winRate: number;
  rounds: number;
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

interface ParticipantObservation {
  sourceUserId: string;
  matchId: string;
  participantHash: string;
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
  { id: "deathmatch", label: "Deathmatch" },
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

function buildAgentMetaWhere(
  actId?: string | null,
  filters: AgentMetaFilters = {},
): Prisma.AgentMatchObservationWhereInput {
  const queueId = filters.queueId ?? "competitive";
  const rankBucket = getRankBucket(filters.rankBucket ?? "all");
  const canFilterRank = queueId === "competitive";

  return {
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
  return {
    rows: [],
    totalAppearances: 0,
    totalMatches: 0,
    modes: [],
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
  region,
  matches,
}: {
  sourceUserId: string;
  region: Region;
  matches: RiotMatch[];
}): Promise<number> {
  const observations = matches.flatMap((match) =>
    match.players.flatMap((participant) => {
      const observation = getParticipantObservation(
        sourceUserId,
        region,
        match,
        participant.puuid,
      );
      return observation ? [observation] : [];
    }),
  );

  if (observations.length === 0) return 0;

  await prisma.$transaction([
    ...observations.map((observation) =>
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
  const [
    groups,
    resultGroups,
    totalPicks,
    matchGroups,
    playerGroups,
    latest,
  ] = await Promise.all([
    prisma.agentMatchObservation.groupBy({
      by: ["agentId"],
      where,
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
      by: ["participantHash"],
      where,
    }),
    prisma.agentMatchObservation.findFirst({
      where,
      orderBy: { observedAt: "desc" },
      select: { observedAt: true },
    }),
  ]);
  const groupByAgent = new Map(groups.map((group) => [group.agentId, group]));
  const winsByAgent = new Map(
    resultGroups
      .filter((group) => group.result === MatchResult.WIN)
      .map((group) => [group.agentId, group._count._all]),
  );
  const rows = buildEmptyAgentMetaDataset(agents).rows
    .map((agent) => {
      const group = groupByAgent.get(agent.agentId);
      const picks = group?._count._all ?? 0;
      const sums = group?._sum;
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
        firstBloodsPerMatch: ratio(sums?.firstBloods ?? 0, picks),
        rounds,
      } satisfies AgentMetaRow;
    })
    .sort((left, right) => {
      if (right.pickRate !== left.pickRate) return right.pickRate - left.pickRate;
      if (right.picks !== left.picks) return right.picks - left.picks;
      return left.name.localeCompare(right.name);
    });

  return {
    rows,
    totalPicks,
    totalMatches: matchGroups.length,
    trackedPlayers: playerGroups.length,
    lastObservedAt: latest?.observedAt ?? null,
  };
}

export async function getAgentRankMetaDataset(
  actId?: string | null,
  queueId = "competitive",
): Promise<AgentRankMetaRow[]> {
  const where = buildAgentMetaWhere(actId, { queueId });
  const [groups, resultGroups, totalPicks] = await Promise.all([
    prisma.agentMatchObservation.groupBy({
      by: ["competitiveTier"],
      where,
      _count: { _all: true },
      _sum: {
        roundsPlayed: true,
      },
    }),
    prisma.agentMatchObservation.groupBy({
      by: ["competitiveTier", "result"],
      where,
      _count: { _all: true },
    }),
    prisma.agentMatchObservation.count({ where }),
  ]);
  const winsByTier = new Map(
    resultGroups
      .filter((group) => group.result === MatchResult.WIN)
      .map((group) => [group.competitiveTier ?? 0, group._count._all]),
  );
  const picksByBucket = new Map<
    AgentRankBucketId,
    { picks: number; wins: number; rounds: number }
  >(
    AGENT_RANK_BUCKETS.filter((bucket) => bucket.id !== "all").map((bucket) => [
      bucket.id,
      { picks: 0, wins: 0, rounds: 0 },
    ]),
  );

  for (const group of groups) {
    const tier = group.competitiveTier ?? 0;
    const bucket = AGENT_RANK_BUCKETS.find((item) =>
      (item.tiers as readonly number[]).includes(tier),
    );
    if (!bucket || bucket.id === "all") continue;

    const current = picksByBucket.get(bucket.id);
    if (!current) continue;

    current.picks += group._count._all;
    current.wins += winsByTier.get(tier) ?? 0;
    current.rounds += group._sum.roundsPlayed ?? 0;
  }

  return AGENT_RANK_BUCKETS.filter((bucket) => bucket.id !== "all").map(
    (bucket) => {
      const values = picksByBucket.get(bucket.id) ?? {
        picks: 0,
        wins: 0,
        rounds: 0,
      };

      return {
        bucketId: bucket.id,
        label: bucket.label,
        picks: values.picks,
        pickRate: percent(values.picks, totalPicks),
        wins: values.wins,
        winRate: percent(values.wins, values.picks),
        rounds: values.rounds,
      } satisfies AgentRankMetaRow;
    },
  );
}

function isMetaEligibleMap(map: ValorantMap): boolean {
  const mapUrl = map.mapUrl.toLowerCase();
  const name = map.displayName.toLowerCase();

  if (name === "basic training" || name === "the range") return false;
  if (mapUrl.includes("/npev2/")) return false;

  return true;
}

function buildMetaEligibleMaps(maps: ValorantMap[]): ValorantMap[] {
  return maps
    .filter(isMetaEligibleMap)
    .toSorted((left, right) => left.displayName.localeCompare(right.displayName));
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
    ...(actId ? { actId } : {}),
  };
  const [
    matchMapGroups,
    matchGroups,
    modeGroups,
    latest,
  ] = await Promise.all([
    prisma.agentMatchObservation.groupBy({
      by: ["mapId", "queueId", "matchId"],
      where,
      _max: {
        roundsPlayed: true,
      },
    }),
    prisma.agentMatchObservation.groupBy({ by: ["matchId"], where }),
    prisma.agentMatchObservation.groupBy({ by: ["queueId"], where }),
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
        appearanceRate: percent(group.appearances, totalAppearances),
        rounds: group.rounds,
      } satisfies MapMetaRow;
    })
    .filter((row): row is MapMetaRow => Boolean(row));
  for (const row of observedRows) {
    baseRows.set(`${row.modeId}:${row.mapId}`, row);
  }
  const rows = Array.from(baseRows.values())
    .sort((left, right) => {
      if (left.modeId !== right.modeId) return left.mode.localeCompare(right.mode);
      if (right.appearances !== left.appearances) {
        return right.appearances - left.appearances;
      }
      return left.name.localeCompare(right.name);
    });

  return {
    rows,
    totalAppearances,
    totalMatches: matchGroups.length,
    modes: modeGroups.map((group) => group.queueId).sort(),
    lastObservedAt: latest?.observedAt ?? null,
  };
}
