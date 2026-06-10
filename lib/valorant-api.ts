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
    runSpeedMultiplier: number;
    reloadTimeSeconds: number;
    equipTimeSeconds: number;
    firstBulletAccuracy: number;
    shotgunPelletCount: number;
    wallPenetration: string;
    feature: string | null;
    fireMode: string | null;
    altFireType: string | null;
    adsStats: {
      zoomMultiplier: number;
      fireRate: number;
      runSpeedMultiplier: number;
      burstCount: number;
      firstBulletAccuracy: number;
    } | null;
    altShotgunStats: {
      shotgunPelletCount: number;
      burstRate: number;
    } | null;
    airBurstStats: {
      shotgunPelletCount: number;
      burstDistance: number;
    } | null;
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
    themeUuid: string;
    contentTierUuid: string | null;
    displayIcon: string | null;
    wallpaper: string | null;
    chromas: WeaponSkinChroma[];
    levels: WeaponSkinLevel[];
  }>;
}

export interface WeaponSkinChroma {
  uuid: string;
  displayName: string;
  displayIcon: string | null;
  fullRender: string;
  swatch: string | null;
  streamedVideo: string | null;
}

export interface WeaponSkinLevel {
  uuid: string;
  displayName: string;
  levelItem: string | null;
  displayIcon: string | null;
  streamedVideo: string | null;
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

export interface CompetitiveAct extends Season {
  seasonDisplayName: string | null;
  displayLabel: string;
  isCurrent: boolean;
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

export interface CompetitiveTier {
  tier: number;
  tierName: string;
  divisionName: string;
  color: string;
  backgroundColor: string;
  smallIcon: string | null;
  largeIcon: string | null;
}

interface CompetitiveTierCollection {
  uuid: string;
  assetObjectName: string;
  tiers: CompetitiveTier[];
}

export interface ContentTier {
  uuid: string;
  displayName: string;
  devName: string;
  rank: number;
  highlightColor: string;
  displayIcon: string;
}

export interface ValorantBundle {
  uuid: string;
  displayName: string;
  displayNameSubText: string | null;
  description: string;
  extraDescription: string | null;
  promoDescription: string | null;
  displayIcon: string;
  displayIcon2: string;
  displayIcon3: string | null;
  logoIcon: string | null;
  verticalPromoImage: string | null;
}

export interface ValorantGameMode {
  uuid: string;
  displayName: string;
  description: string | null;
  duration: string | null;
  economyType: string | null;
  allowsMatchTimeouts: boolean;
  isTeamVoiceAllowed: boolean;
  isMinimapHidden: boolean;
  orbCount: number;
  roundsPerHalf: number;
  displayIcon: string | null;
  listViewIconTall: string | null;
  assetPath: string;
}

export interface ValorantEvent {
  uuid: string;
  displayName: string;
  shortDisplayName: string;
  startTime: string;
  endTime: string;
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

export async function getWeaponSkinLevel(
  uuid: string,
): Promise<WeaponSkinLevel> {
  return getApiData<WeaponSkinLevel>(
    `/weapons/skinlevels/${encodeURIComponent(uuid)}`,
  );
}

export async function getWeaponSkinChroma(
  uuid: string,
): Promise<WeaponSkinChroma> {
  return getApiData<WeaponSkinChroma>(
    `/weapons/skinchromas/${encodeURIComponent(uuid)}`,
  );
}

export async function getMaps(): Promise<ValorantMap[]> {
  const maps = await getApiData<ValorantMap[]>("/maps");
  return maps.filter((map) => map.splash && map.displayName !== "The Range");
}

export async function getMap(uuid: string): Promise<ValorantMap> {
  return getApiData<ValorantMap>(`/maps/${encodeURIComponent(uuid)}`);
}

export async function getSeasons(): Promise<Season[]> {
  return getApiData<Season[]>("/seasons");
}

function formatSeasonName(displayName: string): string {
  const yearMatch = /^V(\d{2})$/i.exec(displayName);
  return yearMatch ? `Season 20${yearMatch[1]}` : displayName;
}

function enrichAct(
  act: Season,
  seasons: Season[],
  now: number,
): CompetitiveAct {
  const actStartsAt = Date.parse(act.startTime);
  const actEndsAt = Date.parse(act.endTime);
  const parentSeason = seasons
    .filter((season) => {
      const startsAt = Date.parse(season.startTime);
      const endsAt = Date.parse(season.endTime);
      return (
        season.uuid !== act.uuid &&
        season.type !== "EAresSeasonType::Act" &&
        startsAt <= actStartsAt &&
        endsAt >= actEndsAt
      );
    })
    .sort(
      (left, right) =>
        Date.parse(left.endTime) -
        Date.parse(left.startTime) -
        (Date.parse(right.endTime) - Date.parse(right.startTime)),
    )[0];
  const seasonDisplayName = parentSeason
    ? formatSeasonName(parentSeason.displayName)
    : null;

  return {
    ...act,
    seasonDisplayName,
    displayLabel: seasonDisplayName
      ? `${seasonDisplayName} / ${act.displayName}`
      : act.displayName,
    isCurrent: actStartsAt <= now && actEndsAt >= now,
  };
}

export async function getCompetitiveActs(): Promise<CompetitiveAct[]> {
  const seasons = await getSeasons();
  const now = Date.now();
  return seasons
    .filter(
      (season) =>
        season.type === "EAresSeasonType::Act" &&
        Date.parse(season.startTime) <= now,
    )
    .sort(
      (left, right) =>
        Date.parse(right.startTime) - Date.parse(left.startTime),
    )
    .map((act) => enrichAct(act, seasons, now));
}

export async function getCurrentAct(): Promise<CompetitiveAct> {
  const acts = await getCompetitiveActs();
  const act = acts.find((item) => item.isCurrent);

  if (!act) {
    throw new Error("The current Valorant act could not be found.");
  }

  return act;
}

export async function getValorantVersion(): Promise<ValorantVersion> {
  return getApiData<ValorantVersion>("/version");
}

export async function getCompetitiveTiers(): Promise<CompetitiveTier[]> {
  const collections =
    await getApiData<CompetitiveTierCollection[]>("/competitivetiers");
  return collections.at(-1)?.tiers ?? [];
}

export async function getContentTiers(): Promise<ContentTier[]> {
  const tiers = await getApiData<ContentTier[]>("/contenttiers");
  return tiers.toSorted((left, right) => left.rank - right.rank);
}

export async function getBundles(): Promise<ValorantBundle[]> {
  return getApiData<ValorantBundle[]>("/bundles");
}

export async function getBundle(uuid: string): Promise<ValorantBundle> {
  return getApiData<ValorantBundle>(`/bundles/${encodeURIComponent(uuid)}`);
}

export async function getGameModes(): Promise<ValorantGameMode[]> {
  return getApiData<ValorantGameMode[]>("/gamemodes");
}

export async function getEvents(): Promise<ValorantEvent[]> {
  return getApiData<ValorantEvent[]>("/events");
}
