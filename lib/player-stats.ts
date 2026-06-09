import type { Agent, ValorantMap } from "@/lib/valorant-api";
import {
  getParticipantDamage,
  getParticipantHeadshotRate,
  type RiotMatch,
} from "@/lib/riot";

export interface MatchSummary {
  matchId: string;
  mapName: string;
  queue: string;
  playedAt: number;
  durationMillis: number;
  agentName: string;
  agentIcon: string | null;
  result: "WIN" | "LOSS" | "DRAW";
  score: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  headshotRate: number;
}

export interface PlayerSummary {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  averageAcs: number;
  averageHeadshotRate: number;
  averageDamagePerRound: number;
  matches: MatchSummary[];
  agents: Array<{
    name: string;
    icon: string | null;
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
  }>;
  maps: Array<{
    name: string;
    games: number;
    wins: number;
  }>;
}

function findMapName(mapId: string, maps: ValorantMap[]): string {
  return (
    maps.find(
      (map) =>
        map.mapUrl.toLowerCase() === mapId.toLowerCase() ||
        map.uuid.toLowerCase() === mapId.toLowerCase(),
    )?.displayName ?? mapId.split("/").at(-1) ?? "Unknown map"
  );
}

export function buildPlayerSummary(
  puuid: string,
  matches: RiotMatch[],
  agents: Agent[],
  maps: ValorantMap[],
): PlayerSummary {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let score = 0;
  let rounds = 0;
  let headshotRateTotal = 0;
  let damage = 0;
  const agentTotals = new Map<
    string,
    {
      name: string;
      icon: string | null;
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
    }
  >();
  const mapTotals = new Map<string, { name: string; games: number; wins: number }>();
  const summaries: MatchSummary[] = [];

  for (const match of matches) {
    const participant = match.players.find((player) => player.puuid === puuid);
    if (!participant?.stats) continue;

    const team = match.teams.find((item) => item.teamId === participant.teamId);
    const opponent = match.teams.find((item) => item.teamId !== participant.teamId);
    const result =
      team?.roundsWon === opponent?.roundsWon
        ? "DRAW"
        : team?.won
          ? "WIN"
          : "LOSS";
    const agent = agents.find(
      (item) => item.uuid.toLowerCase() === participant.characterId.toLowerCase(),
    );
    const mapName = findMapName(match.matchInfo.mapId, maps);
    const headshotRate = getParticipantHeadshotRate(match, puuid);
    const acs =
      participant.stats.roundsPlayed === 0
        ? 0
        : participant.stats.score / participant.stats.roundsPlayed;

    if (result === "WIN") wins += 1;
    if (result === "LOSS") losses += 1;
    if (result === "DRAW") draws += 1;
    kills += participant.stats.kills;
    deaths += participant.stats.deaths;
    assists += participant.stats.assists;
    score += participant.stats.score;
    rounds += participant.stats.roundsPlayed;
    headshotRateTotal += headshotRate;
    damage += getParticipantDamage(match, puuid);

    const agentKey = agent?.uuid ?? participant.characterId;
    const previousAgent = agentTotals.get(agentKey) ?? {
      name: agent?.displayName ?? "Unknown agent",
      icon: agent?.displayIcon ?? null,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };
    previousAgent.games += 1;
    previousAgent.wins += result === "WIN" ? 1 : 0;
    previousAgent.kills += participant.stats.kills;
    previousAgent.deaths += participant.stats.deaths;
    previousAgent.assists += participant.stats.assists;
    agentTotals.set(agentKey, previousAgent);

    const previousMap = mapTotals.get(mapName) ?? {
      name: mapName,
      games: 0,
      wins: 0,
    };
    previousMap.games += 1;
    previousMap.wins += result === "WIN" ? 1 : 0;
    mapTotals.set(mapName, previousMap);

    summaries.push({
      matchId: match.matchInfo.matchId,
      mapName,
      queue: match.matchInfo.queueId || "custom",
      playedAt: match.matchInfo.gameStartMillis,
      durationMillis: match.matchInfo.gameLengthMillis,
      agentName: agent?.displayName ?? "Unknown agent",
      agentIcon: agent?.displayIcon ?? null,
      result,
      score: `${team?.roundsWon ?? 0} – ${opponent?.roundsWon ?? 0}`,
      kills: participant.stats.kills,
      deaths: participant.stats.deaths,
      assists: participant.stats.assists,
      acs,
      headshotRate,
    });
  }

  const games = summaries.length;
  return {
    games,
    wins,
    losses,
    draws,
    winRate: games === 0 ? 0 : (wins / games) * 100,
    kills,
    deaths,
    assists,
    kd: deaths === 0 ? kills : kills / deaths,
    averageAcs: rounds === 0 ? 0 : score / rounds,
    averageHeadshotRate: games === 0 ? 0 : headshotRateTotal / games,
    averageDamagePerRound: rounds === 0 ? 0 : damage / rounds,
    matches: summaries,
    agents: [...agentTotals.values()].sort((a, b) => b.games - a.games),
    maps: [...mapTotals.values()].sort((a, b) => b.games - a.games),
  };
}
