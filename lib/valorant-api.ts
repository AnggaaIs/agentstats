const API_URL = "https://valorant-api.com/v1";

interface ApiEnvelope<T> {
  data: T;
  status: number;
}

export interface Agent {
  uuid: string;
  displayName: string;
  description: string;
  developerName: string;
  displayIcon: string;
  fullPortrait: string | null;
  background: string | null;
  role: {
    displayName: string;
    displayIcon: string;
  } | null;
  abilities: Array<{
    slot: string;
    displayName: string;
    description: string;
    displayIcon: string | null;
  }>;
}

export interface Weapon {
  uuid: string;
  displayName: string;
  displayIcon: string;
  category: string;
  shopData: {
    cost: number;
    category: string;
  } | null;
  weaponStats: {
    fireRate: number;
    magazineSize: number;
    reloadTimeSeconds: number;
    equipTimeSeconds: number;
    damageRanges: Array<{
      rangeStartMeters: number;
      rangeEndMeters: number;
      headDamage: number;
      bodyDamage: number;
      legDamage: number;
    }>;
  } | null;
  skins: Array<{
    uuid: string;
    displayName: string;
    displayIcon: string | null;
  }>;
}

export interface ValorantMap {
  uuid: string;
  displayName: string;
  splash: string;
  displayIcon: string | null;
  mapUrl: string;
  coordinates: string | null;
  tacticalDescription: string | null;
}

export interface Season {
  uuid: string;
  displayName: string;
  type: string | null;
  startTime: string;
  endTime: string;
}

export interface ValorantVersion {
  manifestId: string;
  branch: string;
  version: string;
  buildVersion: string;
  engineVersion: string;
  riotClientVersion: string;
  riotClientBuild: string;
  buildDate: string;
}

async function getApiData<T>(path: string, cache = true): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    cache
      ? { next: { revalidate: 86_400, tags: [`valorant-api:${path}`] } }
      : { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Valorant API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export async function getAgents(): Promise<Agent[]> {
  return getApiData<Agent[]>("/agents?isPlayableCharacter=true");
}

export async function getAgent(uuid: string): Promise<Agent> {
  return getApiData<Agent>(`/agents/${encodeURIComponent(uuid)}`);
}

export async function getWeapons(): Promise<Weapon[]> {
  // The full weapon index includes every skin and exceeds Next.js' 2 MB fetch cache limit.
  return getApiData<Weapon[]>("/weapons", false);
}

export async function getWeapon(uuid: string): Promise<Weapon> {
  return getApiData<Weapon>(`/weapons/${encodeURIComponent(uuid)}`);
}

export async function getMaps(): Promise<ValorantMap[]> {
  const maps = await getApiData<ValorantMap[]>("/maps");
  return maps.filter((map) => map.splash && map.displayName !== "The Range");
}

export async function getSeasons(): Promise<Season[]> {
  return getApiData<Season[]>("/seasons");
}

export async function getCurrentAct(): Promise<Season> {
  const seasons = await getSeasons();
  const now = Date.now();
  const act = seasons.find((season) => {
    const startsAt = Date.parse(season.startTime);
    const endsAt = Date.parse(season.endTime);
    return (
      season.type === "EAresSeasonType::Act" &&
      startsAt <= now &&
      endsAt >= now
    );
  });

  if (!act) {
    throw new Error("The current Valorant act could not be found.");
  }

  return act;
}

export async function getValorantVersion(): Promise<ValorantVersion> {
  return getApiData<ValorantVersion>("/version");
}
