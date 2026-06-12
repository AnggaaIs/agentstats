import type { Region } from "@/lib/constants";

const ROUTING_REGIONS: Record<Region, string> = {
  ap: "asia",
  na: "americas",
  eu: "europe",
  kr: "asia",
  br: "americas",
  latam: "americas",
};

const AUTO_ROUTING_REGIONS = [
  { routingRegion: "asia", region: "ap" },
  { routingRegion: "americas", region: "na" },
  { routingRegion: "europe", region: "eu" },
] as const satisfies ReadonlyArray<{
  routingRegion: string;
  region: Region;
}>;

const PLATFORM_REGIONS: Record<Region, string> = {
  ap: "ap",
  na: "na",
  eu: "eu",
  kr: "kr",
  br: "br",
  latam: "latam",
};

export class RiotApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotAccountLookup {
  account: RiotAccount;
  region: Region;
}

export interface MatchReference {
  matchId: string;
  gameStartTimeMillis: number;
  queueId: string;
}

export interface MatchList {
  puuid: string;
  history: MatchReference[];
}

export interface MatchParticipant {
  puuid: string;
  gameName: string;
  tagLine: string;
  teamId: string;
  characterId: string;
  playerCard?: string;
  playerTitle?: string;
  accountLevel?: number;
  competitiveTier?: number;
  stats: {
    score: number;
    roundsPlayed: number;
    kills: number;
    deaths: number;
    assists: number;
    playtimeMillis: number;
    abilityCasts?: {
      grenadeCasts: number;
      ability1Casts: number;
      ability2Casts: number;
      ultimateCasts: number;
    };
  } | null;
}

interface RoundKill {
  timeSinceGameStartMillis?: number;
  timeSinceRoundStartMillis?: number;
  killer: string;
  victim: string;
  assistants: string[];
  finishingDamage?: {
    damageType: string;
    damageItem: string;
    isSecondaryFireMode: boolean;
  };
}

export interface RoundPlayerStats {
  puuid: string;
  kills?: RoundKill[];
  damage: Array<{
    receiver?: string;
    headshots: number;
    bodyshots: number;
    legshots: number;
    damage: number;
  }>;
  economy?: {
    loadoutValue: number;
    weapon: string;
    armor: string;
    remaining: number;
    spent: number;
  };
}

export interface RiotMatch {
  matchInfo: {
    matchId: string;
    mapId: string;
    gameStartMillis: number;
    gameLengthMillis: number;
    queueId: string;
    gameMode?: string;
    seasonId?: string;
    isCompleted: boolean;
  };
  players: MatchParticipant[];
  teams: Array<{
    teamId: string;
    won: boolean;
    roundsPlayed: number;
    roundsWon: number;
    numPoints: number;
  }>;
  roundResults: Array<{
    roundNum: number;
    winningTeam: string;
    roundResult: string;
    roundCeremony: string;
    bombPlanter?: string;
    bombDefuser?: string;
    playerStats: RoundPlayerStats[];
  }>;
}

export interface LeaderboardPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  leaderboardRank: number;
  rankedRating: number;
  numberOfWins: number;
  competitiveTier: number;
}

export interface Leaderboard {
  actId: string;
  players: LeaderboardPlayer[];
  totalPlayers: number;
  immortalStartingPage: number;
  immortalStartingIndex: number;
  topTierRRThreshold: number;
  tierDetails: Record<
    string,
    {
      rankedRatingThreshold: number;
      startingPage: number;
      startingIndex: number;
    }
  >;
}

interface RiotStatusTranslation {
  locale: string;
  content: string;
}

interface RiotStatusUpdate {
  id: number;
  created_at: string;
  updated_at: string | null;
  publish: boolean;
  author: string;
  translations: RiotStatusTranslation[];
  publish_locations: string[];
}

export interface RiotStatusNotice {
  id: number;
  created_at: string;
  updated_at: string | null;
  archive_at: string | null;
  titles: RiotStatusTranslation[];
  updates: RiotStatusUpdate[];
  platforms: string[];
  maintenance_status: string | null;
  incident_severity: string | null;
}

export interface RiotPlatformStatus {
  id: string;
  name: string;
  locales: string[];
  maintenances: RiotStatusNotice[];
  incidents: RiotStatusNotice[];
}

function getApiKey(): string {
  const apiKey = process.env.RIOT_API_KEY;

  if (!apiKey) {
    throw new RiotApiError("Riot access is not available yet.", 503);
  }

  return apiKey;
}

async function riotRequest<T>(
  url: string,
  options: { revalidate: number | false; tag: string },
): Promise<T> {
  const response = await fetch(url, {
    headers: { "X-Riot-Token": getApiKey() },
    next:
      options.revalidate === false
        ? { revalidate: false, tags: [options.tag] }
        : { revalidate: options.revalidate, tags: [options.tag] },
  });

  if (!response.ok) {
    const messages: Partial<Record<number, string>> = {
      401: "Riot access is no longer valid.",
      403:
        "Detailed player data requires Riot approval and player permission.",
      404: "The requested content was not found.",
      429: "Too many searches. Please try again shortly.",
    };

    throw new RiotApiError(
      messages[response.status] ?? "Riot could not return a result right now.",
      response.status,
    );
  }

  return (await response.json()) as T;
}

export async function getRiotAccount(
  name: string,
  tag: string,
  region: Region,
): Promise<RiotAccount> {
  const routingRegion = ROUTING_REGIONS[region];
  try {
    return await getRiotAccountFromRouting(name, tag, routingRegion, region);
  } catch (error) {
    if (error instanceof RiotApiError && error.status === 404) {
      throw new RiotApiError(
        `Riot ID ${name}#${tag} was not found. Check the spelling and selected region.`,
        404,
      );
    }
    throw error;
  }
}

async function getRiotAccountFromRouting(
  name: string,
  tag: string,
  routingRegion: string,
  cacheRegion: Region,
): Promise<RiotAccount> {
  return riotRequest<RiotAccount>(
    `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
    {
      revalidate: 300,
      tag: `player:${cacheRegion}:${name}:${tag}`,
    },
  );
}

export async function findRiotAccount(
  name: string,
  tag: string,
): Promise<RiotAccountLookup> {
  for (const candidate of AUTO_ROUTING_REGIONS) {
    try {
      const account = await getRiotAccountFromRouting(
        name,
        tag,
        candidate.routingRegion,
        candidate.region,
      );
      return { account, region: candidate.region };
    } catch (error) {
      if (error instanceof RiotApiError && error.status === 404) continue;
      throw error;
    }
  }

  throw new RiotApiError(
    `Riot ID ${name}#${tag} was not found in Asia, Americas, or Europe. Check the spelling or choose a region manually.`,
    404,
  );
}

export async function getMatchList(
  puuid: string,
  region: Region,
  startIndex = 0,
  endIndex = 10,
  queue?: string,
): Promise<MatchList> {
  const platform = PLATFORM_REGIONS[region];
  const search = new URLSearchParams({
    startIndex: startIndex.toString(),
    endIndex: endIndex.toString(),
  });
  if (queue) search.set("queue", queue);

  return riotRequest<MatchList>(
    `https://${platform}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${encodeURIComponent(puuid)}?${search}`,
    { revalidate: 300, tag: `matches:${region}:${puuid}:${startIndex}:${endIndex}` },
  );
}

export async function getMatch(
  matchId: string,
  region: Region,
): Promise<RiotMatch> {
  const platform = PLATFORM_REGIONS[region];
  return riotRequest<RiotMatch>(
    `https://${platform}.api.riotgames.com/val/match/v1/matches/${encodeURIComponent(matchId)}`,
    { revalidate: false, tag: `match:${region}:${matchId}` },
  );
}

export async function getRecentMatches(
  puuid: string,
  region: Region,
  count = 10,
): Promise<RiotMatch[]> {
  const list = await getMatchList(puuid, region, 0, count);
  const matches: RiotMatch[] = [];
  let firstError: unknown;

  for (let index = 0; index < list.history.length; index += 5) {
    const batch = list.history.slice(index, index + 5);
    const results = await Promise.allSettled(
      batch.map((reference) => getMatch(reference.matchId, region)),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        matches.push(result.value);
      } else {
        firstError ??= result.reason;
      }
    }
  }

  if (list.history.length > 0 && matches.length === 0 && firstError) {
    throw firstError;
  }

  return matches;
}

export async function getLeaderboard(
  region: Region,
  actId: string,
  size = 200,
): Promise<Leaderboard> {
  const platform = PLATFORM_REGIONS[region];
  return riotRequest<Leaderboard>(
    `https://${platform}.api.riotgames.com/val/ranked/v1/leaderboards/by-act/${encodeURIComponent(actId)}?size=${Math.min(200, Math.max(1, size))}&startIndex=0`,
    { revalidate: 600, tag: `leaderboard:${region}:${actId}:${size}` },
  );
}

export async function getPlatformStatus(
  region: Region,
): Promise<RiotPlatformStatus> {
  const platform = PLATFORM_REGIONS[region];
  return riotRequest<RiotPlatformStatus>(
    `https://${platform}.api.riotgames.com/val/status/v1/platform-data`,
    { revalidate: 60, tag: `platform-status:${region}` },
  );
}

export function getStatusText(
  translations: RiotStatusTranslation[],
  locale = "en_US",
): string {
  return (
    translations.find((item) => item.locale === locale)?.content ??
    translations.find((item) => item.locale === "en_US")?.content ??
    translations[0]?.content ??
    "Riot service notice"
  );
}

export function isActiveStatusNotice(
  notice: RiotStatusNotice,
  now = Date.now(),
): boolean {
  const archiveTime = notice.archive_at
    ? new Date(notice.archive_at).getTime()
    : null;
  const hasPublishedUpdate = notice.updates.some((update) => update.publish);

  if (archiveTime !== null && archiveTime <= now) return false;
  if (notice.maintenance_status === "complete") return false;

  return hasPublishedUpdate;
}

export function getParticipantHeadshotRate(
  match: RiotMatch,
  puuid: string,
): number {
  let head = 0;
  let body = 0;
  let leg = 0;

  for (const round of match.roundResults) {
    const stats = round.playerStats.find((player) => player.puuid === puuid);
    if (!stats) continue;

    for (const damage of stats.damage) {
      head += damage.headshots;
      body += damage.bodyshots;
      leg += damage.legshots;
    }
  }

  const total = head + body + leg;
  return total === 0 ? 0 : (head / total) * 100;
}

export function getParticipantDamage(match: RiotMatch, puuid: string): number {
  let total = 0;

  for (const round of match.roundResults) {
    const stats = round.playerStats.find((player) => player.puuid === puuid);
    if (!stats) continue;
    for (const damage of stats.damage) total += damage.damage;
  }

  return total;
}
