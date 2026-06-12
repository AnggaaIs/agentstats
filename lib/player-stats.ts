import type { Agent, ValorantMap, Weapon } from "@/lib/valorant-api";
import { formatQueueName } from "@/lib/match-context";
import {
  getParticipantDamage,
  getParticipantHeadshotRate,
  type RiotMatch,
} from "@/lib/riot";

export interface MatchSummary {
  matchId: string;
  mapName: string;
  queueId: string;
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
  rounds: number;
  acs: number;
  headshotRate: number;
  damagePerRound: number;
  damageDelta: number;
  firstBloods: number;
  firstDeaths: number;
  competitiveTier: number | null;
}

export interface PlayerFormWindow {
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
  averageDamagePerRound: number;
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
  rounds: number;
  kad: number;
  kast: number;
  damageDeltaPerRound: number;
  firstBloods: number;
  aces: number;
  playtimeMillis: number;
  killsPerRound: number;
  deathsPerRound: number;
  assistsPerRound: number;
  roundWins: number;
  roundLosses: number;
  roundWinRate: number;
  plants: number;
  defuses: number;
  flawlessRounds: number;
  averageLoadoutValue: number;
  averageCreditsSpent: number;
  hitDistribution: {
    head: number;
    body: number;
    leg: number;
    total: number;
    headPercent: number;
    bodyPercent: number;
    legPercent: number;
  };
  multiKills: {
    doubles: number;
    triples: number;
    quads: number;
    aces: number;
  };
  openingDuels: {
    wins: number;
    losses: number;
    total: number;
    winRate: number;
    net: number;
  };
  trades: {
    trackedDeaths: number;
    tradedDeaths: number;
    tradeRate: number;
  };
  recentForm: {
    recent: PlayerFormWindow;
    previous: PlayerFormWindow | null;
    winRateDelta: number | null;
    kdDelta: number | null;
    acsDelta: number | null;
    damageDelta: number | null;
  };
  resultSplits: Array<
    PlayerFormWindow & {
      result: MatchSummary["result"];
    }
  >;
  bestMatch: MatchSummary | null;
  consistency: number;
  accountLevel: number | null;
  competitiveTier: number | null;
  playerCardId: string | null;
  matches: MatchSummary[];
  agents: Array<{
    name: string;
    icon: string | null;
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
    rounds: number;
    averageAcs: number;
    averageDamagePerRound: number;
    damageDeltaPerRound: number;
    winRate: number;
    kd: number;
  }>;
  maps: Array<{
    name: string;
    games: number;
    wins: number;
    losses: number;
    draws: number;
    rounds: number;
    score: number;
    winRate: number;
    averageAcs: number;
  }>;
  weapons: Array<{
    id: string;
    name: string;
    icon: string | null;
    kills: number;
    matches: number;
    killsPerMatch: number;
  }>;
  queues: Array<{
    id: string;
    name: string;
    games: number;
    wins: number;
    winRate: number;
    averageAcs: number;
  }>;
  encounters: Array<{
    puuid: string;
    gameName: string;
    tagLine: string;
    teammateMatches: number;
    opponentMatches: number;
    winsWith: number;
    lossesAgainst: number;
    kills: number;
    deaths: number;
  }>;
}

function summarizeMatches(matches: MatchSummary[]): PlayerFormWindow {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let rounds = 0;
  let score = 0;
  let damage = 0;

  for (const match of matches) {
    if (match.result === "WIN") wins += 1;
    if (match.result === "LOSS") losses += 1;
    if (match.result === "DRAW") draws += 1;
    kills += match.kills;
    deaths += match.deaths;
    assists += match.assists;
    rounds += match.rounds;
    score += match.acs * match.rounds;
    damage += match.damagePerRound * match.rounds;
  }

  const games = matches.length;

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
    averageDamagePerRound: rounds === 0 ? 0 : damage / rounds,
  };
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
  weapons: Weapon[] = [],
): PlayerSummary {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let score = 0;
  let rounds = 0;
  let damage = 0;
  let damageReceived = 0;
  let kastRounds = 0;
  let firstBloods = 0;
  let firstDeaths = 0;
  let trackedDeaths = 0;
  let tradedDeaths = 0;
  let aces = 0;
  let playtimeMillis = 0;
  let roundWins = 0;
  let plants = 0;
  let defuses = 0;
  let flawlessRounds = 0;
  let headHits = 0;
  let bodyHits = 0;
  let legHits = 0;
  let economyRounds = 0;
  let loadoutValue = 0;
  let creditsSpent = 0;
  let doubles = 0;
  let triples = 0;
  let quads = 0;
  let accountLevel: number | null = null;
  let competitiveTier: number | null = null;
  let playerCardId: string | null = null;
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
      rounds: number;
      score: number;
      damage: number;
      damageReceived: number;
    }
  >();
  const mapTotals = new Map<
    string,
    {
      name: string;
      games: number;
      wins: number;
      losses: number;
      draws: number;
      rounds: number;
      score: number;
    }
  >();
  const weaponById = new Map(
    weapons.map((weapon) => [weapon.uuid.toLowerCase(), weapon]),
  );
  const weaponTotals = new Map<
    string,
    { id: string; name: string; icon: string | null; kills: number; matches: Set<string> }
  >();
  const queueTotals = new Map<
    string,
    { id: string; name: string; games: number; wins: number; rounds: number; score: number }
  >();
  const encounterTotals = new Map<
    string,
    {
      puuid: string;
      gameName: string;
      tagLine: string;
      teammateMatches: number;
      opponentMatches: number;
      winsWith: number;
      lossesAgainst: number;
      kills: number;
      deaths: number;
    }
  >();
  const summaries: MatchSummary[] = [];

  for (const match of matches) {
    if (!match.matchInfo.isCompleted) continue;

    const participant = match.players.find((player) => player.puuid === puuid);
    if (!participant?.stats) continue;

    const team = match.teams.find((item) => item.teamId === participant.teamId);
    const opponent = match.teams.find((item) => item.teamId !== participant.teamId);
    if (!team || !opponent) continue;

    const result =
      team.roundsWon === opponent.roundsWon
        ? "DRAW"
        : team.won
          ? "WIN"
          : "LOSS";
    const agent = agents.find(
      (item) => item.uuid.toLowerCase() === participant.characterId.toLowerCase(),
    );
    const mapName = findMapName(match.matchInfo.mapId, maps);
    const headshotRate = getParticipantHeadshotRate(match, puuid);
    const participantDamage = getParticipantDamage(match, puuid);
    let participantDamageReceived = 0;
    let matchKastRounds = 0;
    let matchFirstBloods = 0;
    let matchFirstDeaths = 0;
    const teamByPuuid = new Map(
      match.players.map((player) => [player.puuid, player.teamId]),
    );
    for (const other of match.players) {
      if (other.puuid === puuid) continue;
      const sameTeam = other.teamId === participant.teamId;
      const previous = encounterTotals.get(other.puuid) ?? {
        puuid: other.puuid,
        gameName: other.gameName,
        tagLine: other.tagLine,
        teammateMatches: 0,
        opponentMatches: 0,
        winsWith: 0,
        lossesAgainst: 0,
        kills: 0,
        deaths: 0,
      };
      if (sameTeam) {
        previous.teammateMatches += 1;
        if (result === "WIN") previous.winsWith += 1;
      } else {
        previous.opponentMatches += 1;
        if (result === "LOSS") previous.lossesAgainst += 1;
      }
      encounterTotals.set(other.puuid, previous);
    }

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

      if (ownKills.length > 0 || assisted || survived || traded) {
        matchKastRounds += 1;
      }
      if (death) trackedDeaths += 1;
      if (traded) tradedDeaths += 1;
      if (ownKills.length === 2) doubles += 1;
      if (ownKills.length === 3) triples += 1;
      if (ownKills.length === 4) quads += 1;
      if (ownKills.length >= 5) aces += 1;
      if (round.winningTeam === participant.teamId) {
        roundWins += 1;
        if (round.roundCeremony.toLowerCase().includes("flawless")) {
          flawlessRounds += 1;
        }
      }
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
      if (firstKill?.killer === puuid) matchFirstBloods += 1;
      if (firstKill?.victim === puuid) matchFirstDeaths += 1;
      if (death) {
        const killer = encounterTotals.get(death.killer);
        if (killer) killer.deaths += 1;
      }

      for (const roundPlayer of round.playerStats) {
        for (const hit of roundPlayer.damage) {
          if (hit.receiver === puuid) participantDamageReceived += hit.damage;
        }
      }

      for (const hit of ownRound?.damage ?? []) {
        headHits += hit.headshots;
        bodyHits += hit.bodyshots;
        legHits += hit.legshots;
      }
      if (ownRound?.economy) {
        economyRounds += 1;
        loadoutValue += ownRound.economy.loadoutValue;
        creditsSpent += ownRound.economy.spent;
      }

      for (const kill of ownKills) {
        const victim = encounterTotals.get(kill.victim);
        if (victim) victim.kills += 1;

        const weaponId = kill.finishingDamage?.damageItem?.toLowerCase();
        if (!weaponId) continue;
        const weapon = weaponById.get(weaponId);
        if (weapons.length > 0 && !weapon) continue;
        const previous = weaponTotals.get(weaponId) ?? {
          id: weaponId,
          name: weapon?.displayName ?? "Unknown weapon",
          icon: weapon?.displayIcon ?? null,
          kills: 0,
          matches: new Set<string>(),
        };
        previous.kills += 1;
        previous.matches.add(match.matchInfo.matchId);
        weaponTotals.set(weaponId, previous);
      }
    }
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
    damage += participantDamage;
    damageReceived += participantDamageReceived;
    kastRounds += matchKastRounds;
    firstBloods += matchFirstBloods;
    firstDeaths += matchFirstDeaths;
    playtimeMillis += participant.stats.playtimeMillis;
    accountLevel ??= participant.accountLevel ?? null;
    competitiveTier ??= participant.competitiveTier ?? null;
    playerCardId ??= participant.playerCard ?? null;

    const agentKey = agent?.uuid ?? participant.characterId;
    const previousAgent = agentTotals.get(agentKey) ?? {
      name: agent?.displayName ?? "Unknown agent",
      icon: agent?.displayIcon ?? null,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      rounds: 0,
      score: 0,
      damage: 0,
      damageReceived: 0,
    };
    previousAgent.games += 1;
    previousAgent.wins += result === "WIN" ? 1 : 0;
    previousAgent.kills += participant.stats.kills;
    previousAgent.deaths += participant.stats.deaths;
    previousAgent.assists += participant.stats.assists;
    previousAgent.rounds += participant.stats.roundsPlayed;
    previousAgent.score += participant.stats.score;
    previousAgent.damage += participantDamage;
    previousAgent.damageReceived += participantDamageReceived;
    agentTotals.set(agentKey, previousAgent);

    const previousMap = mapTotals.get(mapName) ?? {
      name: mapName,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      rounds: 0,
      score: 0,
    };
    previousMap.games += 1;
    previousMap.wins += result === "WIN" ? 1 : 0;
    previousMap.losses += result === "LOSS" ? 1 : 0;
    previousMap.draws += result === "DRAW" ? 1 : 0;
    previousMap.rounds += participant.stats.roundsPlayed;
    previousMap.score += participant.stats.score;
    mapTotals.set(mapName, previousMap);

    summaries.push({
      matchId: match.matchInfo.matchId,
      mapName,
      queueId: match.matchInfo.queueId,
      queue: formatQueueName(match.matchInfo.queueId),
      playedAt: match.matchInfo.gameStartMillis,
      durationMillis: match.matchInfo.gameLengthMillis,
      agentName: agent?.displayName ?? "Unknown agent",
      agentIcon: agent?.displayIcon ?? null,
      result,
      score: `${team.roundsWon} – ${opponent.roundsWon}`,
      kills: participant.stats.kills,
      deaths: participant.stats.deaths,
      assists: participant.stats.assists,
      rounds: participant.stats.roundsPlayed,
      acs,
      headshotRate,
      damagePerRound:
        participant.stats.roundsPlayed === 0
          ? 0
          : participantDamage / participant.stats.roundsPlayed,
      damageDelta:
        participant.stats.roundsPlayed === 0
          ? 0
          : (participantDamage - participantDamageReceived) /
            participant.stats.roundsPlayed,
      firstBloods: matchFirstBloods,
      firstDeaths: matchFirstDeaths,
      competitiveTier: participant.competitiveTier ?? null,
    });

    const previousQueue = queueTotals.get(match.matchInfo.queueId) ?? {
      id: match.matchInfo.queueId,
      name: formatQueueName(match.matchInfo.queueId),
      games: 0,
      wins: 0,
      rounds: 0,
      score: 0,
    };
    previousQueue.games += 1;
    previousQueue.wins += result === "WIN" ? 1 : 0;
    previousQueue.rounds += participant.stats.roundsPlayed;
    previousQueue.score += participant.stats.score;
    queueTotals.set(match.matchInfo.queueId, previousQueue);
  }

  const games = summaries.length;
  const hitTotal = headHits + bodyHits + legHits;
  const averageAcs = rounds === 0 ? 0 : score / rounds;
  const averageMatchAcs =
    games === 0
      ? 0
      : summaries.reduce((total, match) => total + match.acs, 0) / games;
  const acsVariance =
    games === 0
      ? 0
      : summaries.reduce(
          (total, match) => total + (match.acs - averageMatchAcs) ** 2,
          0,
        ) / games;
  const agentRows = [...agentTotals.values()]
    .map((agent) => ({
      ...agent,
      averageAcs: agent.rounds === 0 ? 0 : agent.score / agent.rounds,
      averageDamagePerRound:
        agent.rounds === 0 ? 0 : agent.damage / agent.rounds,
      damageDeltaPerRound:
        agent.rounds === 0
          ? 0
          : (agent.damage - agent.damageReceived) / agent.rounds,
      winRate: agent.games === 0 ? 0 : (agent.wins / agent.games) * 100,
      kd: agent.deaths === 0 ? agent.kills : agent.kills / agent.deaths,
    }))
    .sort((a, b) => b.games - a.games);
  const mapRows = [...mapTotals.values()]
    .map((map) => ({
      ...map,
      winRate: map.games === 0 ? 0 : (map.wins / map.games) * 100,
      averageAcs: map.rounds === 0 ? 0 : map.score / map.rounds,
    }))
    .sort((a, b) => b.games - a.games);
  const recentMatches = summaries.slice(0, 5);
  const previousMatches = summaries.slice(5, 10);
  const recentForm = summarizeMatches(recentMatches);
  const previousForm =
    previousMatches.length > 0 ? summarizeMatches(previousMatches) : null;
  const openingDuelTotal = firstBloods + firstDeaths;
  const resultOrder: MatchSummary["result"][] = ["WIN", "LOSS", "DRAW"];
  const resultSplits = resultOrder
    .map((result) => ({
      result,
      ...summarizeMatches(
        summaries.filter((match) => match.result === result),
      ),
    }))
    .filter((split) => split.games > 0);

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
    averageAcs,
    averageHeadshotRate:
      hitTotal === 0 ? 0 : (headHits / hitTotal) * 100,
    averageDamagePerRound: rounds === 0 ? 0 : damage / rounds,
    rounds,
    kad: deaths === 0 ? kills + assists : (kills + assists) / deaths,
    kast: rounds === 0 ? 0 : (kastRounds / rounds) * 100,
    damageDeltaPerRound:
      rounds === 0 ? 0 : (damage - damageReceived) / rounds,
    firstBloods,
    aces,
    playtimeMillis,
    killsPerRound: rounds === 0 ? 0 : kills / rounds,
    deathsPerRound: rounds === 0 ? 0 : deaths / rounds,
    assistsPerRound: rounds === 0 ? 0 : assists / rounds,
    roundWins,
    roundLosses: Math.max(0, rounds - roundWins),
    roundWinRate: rounds === 0 ? 0 : (roundWins / rounds) * 100,
    plants,
    defuses,
    flawlessRounds,
    averageLoadoutValue:
      economyRounds === 0 ? 0 : loadoutValue / economyRounds,
    averageCreditsSpent:
      economyRounds === 0 ? 0 : creditsSpent / economyRounds,
    hitDistribution: {
      head: headHits,
      body: bodyHits,
      leg: legHits,
      total: hitTotal,
      headPercent: hitTotal === 0 ? 0 : (headHits / hitTotal) * 100,
      bodyPercent: hitTotal === 0 ? 0 : (bodyHits / hitTotal) * 100,
      legPercent: hitTotal === 0 ? 0 : (legHits / hitTotal) * 100,
    },
    multiKills: { doubles, triples, quads, aces },
    openingDuels: {
      wins: firstBloods,
      losses: firstDeaths,
      total: openingDuelTotal,
      winRate:
        openingDuelTotal === 0 ? 0 : (firstBloods / openingDuelTotal) * 100,
      net: firstBloods - firstDeaths,
    },
    trades: {
      trackedDeaths,
      tradedDeaths,
      tradeRate:
        trackedDeaths === 0 ? 0 : (tradedDeaths / trackedDeaths) * 100,
    },
    recentForm: {
      recent: recentForm,
      previous: previousForm,
      winRateDelta: previousForm
        ? recentForm.winRate - previousForm.winRate
        : null,
      kdDelta: previousForm ? recentForm.kd - previousForm.kd : null,
      acsDelta: previousForm
        ? recentForm.averageAcs - previousForm.averageAcs
        : null,
      damageDelta: previousForm
        ? recentForm.averageDamagePerRound -
          previousForm.averageDamagePerRound
        : null,
    },
    resultSplits,
    bestMatch:
      summaries.reduce<MatchSummary | null>(
        (best, match) => (!best || match.acs > best.acs ? match : best),
        null,
      ),
    consistency: Math.sqrt(acsVariance),
    accountLevel,
    competitiveTier,
    playerCardId,
    matches: summaries,
    agents: agentRows,
    maps: mapRows,
    weapons: [...weaponTotals.values()]
      .map((weapon) => ({
        id: weapon.id,
        name: weapon.name,
        icon: weapon.icon,
        kills: weapon.kills,
        matches: weapon.matches.size,
        killsPerMatch:
          weapon.matches.size === 0 ? 0 : weapon.kills / weapon.matches.size,
      }))
      .sort((a, b) => b.kills - a.kills),
    queues: [...queueTotals.values()]
      .map((queue) => ({
        ...queue,
        winRate: queue.games === 0 ? 0 : (queue.wins / queue.games) * 100,
        averageAcs: queue.rounds === 0 ? 0 : queue.score / queue.rounds,
      }))
      .sort((a, b) => b.games - a.games),
    encounters: [...encounterTotals.values()].sort(
        (a, b) =>
          b.teammateMatches +
          b.opponentMatches -
          (a.teammateMatches + a.opponentMatches),
      )
      .slice(0, 12),
  };
}
