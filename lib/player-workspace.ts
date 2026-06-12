import "server-only";

import { buildPlayerSummary } from "@/lib/player-stats";
import { getRecentMatches } from "@/lib/riot";
import {
  getAgents,
  getMaps,
  getWeapon,
} from "@/lib/valorant-api";

export async function getPlayerWorkspaceSummary({
  puuid,
  region,
}: {
  puuid: string;
  region: "ap" | "na" | "eu" | "kr" | "br" | "latam";
}) {
  const [agentsResult, mapsResult, matches] = await Promise.all([
    getAgents().catch(() => []),
    getMaps().catch(() => []),
    getRecentMatches(puuid, region, 20),
  ]);
  const initial = buildPlayerSummary(
    puuid,
    matches,
    agentsResult,
    mapsResult,
  );
  const weaponResults = await Promise.allSettled(
    initial.weapons.slice(0, 12).map((weapon) => getWeapon(weapon.id)),
  );
  const weapons = weaponResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  return {
    matches,
    summary: buildPlayerSummary(
      puuid,
      matches,
      agentsResult,
      mapsResult,
      weapons,
    ),
  };
}
