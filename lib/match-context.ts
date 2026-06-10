import type {
  ValorantEvent,
  ValorantGameMode,
} from "@/lib/valorant-api";

const QUEUE_MODE_NAMES: Record<string, string> = {
  competitive: "Standard",
  custom: "Standard",
  deathmatch: "Deathmatch",
  ggteam: "Escalation",
  hurm: "Team Deathmatch",
  newmap: "Standard",
  onefa: "Replication",
  snowball: "Snowball Fight",
  spikerush: "Spike Rush",
  swiftplay: "Swiftplay",
  unrated: "Standard",
};

export function formatQueueName(queueId: string): string {
  if (!queueId) return "Custom match";

  return queueId
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function resolveGameMode(
  modes: ValorantGameMode[],
  queueId: string,
  gameMode?: string,
): ValorantGameMode | null {
  const expectedName = QUEUE_MODE_NAMES[queueId.toLocaleLowerCase()];
  const normalizedMode = gameMode?.toLocaleLowerCase() ?? "";
  const modeFolder =
    normalizedMode.match(/\/gamemodes\/([^/]+)/)?.[1] ??
    normalizedMode.match(/gamemodes::([^/]+)/)?.[1] ??
    "";

  return (
    modes.find(
      (mode) =>
        expectedName &&
        mode.displayName.toLocaleLowerCase() === expectedName.toLocaleLowerCase(),
    ) ??
    modes.find((mode) => {
      const displayName = mode.displayName.toLocaleLowerCase();
      const assetPath = mode.assetPath.toLocaleLowerCase();
      return (
        normalizedMode.length > 0 &&
        (normalizedMode.includes(displayName.replaceAll(" ", "")) ||
          (modeFolder.length > 0 &&
            assetPath.includes(`/gamemodes/${modeFolder}/`)))
      );
    }) ??
    null
  );
}

export function getEventAt(
  events: ValorantEvent[],
  timestamp: number,
): ValorantEvent | null {
  return (
    events.find((event) => {
      const start = Date.parse(event.startTime);
      const end = Date.parse(event.endTime);
      return start <= timestamp && end >= timestamp;
    }) ?? null
  );
}
